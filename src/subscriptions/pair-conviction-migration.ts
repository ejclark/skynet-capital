import { marketDayKey } from "../domain/market-day.js";
import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import { parseStoredConviction } from "../playbooks/conviction-parse.js";
import { type Conviction, convictionProblems } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
import { findPair, type Pair } from "../playbooks/pair-table.js";
import { heldHere, type MemberPointers, pointAtRecord } from "./conviction-pointer.js";
import { pairView } from "./pair-conviction.js";
import { rowConviction } from "./row-conviction.js";
import type { SubscriptionsState } from "./subscription-state.js";

/**
 * THE POLL MIGRATION (#5482 contract piece 3, after #5947's write path). The forms now keep an
 * owner's reason and check day as their own view on the pair (`pair-conviction.ts`); this moves
 * what was written before that onto the same kind of view, so every pair is checked by a pointer:
 *
 *  - an owner's own day that no record states (the resume after a failed check, #4469 c12);
 *  - a pair no record steers (a stand-aside pair taken on the owner's conviction, #4469 c2);
 *  - a ◆ row's conviction no single record steers, which the row carry would have written inline
 *    (`row-conviction.ts`) — written as a view instead, the carry kept only as the fallback.
 *
 * Which subscriptions: the ones the pointer rule leaves with no pointer (`pointAtRecord`, applied
 * with members' views as they stand), so a pair a seeded record or a member's view already steers
 * is never touched. The pointer pass after this one points each at its new view and logs the move
 * (`pointAtRecords`), so this file only says which views to write.
 *
 * Kept vs changed: kept the decision (the owner's labelled reason, checked on their day, #4469);
 * changed the mechanism (a view, not an inline copy). The view says exactly what the inline copy
 * did, and the bots check it the same way (#5939).
 *
 * Two defaults, from the state block: the owner's name is not known from an account, so it is the
 * account's bot name (`ownerOf`); and a view must be stated before its check day, so one whose day
 * already passed (a latched failure) is stated on the subscription's start day, else the day before
 * its check (`statedOnFor`). A view the store's rules would refuse (a pair no row holds), or the
 * views file could not read back (an inline reason past a stored claim's length), is not written:
 * the subscription keeps its inline copy rather than leave the file unreadable, which refuses
 * every member's write. Since piece 4 the bots never read that copy: on a pair the table knows it
 * runs exits-only and its row says so (`isUnmovedInline`); on an id that is no pair it was never
 * checked, and still is not.
 */

/** One view to write on one account, and the subscription it is for. */
export interface OwnViewToState {
  readonly accountId: string;
  readonly playbookId: string;
  readonly view: Conviction;
}

/** The calendar day before `day` (`YYYY-MM-DD`). */
const dayBefore = (day: string): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * The day a migrated view is stated: today, or — when today is on or after its check day, which a
 * view may not be — the subscription's start day, else the day before the check.
 */
export function statedOnFor(sub: PlaybookSubscription, checkOn: string, at: Date): string {
  const today = marketDayKey(at.toISOString());
  if (today < checkOn) return today;
  const started = marketDayKey(sub.createdAt);
  return started < checkOn ? started : dayBefore(checkOn);
}

/** The conviction `sub` is checked on with no pointer: its inline copy, else its ◆ row's. */
function unpointedConviction(
  sub: PlaybookSubscription,
  records: readonly Conviction[],
  members: MemberPointers,
  lookup: (id: string) => Pair | undefined,
): SubscriptionConviction | undefined {
  const pointed = pointAtRecord(sub, records, heldHere(members, sub.accountId));
  if (pointed.convictionId !== undefined) return undefined;
  return pointed.conviction ?? rowConviction(lookup(sub.playbookId));
}

/**
 * Pure: the owner's own view for every subscription the pointer rule leaves unpointed with a
 * conviction to check (its inline copy, or its ◆ row's), in file order. Empty on the common poll.
 */
export function ownViewsToState(
  state: SubscriptionsState,
  at: Date,
  members: MemberPointers,
  ownerOf: (accountId: string) => string,
  records: readonly Conviction[] = CONVICTIONS.all(),
  lookup: (id: string) => Pair | undefined = findPair,
): readonly OwnViewToState[] {
  const out: OwnViewToState[] = [];
  for (const [accountId, subs] of Object.entries(state)) {
    for (const sub of subs) {
      const conviction = unpointedConviction({ ...sub, accountId }, records, members, lookup);
      if (!conviction) continue;
      const view = pairView({
        accountId,
        playbookId: sub.playbookId,
        conviction,
        owner: ownerOf(accountId),
        statedOn: statedOnFor(sub, conviction.checkOn, at),
      });
      if (convictionProblems(view, lookup).length > 0 || !parseStoredConviction(view)) continue;
      out.push({ accountId, playbookId: sub.playbookId, view });
    }
  }
  return out;
}
