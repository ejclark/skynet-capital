import type {
  MarketContext,
  OptionContractQuote,
  OptionOrderIntent,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
  Position,
  Quote,
} from "../../src/domain/types.js";
import { parseOccSymbol } from "../../src/trading/option-symbols.js";

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
    ...(overrides.marketValue !== undefined ? { marketValue: overrides.marketValue } : {}),
  };
}

export function aPortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    cash: overrides.cash ?? 5_000_000,
    positions: overrides.positions ?? [],
  };
}

/** A bot's subscription to one playbook: on, standard and uncapped unless overridden — the shape
 *  that changes nothing about sizing, only who may open (#4642 slice 10). */
export function aSubscription(
  accountId: string,
  playbookId: string,
  overrides: Partial<PlaybookSubscription> = {},
): PlaybookSubscription {
  return {
    accountId,
    playbookId,
    mode: "standard",
    enabled: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
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

/**
 * A well-formed bot option order: one cash-secured CRWV $85 put sold for $2.10, priced inside a
 * quoted band. `option` overrides merge into that shape; every other override replaces its field.
 */
export function anOptionIntent(
  overrides: Partial<Omit<OrderIntent, "option">> & {
    readonly option?: Partial<OptionOrderIntent>;
  } = {},
): OrderIntent {
  const { option, ...intent } = overrides;
  return {
    symbol: "CRWV",
    side: "sell",
    quantity: 1,
    type: "limit",
    reason: "sell a put a month out, below support",
    playbookId: "CRWV-WHEEL",
    playbookMode: "standard",
    ...intent,
    option: {
      effect: "open",
      structure: "cash-secured-put",
      legs: [{ occSymbol: "CRWV261106P00085000", side: "sell", ratio: 1 }],
      limitPrice: 2.1,
      band: { low: 2, high: 2.2, at: "2026-10-05T14:30:00Z" },
      ...option,
    },
  };
}

/**
 * One option contract's quote as the trader would have read it — parsed from its OCC symbol, two-
 * sided, feed-stamped and fetched at `at` (default: `aContext`'s own asOf). Override any field.
 */
export function anOptionQuote(
  occSymbol: string,
  overrides: Partial<OptionContractQuote> & { readonly at?: string } = {},
): OptionContractQuote {
  const parts = parseOccSymbol(occSymbol);
  if (!parts) throw new Error(`not an OCC symbol: ${occSymbol}`);
  const { at = "2026-07-24T14:30:00Z", ...rest } = overrides;
  return {
    occSymbol,
    underlying: parts.underlying,
    type: parts.type,
    strike: parts.strike,
    expiration: parts.expiration,
    bid: 2,
    ask: 2.2,
    quotedAt: at,
    fetchedAt: at,
    ...rest,
  };
}

/** `context` with these option quotes attached, keyed by OCC symbol. */
export function withOptionQuotes(
  context: MarketContext,
  quotes: readonly OptionContractQuote[],
  listed: Readonly<Record<string, readonly string[]>> = {},
): MarketContext {
  return {
    ...context,
    options: { listed, contracts: Object.fromEntries(quotes.map((q) => [q.occSymbol, q])) },
  };
}
