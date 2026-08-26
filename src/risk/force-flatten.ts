import type { OrderIntent, Portfolio } from "../domain/types.js";

/**
 * The ladder's bottom rung, made actionable: the orders that close a book.
 *
 * `forceFlattenRequired()` answers *whether*; this answers *what to send*. Keeping the two apart
 * matters — the decision is a risk judgement and the plan is order construction, and only the
 * caller (the autonomous runner) is allowed to put the second one on a wire.
 *
 * Pure: it reads a portfolio snapshot and returns intents. It submits nothing.
 */

/**
 * Every long position, as a market sell for the whole holding, plus an honest account of anything
 * this plan CANNOT close.
 *
 * `unflattened` exists because silence would be a lie in the one situation this function is for. A
 * short position cannot be closed by selling, and this engine has no short-covering path: guards
 * clamp every sell to the quantity actually held (`clampSell` — "no accidental shorting"), so a
 * negative position cannot arise from a guarded order in the first place. If one somehow exists,
 * the plan reports it by symbol rather than reporting a flat book that isn't flat.
 *
 * The intents are ordinary sells and pass the guards untouched by design — the block rung refuses
 * risk-INCREASING orders only, so a force-flatten is never blocked by the ladder that ordered it.
 */
export function planForceFlatten(
  portfolio: Portfolio,
  reason: string,
): { readonly intents: readonly OrderIntent[]; readonly unflattened: readonly string[] } {
  const intents: OrderIntent[] = [];
  const unflattened: string[] = [];
  for (const position of portfolio.positions) {
    if (position.quantity > 0) {
      intents.push({
        symbol: position.symbol,
        side: "sell",
        quantity: position.quantity,
        type: "market",
        reason,
        // A flatten IS the time-critical case: the E1 defer-the-open guard must not sit on it.
        // (E1 only ever touches buys today; claiming urgency here keeps that true if it widens.)
        urgent: true,
      });
    } else if (position.quantity < 0) {
      unflattened.push(position.symbol);
    }
    // quantity === 0 is not a position; nothing to close and nothing to report.
  }
  return { intents, unflattened };
}
