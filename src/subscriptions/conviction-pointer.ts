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
 * is not this file's call, so it stays inline. Who the record's owner is plays no part yet;
 * a member-written conviction (slice 6) brings owners to the match.
 *
 * The inline `conviction` is never removed here — that is the contract step, after the bots are
 * confirmed reading these pointers.
 */

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

/** `sub`, pointed at its record when it has none yet and its conviction matches one. A pointer
 *  already there is never replaced or dropped; `sub` itself is returned when nothing changes. */
export function pointAtRecord(
  sub: PlaybookSubscription,
  records?: readonly Conviction[],
): PlaybookSubscription {
  if (sub.convictionId !== undefined || !sub.conviction) return sub;
  const record = recordFor(sub.playbookId, sub.conviction, records);
  return record ? { ...sub, convictionId: record.id } : sub;
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
): PlaybookSubscription {
  const { convictionId: _stale, ...rest } = sub;
  return pointAtRecord(rest, records);
}

export interface Pointed {
  readonly state: SubscriptionsState;
  /** `account/playbookId`, one per subscription that gained a pointer. */
  readonly pointed: readonly string[];
}

/**
 * Pure: `state` with a pointer on every subscription whose conviction matches a record and that
 * has none. A subscription with a pointer already (even one the store cannot resolve), with no
 * conviction, or matching no record is untouched. When nothing is pointed, `state` is the very
 * object passed in, so a second run — or the common poll — writes nothing.
 */
export function pointAtRecords(
  state: SubscriptionsState,
  at: Date,
  records: readonly Conviction[] = CONVICTIONS.all(),
): Pointed {
  const pointed: string[] = [];
  const next: Record<string, readonly PlaybookSubscription[]> = {};
  for (const [accountId, subs] of Object.entries(state)) {
    next[accountId] = subs.map((sub) => {
      const withPointer = pointAtRecord(sub, records);
      if (withPointer === sub) return sub;
      pointed.push(`${accountId}/${sub.playbookId}`);
      return { ...withPointer, updatedAt: at.toISOString() };
    });
  }
  return pointed.length > 0 ? { state: next, pointed } : { state, pointed };
}
