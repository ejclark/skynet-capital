import { isMarketClosed } from "../domain/market-calendar.js";
import { parseOccSymbol } from "./option-symbols.js";

/**
 * EXPIRATION CYCLE — which listing cycle an option contract expired on: a weekly, a standard
 * monthly, or a quarterly triple-witching. This is what "cycle type" names in this repo and has
 * named all along: `domain/market-events-types.ts` codes an `opex` event as "monthly 3rd Friday;
 * quarterly = triple/quad witching", and every `docs/research/events/opex-*.md` ledger grades "the
 * *cycle type*" against exactly that OCC convention. #3665's open question 1 asked whether the
 * metric needed a new schema field before it could be built; it does not. The cycle is a FACT ABOUT
 * THE CONTRACT, carried in the OCC symbol every trip already stores, so it is derived here rather
 * than captured at entry — nothing upstream of `RoundTrip` changes, and a trip closed months ago
 * classifies as surely as today's.
 *
 * Why the distinction is a real trading measure and not a tag for its own sake: a weekly is mostly
 * gamma and event premium with days of theta left, a monthly is the strike where open interest and
 * liquidity actually sit, and a quarterly witching carries index-rebalance and futures-roll flow on
 * top. "My weeklies lose and my monthlies pay" is a different lesson than any win rate alone tells.
 *
 * The convention, stated so a wrong label is visible rather than plausible:
 *  - the standard **monthly** expiration is the third Friday of the month, and the **quarterly**
 *    witching is that same third Friday in March, June, September or December;
 *  - when the exchange is shut all day on that third Friday, the standard expiration moves back to
 *    the Thursday before it, and this reads that adjusted date as the monthly too;
 *  - every other expiration date — Mondays, Wednesdays, the other Fridays of a month, the dailies
 *    some index products list — is a **weekly**.
 *
 * The Thursday shift is NOT a rare edge case, which is worth saying because it looks like one:
 * **Juneteenth lands on the third Friday of June twice inside the closure table's current horizon**
 * — 2026-06-19 and 2027-06-18 are both full closures (`domain/market-calendar.ts`), so the June
 * quarterly witching those years expires on the Thursday. Every June-witching contract this app can
 * trade in that window takes this branch, so it is pinned against those real dates in the spec, not
 * only against a stub.
 *
 * Honesty bound, deliberate and narrow: the holiday adjustment can only be applied where
 * `market-calendar.ts`'s checked-in closure table reaches (it publishes the exchange's own two-year
 * horizon). Beyond that horizon a holiday-shifted monthly reads as a weekly rather than being
 * guessed at — the same posture that table's own docblock takes ("extend by year with a dated
 * source line; never infer a date"). That bound is the one way this classifier can be wrong about a
 * real contract, and it fails toward the vaguer label rather than inventing a confident one.
 */

/** Which listing cycle a contract expired on. */
export type ExpirationCycle = "weekly" | "monthly" | "quarterly";

/** The months whose third-Friday expiration is a triple-witching (quarter ends). */
const WITCHING_MONTHS: ReadonlySet<number> = new Set([3, 6, 9, 12]);

const DAY_MS = 86_400_000;

const isoDay = (time: number): string => new Date(time).toISOString().slice(0, 10);

/**
 * The third Friday of the month `expiration` falls in, as `YYYY-MM-DD`. Computed in UTC against the
 * date parts alone, so it never drifts with the runner's timezone the way a local-time `Date` would.
 */
function thirdFriday(year: number, month: number): string {
  const firstOfMonth = Date.UTC(year, month - 1, 1);
  const firstFriday = 1 + ((5 - new Date(firstOfMonth).getUTCDay() + 7) % 7);
  return isoDay(Date.UTC(year, month - 1, firstFriday + 14));
}

/**
 * The cycle an OCC expiration date belongs to. Takes the date rather than the symbol so a caller
 * that has already parsed the contract doesn't parse it twice.
 *
 * `closed` is injectable so the spec can pin the SHIFT RULE independently of the closure table's
 * contents: the June witchings exercise it on real dates, but a later edit to that table (a year
 * added, a date corrected) would otherwise be able to turn the rule's own test green or red for a
 * reason that has nothing to do with the rule.
 *
 * Total by construction — every string in, a cycle out. A malformed date is read as a weekly rather
 * than thrown on, because this runs once per trip inside `tradeStats`: one unparseable symbol in a
 * ledger must cost that trip its cycle label, never the whole account's metrics.
 */
export function cycleOfExpiration(
  expiration: string,
  closed: (date: string) => boolean = isMarketClosed,
): ExpirationCycle {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiration);
  if (!match) return "weekly";
  // The pattern admits `2026-99-99` and `2026-02-30`; only parsing rejects a day that never was.
  const time = Date.parse(`${expiration}T00:00:00Z`);
  if (!Number.isFinite(time)) return "weekly";
  const month = Number(match[2]);
  const standard = thirdFriday(Number(match[1]), month);
  const isStandard =
    expiration === standard ||
    // Shut all day on the third Friday → the standard expiration is the Thursday before it.
    (isoDay(time + DAY_MS) === standard && closed(standard));
  if (!isStandard) return "weekly";
  return WITCHING_MONTHS.has(month) ? "quarterly" : "monthly";
}

/**
 * The cycle a traded symbol expired on, or `undefined` when the symbol names no contract at all —
 * a share of stock has no expiration cycle, and saying "weekly" about one would be a fabricated
 * stat, not a default. Callers counting cycles leave those trips out and let the instrument
 * breakdown speak for them.
 */
export function expirationCycleOf(symbol: string): ExpirationCycle | undefined {
  const parts = parseOccSymbol(symbol);
  return parts ? cycleOfExpiration(parts.expiration) : undefined;
}
