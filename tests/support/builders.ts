import type { MarketContext, Portfolio, Position, Quote } from "../../src/domain/types.js";

/**
 * Test data builders. One place to construct domain objects for specs so the tests
 * stay about *behavior*, not about the boilerplate of assembling contexts and quotes.
 * Every builder takes overrides, so a spec states only the fields it actually cares about.
 */

export function aQuote(overrides: Partial<Quote> & Pick<Quote, "symbol">): Quote {
  const last = overrides.last ?? 100;
  return {
    symbol: overrides.symbol,
    bid: overrides.bid ?? last - 0.05,
    ask: overrides.ask ?? last + 0.05,
    last,
    asOf: overrides.asOf ?? "2026-07-24T14:30:00Z",
  };
}

export function aPosition(overrides: Partial<Position> & Pick<Position, "symbol">): Position {
  return {
    symbol: overrides.symbol,
    quantity: overrides.quantity ?? 100,
    avgPrice: overrides.avgPrice ?? 90,
  };
}

export function aPortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    cash: overrides.cash ?? 5_000_000,
    positions: overrides.positions ?? [],
  };
}

/**
 * Build a market context from a compact per-symbol spec. Quotes are derived from
 * `last`; momentum and sentiment are attached only when provided.
 */
export function aContext(
  symbols: Record<string, { last?: number; momentum?: number; sentiment?: number }>,
  asOf = "2026-07-24T14:30:00Z",
): MarketContext {
  const quotes: Record<string, Quote> = {};
  const momentum: Record<string, number> = {};
  const newsSentiment: Record<string, number> = {};

  for (const [symbol, spec] of Object.entries(symbols)) {
    quotes[symbol] = aQuote({ symbol, last: spec.last ?? 100, asOf });
    if (spec.momentum !== undefined) {
      momentum[symbol] = spec.momentum;
    }
    if (spec.sentiment !== undefined) {
      newsSentiment[symbol] = spec.sentiment;
    }
  }

  return { asOf, quotes, momentum, newsSentiment };
}
