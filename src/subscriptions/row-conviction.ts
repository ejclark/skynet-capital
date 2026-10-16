import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import { findPair, type Pair, pairName } from "../playbooks/pair-table.js";
import type { SubscriptionsState } from "./subscription-state.js";

/**
 * A ◆ ROW'S CONVICTION, ON THE SUBSCRIPTIONS THAT TRADE IT (#4469 slice 3c part 3). Until part 3 a
 * conviction lived only on the pair row — `CRWV-WHEEL` ◆, checked 2027-01-29, Eric's call against
 * the study's stand-aside (#4642) — and nothing switched the pair off if the check failed: the
 * bots act on a conviction only when it rides on the subscription (criterion 12,
 * `with-conviction-gate.ts`). So every subscription to a ◆ pair that states no conviction of its
 * own gets the row's: its check date, and a reason that says where it came from.
 *
 * An invariant, not a one-time move: a subscription seeded onto a ◆ pair later (the env roster's
 * seed adds pairs uncapped and conviction-less) gets it on the same poll. A subscription that
 * already states one keeps its own, so an owner who set a new date after a failed check is never
 * put back on the row's. Carrying it only ever stops new entries on a failed check — exits always
 * run — so it can make a pair do less, never more.
 */

/** The reason a carried conviction reads with: whose it is and what it is against, said plainly. */
export function carriedReason(pair: Pair): string {
  return `Carried from ${pairName(pair)}'s ◆ conviction row: ${pair.evidence.call}`;
}

/** The conviction a ◆ row carries onto a subscription, or undefined for any other row. */
export function rowConviction(pair: Pair | undefined): SubscriptionConviction | undefined {
  if (!(pair?.evidence.status === "conviction" && pair.evidence.checkOn)) return undefined;
  return { reason: carriedReason(pair), checkOn: pair.evidence.checkOn };
}

export interface Carried {
  readonly state: SubscriptionsState;
  /** `account/playbookId`, one per subscription that gained the row's conviction. */
  readonly carried: readonly string[];
}

/** Pure: `state` with each ◆ row's conviction on every subscription to it that states none. When
 *  nothing is carried, `state` is the very object passed in. */
export function carryRowConvictions(
  state: SubscriptionsState,
  at: Date,
  lookup: (id: string) => Pair | undefined = findPair,
): Carried {
  const carried: string[] = [];
  const next: Record<string, readonly PlaybookSubscription[]> = {};
  for (const [accountId, subs] of Object.entries(state)) {
    next[accountId] = subs.map((sub) => {
      const conviction = sub.conviction ? undefined : rowConviction(lookup(sub.playbookId));
      if (!conviction) return sub;
      carried.push(`${accountId}/${sub.playbookId}`);
      return { ...sub, conviction, updatedAt: at.toISOString() };
    });
  }
  return carried.length > 0 ? { state: next, carried } : { state, carried };
}
