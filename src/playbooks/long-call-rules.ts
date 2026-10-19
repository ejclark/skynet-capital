/**
 * THE LONG-CALL EXIT RULES, in one place (#5709). The house's long-call bot (`long-call.ts`) sells
 * a call it holds on either of these; a member's own long call hears the same two rules on the
 * "Needs a decision" card (`src/observatory/decisions-view.ts`), in position guidance
 * (`src/options/position-guidance-long.ts`) and on the row badge (`app/src/live/position-mark.ts`).
 * A leaf module on purpose — the app bundle can read the rules without pulling in the bot.
 */

/** Sell everything once this few days remain, before time decay speeds up. */
export const EXIT_DTE = 45;
/** Sell everything once the bid is this multiple of the average cost. */
export const TAKE_PROFIT = 2;

/**
 * Why a held long call should be sold now, or `undefined` while it should be held. The time stop
 * needs no price; the take-profit needs the bid and what was paid, per share. Time wins a tie —
 * the bot's order.
 */
export function longCallExit(held: {
  readonly dte: number;
  readonly paid: number;
  readonly bid?: number;
}): "profit" | "time" | undefined {
  if (held.dte <= EXIT_DTE) return "time";
  if (held.bid !== undefined && held.paid > 0 && held.bid >= TAKE_PROFIT * held.paid) {
    return "profit";
  }
  return undefined;
}
