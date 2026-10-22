import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
import type { SubscriptionsState } from "./subscription-state.js";

/**
 * A SUBSCRIPTION'S CONVICTION, POINTING AT ITS RECORD (#5482 slice 2, the MIGRATE step of
 * expand / migrate / contract — the order #4469 slice 3c used for the v1 -> v2 wire). Slice 2's
 * expand (#5511) gave a subscription an optional `convictionId` and taught the bots to read it
 * from `subscriptions.v3`. This file writes it, two ways:
 *
 *  - ON A WRITE. A subscribe or a conviction edit that states a conviction points the subscription
 *    at the record that view is (`restated`); an edit of anything else adds a missing pointer but
 *    never drops one (`pointAtRecord`).
 *  - ON THE POLL, for what was written before any of this existed (`pointAtRecords`): the live
 *    CRWV wheel carried the ◆ row's conviction (#4642) and CRWV-LONG-CALL its own, both checked
 *    2027-01-29, the date the AI-dip record holds. Unmarked and idempotent, like the row carry
 *    beside it (`row-conviction.ts`): an invariant re-read each poll, no write when nothing needs
 *    a pointer.
 *
 * WHEN A CONVICTION "MATCHES" A RECORD: the record steers the subscription's pair and states the
 * same check day. That is the whole test, and it is why pointing changes no check: the date the
 * bots read is the date the subscription already had. A subscription whose conviction states
 * another day, or that no record steers, matches nothing and keeps its inline conviction, exactly
 * as before. Two records matching at once is not a match either: which view the pair belongs to
 * is not this file's call, so it stays inline.
 *
 * A MEMBER'S VIEW, HANDED OVER, MATCHES BY ITS OWNER'S ACT (#5482 slice 6c). When a member hands a
 * view to their bots (`member-conviction-store.ts`), it names the accounts it may steer. On those
 * accounts it is the pointer of every subscription to a pair it steers — whatever day the inline
 * conviction states, and over a seeded record's pointer, because the hand-over is the owner saying
 * so (`MemberPointers`). Taken back, edited or deleted, it stops being held, and a pointer at it is
 * dropped and the seeded match above runs again, so a pair returns to the seeded view that steers
 * it. (An owner's own day from before the hand-over is not restored: no inline copy sits beside a
 * held view, and the seeded view only ever narrows more.) One rule,
 * applied on the hand-over itself and again on every poll, so a write that failed halfway heals on
 * the next poll instead of leaving a pair pointing at a view its owner took back.
 *
 * Every pointer that moves is reported (`PointerMove`), and the dashboard writes each as a line in
 * the bot's settings change log (`server/conviction-pointer-changes.ts`), so which view steers a pair
 * is never changed unrecorded.
 *
 * THE CONTRACT STEP, PIECE 2 (#5482). The bots read a pointed pair's check from the pointer alone
 * (#5911, bots first), which is why a stale pointer is dropped here (`isStale`) rather than left to
 * hold its pair exits-only. This half is the app's: a pointer this rule can resolve carries no
 * inline copy, on a write and on the poll alike (`contracted`). With no copy to match by day, a
 * subscription that states no conviction is pointed at the one record that steers its pair
 * (`steeringRecord`) — how a ◆ row's new subscription reaches its view, and where a take-back
 * returns. The inline conviction stays where it is the only check: an owner's own day that no
 * record states (the resume after a failed check, #4469 criterion 12), and a pair no record steers
 * (#4469 criterion 2). Which view steers a pair is decided once, by the pointer.
 *
 * PIECE 3, THE APP'S HALF: the owner's own day and a pair no record steers now live as a view
 * stated on that one pair (`pair-conviction.ts`), held on the owner's account like any view handed
 * over, so the member branch above points at it. A member's broader view on the same pair outranks
 * it — the hand-over takes the pair over, and a take-back returns it to the owner's own day, which
 * stays held underneath (the take-back no longer falls through to the seeded view for that case).
 * What was written inline before that moves onto the same kind of view on the poll
 * (`pair-conviction-migration.ts`), so the member branch points at it there too.
 */

