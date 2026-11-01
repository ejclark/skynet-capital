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

/** The day the time stop falls due: `EXIT_DTE` days before expiry. Both YYYY-MM-DD. */
export function timeStopDay(expiration: string): string {
  return new Date(Date.parse(`${expiration}T00:00:00Z`) - EXIT_DTE * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * THE EXIT PLAN A CALL IS BOUGHT WITH (#5709 slice 3) — these two rules, priced for one purchase:
 * the bid that takes the profit, the day the time stop falls due, and what each means in dollars.
 * Shown in the ticket's review step before anything is sent; a member who carries it has it read
 * back by every surface that judges the held call. Offered, never applied: nothing sells on it.
 */
export interface LongCallPlan {
  /** Premium per share the plan is priced from — the limit, else the quoted premium. */
  readonly paid: number;
  readonly multiple: number;
  /** The bid per share that fires the take-profit: `TAKE_PROFIT` × `paid`. */
  readonly takeProfit: number;
  /** Dollars banked across the order if it sells at `takeProfit`. */
  readonly gain: number;
  readonly exitDte: number;
  /** YYYY-MM-DD. */
  readonly timeStop: string;
  /** Days from `today` until the time stop; zero or less means it is already due. */
  readonly holdDays: number;
}

export function longCallPlan(order: {
  readonly paid: number;
  readonly contracts: number;
  readonly expiration: string;
  /** YYYY-MM-DD, the server's own clock. */
  readonly today: string;
}): LongCallPlan {
  const timeStop = timeStopDay(order.expiration);
  const takeProfit = TAKE_PROFIT * order.paid;
  return {
    paid: order.paid,
    multiple: TAKE_PROFIT,
    takeProfit,
    gain: (takeProfit - order.paid) * 100 * order.contracts,
    exitDte: EXIT_DTE,
    timeStop,
    holdDays: Math.round(
      (Date.parse(`${timeStop}T00:00:00Z`) - Date.parse(`${order.today}T00:00:00Z`)) / 86_400_000,
    ),
  };
}

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
