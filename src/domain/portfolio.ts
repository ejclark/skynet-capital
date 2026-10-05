import { contractMultiplier } from "../trading/option-symbols.js";
import type { Portfolio, Position, Quote } from "./types.js";

/**
 * Pure portfolio math. No I/O, no mutation — every function returns a new value.
 * Centralizing this here keeps valuation consistent everywhere (DRY): the engine,
 * the reports, and the risk guards all agree on what "equity" means.
 */

/** Find the current holding for a symbol, or `undefined` if flat. */
export function positionFor(portfolio: Portfolio, symbol: string): Position | undefined {
  return portfolio.positions.find((p) => p.symbol === symbol);
}

/** Quantity currently held for a symbol (0 if flat). Positive = long, negative = short. */
export function heldQuantity(portfolio: Portfolio, symbol: string): number {
  return positionFor(portfolio, symbol)?.quantity ?? 0;
}

/**
 * One holding in dollars. `lastPrice` is the per-share mark from a live quote's last; without a
 * usable one (absent, zero, non-finite), the broker's own `marketValue` is the next-best mark, and
 * cost is the last resort. Every per-share price is scaled by `contractMultiplier`, so an option contract counts at
 * 100 shares — the omission that made a bot's book read a $500 call as $5 (#4643).
 */
export function positionValue(position: Position, lastPrice: number | undefined): number {
  const multiplier = contractMultiplier(position.symbol);
  // A zero or non-finite last is a data gap, not a price: it falls through to the next-best mark
  // rather than valuing the holding at $0 (or poisoning the whole sum with NaN).
  if (lastPrice !== undefined && Number.isFinite(lastPrice) && lastPrice > 0) {
    return position.quantity * lastPrice * multiplier;
  }
  if (position.marketValue !== undefined && Number.isFinite(position.marketValue)) {
    return position.marketValue;
  }
  return position.quantity * position.avgPrice * multiplier;
}

/**
 * Total account value: cash plus the marked value of every position.
 * Falls back to the broker's market value, then average cost, when no live quote exists for it.
 */
export function computeEquity(
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
): number {
  let equity = portfolio.cash;
  for (const position of portfolio.positions) {
    equity += positionValue(position, quotes[position.symbol]?.last);
  }
  return equity;
}
