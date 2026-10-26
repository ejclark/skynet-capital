import type { SubscriptionConviction } from "../domain/types.js";
import { type Pair, pairName } from "../playbooks/pair-table.js";

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
 *
 * Since #5482's contract step a row one record steers is reached by a pointer instead, and since
 * its poll migration a row's conviction is written as the owner's own view on the pair
 * (`pair-conviction-migration.ts`, which reads `rowConviction`). The inline carry itself is gone
 * (the inline carry's replacement, app half): the bots run a ◆ pair with no pointer exits-only,
 * copy or not (`isConvictionOffView`, #6009), so a view the migration could not write leaves the
 * pair held exactly as the copy did, and the poll tries the view again. Only the conviction a row
 * states is kept here, for the migration to write.
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
