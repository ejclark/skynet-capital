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
 * Total account value: cash plus the marked value of every position.
 * Falls back to a position's average price when no live quote exists for it.
 */
export function computeEquity(
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
): number {
  let equity = portfolio.cash;
  for (const position of portfolio.positions) {
    const quote = quotes[position.symbol];
    const markPrice = quote ? quote.last : position.avgPrice;
    equity += position.quantity * markPrice;
  }
  return equity;
}
