/**
 * THE LONG-LEAP RULES, in one place (#6340). The long-LEAP bot (`long-leap.ts`) buys and sells on
 * these; slice 2 points member guidance, the decisions card and the row badge at the same numbers, so
 * a LEAP holder never hears the long call's 45-day rule. A leaf module on purpose, as
 * `long-call-rules.ts` is — the app bundle can read the rules without pulling in the bot.
 *
 * Every number is the study's reference shape (`docs/research/long-leap-dip-2026-10.md` → The call):
 * about 24 months at 0.80 delta, half sold at double, the rest out with 6 months left, bought on a
 * close 15%+ under the 252-session high. Modeled, not measured on real LEAP prices; slice 3 records
 * the real ones so the model gets graded.
 */

/** It buys only a call this many calendar days or more from expiry: a LEAP is 12 months or more. */
export const LEAP_MIN_DTE = 365;
/** The latest expiry it reaches for: about 25 months, so the 24-month shape is inside. */
export const LEAP_MAX_DTE = 760;
/** Sell everything still held once this few days remain: six months. */
export const LEAP_EXIT_DTE = 180;
/** Sell half, once, when the bid first reaches this multiple of the average cost. */
export const LEAP_TRIM_AT = 2;
/** Buy when the last close is at least this far under the 252-session high. */
export const LEAP_DIP = 0.15;

/**
 * Why a held LEAP should be sold now, and how much: `time` sells all of it, `trim` sells half.
 * `trimmed` is whether this contract was already trimmed once — `undefined` when that memory can't
 * be read, which takes no profit rather than risk selling half of a half. Time wins a tie.
 */
export function longLeapExit(held: {
  readonly dte: number;
  readonly paid: number;
  readonly bid?: number;
  readonly trimmed?: boolean;
}): "time" | "trim" | undefined {
  if (held.dte <= LEAP_EXIT_DTE) return "time";
  if (held.trimmed !== false) return undefined;
  if (held.bid !== undefined && held.paid > 0 && held.bid >= LEAP_TRIM_AT * held.paid) {
    return "trim";
  }
  return undefined;
}