/** Members' views as the pointer rule reads them: the ones handed to an account, and every id. */
export interface MemberPointers {
  /** The views handed over that may steer this account. */
  readonly heldBy: (accountId: string) => readonly Conviction[];
  /** Every member view's id, held or not — a pointer at one not held for the pair is dropped. */
  readonly ids: ReadonlySet<string>;
}

/** One account's slice of `MemberPointers`. */
interface HeldHere {
  readonly held: readonly Conviction[];
  readonly ids: ReadonlySet<string>;
}

/** The one record that steers `playbookId` and is checked on `conviction`'s day, or undefined. */
export function recordFor(
  playbookId: string,
  conviction: SubscriptionConviction,
  records: readonly Conviction[] = CONVICTIONS.all(),
): Conviction | undefined {
  const matching = records.filter(
    (record) => record.steers.includes(playbookId) && record.checkOn === conviction.checkOn,
  );
  return matching.length === 1 ? matching[0] : undefined;
}

/**
 * The one record that steers `playbookId`, whatever day it is checked, or undefined (none, or two).
 * The pointer of a subscription that states no conviction and has no pointer (contract piece 2): a
 * ◆ row's new subscription, or a pair whose member view was taken back. Both carried the row's or
 * the old inline day before; with no inline copy left, "steers" is the only match there is.
 */
export function steeringRecord(
  playbookId: string,
  records: readonly Conviction[] = CONVICTIONS.all(),
): Conviction | undefined {
  const steering = records.filter((record) => record.steers.includes(playbookId));
  return steering.length === 1 ? steering[0] : undefined;
}

/** `sub` without its inline conviction — the pointer is the whole check — or `sub` itself when it
 *  carries none, so a pass that changed nothing still returns the very object. */
function contracted(sub: PlaybookSubscription): PlaybookSubscription {
  if (!sub.conviction) return sub;
  const { conviction: _inline, ...rest } = sub;
  return rest;
}

/**
 * A pointer no view can ever answer for this pair (the contract step's piece 2): one at a seeded
 * record that does not steer it, or — only where members' ids are known, so a member's view is
 * never mistaken for one — at an id no record holds. The bots read a pointed pair's check from its
 * pointer alone and run it exits-only while the pointer is unusable (`statedCheck`, `steeredBy`),
 * so a stale one left in place would hold its pair shut for good after a build changed a record.
 */
function isStale(
  playbookId: string,
  id: string,
  records: readonly Conviction[] = CONVICTIONS.all(),
  members?: HeldHere,
): boolean {
  const record = records.find((r) => r.id === id);
  return record ? !record.steers.includes(playbookId) : members !== undefined;
}

/**
 * `sub`, pointed at its record when it has none yet: the record its conviction matches, or — when
 * it states none — the one record that steers its pair (`steeringRecord`). A pointer already there
 * is never replaced or dropped — except by a member's view (`members`): one handed to this account
 * that steers the pair is the pointer, and a pointer at a member's view that is not (taken back,
 * edited, deleted, or steering other pairs) is dropped before the seeded match runs. A stale pointer
 * (`isStale`) is dropped the same way, so the pair returns to the record that steers it, or to its
 * own conviction.
 *
 * A pointer this rule can resolve — a seeded record or a member's view held here, either steering
 * the pair — leaves no inline conviction beside it (`contracted`, the contract step's piece 2): the
 * bots never read one on a pointed pair, so a second copy could only drift. A pointer it cannot
 * resolve (an id this build does not hold, with no members' ids to judge it by) keeps the inline
 * copy, because that is the case where the app cannot tell what the pointer says. `sub` itself is
 * returned when nothing changes.
 */
