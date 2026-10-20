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
 *    CRWV wheel carries the ◆ row's conviction (#4642) and CRWV-LONG-CALL carries its own, both
 *    checked 2027-01-29, the date the AI-dip record holds. Unmarked and idempotent, like the row
 *    carry beside it (`row-conviction.ts`): an invariant re-read each poll, no write when nothing
 *    needs a pointer.
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
 * dropped and the seeded match above runs again, so a pair returns to how it ran before. One rule,
 * applied on the hand-over itself and again on every poll, so a write that failed halfway heals on
 * the next poll instead of leaving a pair pointing at a view its owner took back.
 *
 * Every pointer that moves is reported (`PointerMove`), and the dashboard writes each as a line in
 * the bot's settings change log (`server/conviction-pointer-changes.ts`), so which view steers a pair
 * is never changed unrecorded.
 *
 * The inline `conviction` is never removed here — that is the contract step, after the bots are
 * confirmed reading these pointers.
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
 * `sub`, pointed at its record when it has none yet and its conviction matches one. A pointer
 * already there is never replaced or dropped — except by a member's view (`members`): one handed to
 * this account that steers the pair is the pointer, and a pointer at a member's view that is not
 * (taken back, edited, deleted, or steering other pairs) is dropped before the seeded match runs.
 * `sub` itself is returned when nothing changes.
 */
export function pointAtRecord(
  sub: PlaybookSubscription,
  records?: readonly Conviction[],
  members?: HeldHere,
): PlaybookSubscription {
  const own = members?.held.filter((r) => r.steers.includes(sub.playbookId)) ?? [];
  const id = sub.convictionId;
  const [only] = own;
  if (only && own.length === 1) return id === only.id ? sub : { ...sub, convictionId: only.id };
  // Two of a member's views on one pair: the hand-over refuses that, so it is never decided here.
  if (id !== undefined && own.some((r) => r.id === id)) return sub;
  if (id !== undefined && members?.ids.has(id)) {
    const { convictionId: _taken, ...rest } = sub;
    return pointAtRecord(rest, records);
  }
  if (id !== undefined || !sub.conviction) return sub;
  const record = recordFor(sub.playbookId, sub.conviction, records);
  return record ? { ...sub, convictionId: record.id } : sub;
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
 * Pure: `state` with a pointer on every subscription whose conviction matches a record and that
 * has none, and with members' views applied (`pointAtRecord`). A subscription with a seeded pointer
 * already (even one the store cannot resolve), with no conviction, or matching no record is
 * untouched. When nothing changes, `state` is the very object passed in, so a second run — or the
 * common poll — writes nothing. `pointed` names every subscription whose pointer changed.
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
