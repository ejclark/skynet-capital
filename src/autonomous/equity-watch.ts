import { positionValue } from "../domain/portfolio.js";
import type { MarketContext, Portfolio } from "../domain/types.js";

/**
 * The equity feed for the daily-loss circuit breaker — the pure half of the wiring that makes
 * `SafetyController.recordEquity` real (without a feed, the daily-loss breaker can never trip and a
 * bot could ride an account all the way down without halting). The runner marks each bot's
 * portfolio against the same MarketContext the personas just traded on and feeds the fleet total.
 *
 * Marking rule: a position values at the context's last price; with no usable quote it falls back
 * to the broker's own market value, then to average cost — a stale-but-finite read beats a false
 * crash to $0, which would trip the breaker on a data gap rather than a real loss (the data-gap
 * breaker owns that failure mode). Option contracts count at 100 shares (`positionValue`): the
 * breaker's baseline is the broker's own last equity, which always scaled them, so an unscaled
 * reading opened every day already "down" by 99% of any option held overnight (#4643).
 */

/** One portfolio marked to market: cash + every position at last price (market value, then avg
 *  cost, when unquoted), option contracts at 100 shares each. */
export function markedEquity(portfolio: Portfolio, context: MarketContext): number {
  const positionsValue = portfolio.positions.reduce((sum, position) => {
    const quote = context.quotes[position.symbol];
    const last =
      quote !== undefined && Number.isFinite(quote.last) && quote.last > 0 ? quote.last : undefined;
    return sum + positionValue(position, last);
  }, 0);
  return portfolio.cash + positionsValue;
}

/** The fleet total the breaker watches — one shared baseline across every enabled bot. */
export function fleetEquity(portfolios: readonly Portfolio[], context: MarketContext): number {
  return portfolios.reduce((sum, portfolio) => sum + markedEquity(portfolio, context), 0);
}