export function pointAtRecord(
  sub: PlaybookSubscription,
  records?: readonly Conviction[],
  members?: HeldHere,
): PlaybookSubscription {
  const steering = members?.held.filter((r) => r.steers.includes(sub.playbookId)) ?? [];
  // A view handed over outranks the owner's own view on the pair: the hand-over takes the pair
  // over, and a take-back returns it to their own day, which stays held underneath.
  const broad = steering.filter((r) => r.scope !== "pair");
  const own = broad.length > 0 ? broad : steering;
  const id = sub.convictionId;
  const [only] = own;
  if (only && own.length === 1) {
    return contracted(id === only.id ? sub : { ...sub, convictionId: only.id });
  }
  // Two of a member's views on one pair: the hand-over refuses that, so it is never decided here.
  if (id !== undefined && own.some((r) => r.id === id)) return sub;
  if (id !== undefined && (members?.ids.has(id) || isStale(sub.playbookId, id, records, members))) {
    const { convictionId: _taken, ...rest } = sub;
    return pointAtRecord(rest, records);
  }
  if (id !== undefined) {
    const steers = (records ?? CONVICTIONS.all()).some(
      (r) => r.id === id && r.steers.includes(sub.playbookId),
    );
    return steers ? contracted(sub) : sub;
  }
  const record = sub.conviction
    ? recordFor(sub.playbookId, sub.conviction, records)
    : steeringRecord(sub.playbookId, records);
  return record ? contracted({ ...sub, convictionId: record.id }) : sub;
}

/** The members' views as one account reads them, or nothing when none were passed. */
export function heldHere(
  members: MemberPointers | undefined,
  accountId: string,
): HeldHere | undefined {
  return members ? { held: members.heldBy(accountId), ids: members.ids } : undefined;
}

/**
 * `sub`, whose conviction was just stated or changed: its pointer is recomputed from the new
 * conviction, so a pointer never outlives the view it described. The record the new conviction
 * matches, else none — an owner who sets a day no record holds is checked on that day, not on the
 * record's (`statedCheck` reads the record first).
 */
export function restated(
  sub: PlaybookSubscription,
  records?: readonly Conviction[],
  members?: HeldHere,
): PlaybookSubscription {
  const { convictionId: _stale, ...rest } = sub;
  return pointAtRecord(rest, records, members);
}

/** One subscription's pointer, before and after a pass; an absent id is no pointer. */
export interface PointerMove {
  readonly accountId: string;
  readonly playbookId: string;
  readonly from?: string;
  readonly to?: string;
}

export interface Pointed {
  readonly state: SubscriptionsState;
  /** `account/playbookId`, one per subscription whose pointer changed. */
  readonly pointed: readonly string[];
  /** The same subscriptions, with the pointer each had and has — what the change log records. */
  readonly moves: readonly PointerMove[];
}

const optionalId = (key: "from" | "to", id: string | undefined) =>
  id === undefined ? {} : { [key]: id };

/** The move from `before` to `after`, or undefined when its pointer stayed put. */
export function pointerMove(
  accountId: string,
  before: PlaybookSubscription | undefined,
  after: PlaybookSubscription | undefined,
): PointerMove | undefined {
  const from = before?.convictionId;
  const to = after?.convictionId;
  const playbookId = after?.playbookId ?? before?.playbookId;
  if (from === to || playbookId === undefined) return undefined;
  return { accountId, playbookId, ...optionalId("from", from), ...optionalId("to", to) };
}

/**
 * Pure: `state` with a pointer on every subscription that has none and whose conviction matches a
 * record (or, stating none, whose pair one record steers), with members' views applied, and with
 * the inline copy dropped wherever the pointer resolves (`pointAtRecord`). A subscription with an
 * unresolvable seeded pointer, or matching no record, is untouched. When nothing changes, `state`
 * is the very object passed in, so a second run — or the common poll — writes nothing. `pointed`
 * names every subscription that changed; `moves`, those whose pointer did.
 */
export function pointAtRecords(
  state: SubscriptionsState,
  at: Date,
  records: readonly Conviction[] = CONVICTIONS.all(),
  members?: MemberPointers,
): Pointed {
  const pointed: string[] = [];
  const moves: PointerMove[] = [];
  const next: Record<string, readonly PlaybookSubscription[]> = {};
  for (const [accountId, subs] of Object.entries(state)) {
    const here = heldHere(members, accountId);
    next[accountId] = subs.map((sub) => {
      const withPointer = pointAtRecord(sub, records, here);
      if (withPointer === sub) return sub;
      pointed.push(`${accountId}/${sub.playbookId}`);
      const move = pointerMove(accountId, sub, withPointer);
      if (move) moves.push(move);
      return { ...withPointer, updatedAt: at.toISOString() };
    });
  }
  return pointed.length > 0 ? { state: next, pointed, moves } : { state, pointed, moves };
}
