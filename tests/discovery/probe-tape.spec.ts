import { actionKey, mute, runTape, type Tape } from "../../src/discovery/probe-tape.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";

/** A persona that records what it was shown and buys whatever the caller tells it to. */
class SpyPersona implements Persona {
  readonly id = "spy";
  readonly name = "The Spy";
  readonly thesis = "Records the tape it was shown.";
  readonly seen: MarketContext[] = [];
  readonly books: Portfolio[] = [];

  constructor(private readonly plan: (context: MarketContext) => OrderIntent[]) {}

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    this.seen.push(context);
    this.books.push(portfolio);
    return this.plan(context);
  }
}

const buyAll = (context: MarketContext): OrderIntent[] =>
  Object.keys(context.quotes).map((symbol) => ({
    symbol,
    side: "buy" as const,
    quantity: 1,
    type: "market" as const,
    reason: `bought ${symbol}`,
  }));

const TAPE: Tape = {
  cash: 100_000,
  positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 100 }],
  frames: [
    {
      asOf: "2026-08-26T14:00:00Z",
      quotes: [
        { symbol: "NVDA", price: 92, momentum: -0.05, sentiment: -0.9 },
        { symbol: "GLD", price: 200, momentum: 0.01, sentiment: 0.3 },
      ],
    },
  ],
};

describe("runTape", () => {
  it("shows the persona one market context per frame, built from the tape's quotes", () => {
    const spy = new SpyPersona(() => []);

    runTape(spy, TAPE);

    const context = spy.seen[0];
    expect(spy.seen).toHaveLength(1);
    expect(context?.asOf).toBe("2026-08-26T14:00:00Z");
    expect(context?.quotes.NVDA?.ask).toBe(92);
    expect(context?.momentum?.NVDA).toBe(-0.05);
    expect(context?.newsSentiment?.GLD).toBe(0.3);
  });

  it("hands the persona the tape's book, so held-position behaviour can be probed", () => {
    const spy = new SpyPersona(() => []);

    runTape(spy, TAPE);

    expect(spy.books[0]?.cash).toBe(100_000);
    expect(spy.books[0]?.positions[0]?.symbol).toBe("NVDA");
  });

  it("records each intent with the conditions of the frame it happened on", () => {
    const actions = runTape(new SpyPersona(buyAll), TAPE);

    const nvda = actions.find((a) => a.symbol === "NVDA");
    expect(nvda?.side).toBe("buy");
    expect(nvda?.reason).toBe("bought NVDA");
    expect(nvda?.sentiment).toBe(-0.9);
    expect(nvda?.momentum).toBe(-0.05);
    // Mean across the frame — the "while the rest of the tape was hated" question.
    expect(nvda?.tapeSentiment).toBeCloseTo(-0.3, 10);
  });

  it("ignores an intent for a symbol the tape never quoted rather than inventing its signals", () => {
    const ghost = new SpyPersona(() => [
      { symbol: "TSLA", side: "buy", quantity: 1, type: "market", reason: "off-tape" },
    ]);

    expect(runTape(ghost, TAPE)).toEqual([]);
  });

  it("keys an action by symbol and side, so a signal run can be compared with its control", () => {
    const [action] = runTape(new SpyPersona(buyAll), TAPE);

    expect(action && actionKey(action)).toBe("NVDA|buy");
  });
});

describe("mute", () => {
  it("flattens sentiment to neutral and leaves prices and momentum untouched", () => {
    const quotes = mute(TAPE, "sentiment").frames[0]?.quotes ?? [];

    expect(quotes.map((q) => q.sentiment)).toEqual([0, 0]);
    expect(quotes.map((q) => q.momentum)).toEqual([-0.05, 0.01]);
    expect(quotes.map((q) => q.price)).toEqual([92, 200]);
  });

  it("flattens momentum to neutral and leaves sentiment untouched", () => {
    const quotes = mute(TAPE, "momentum").frames[0]?.quotes ?? [];

    expect(quotes.map((q) => q.momentum)).toEqual([0, 0]);
    expect(quotes.map((q) => q.sentiment)).toEqual([-0.9, 0.3]);
  });

  it("re-prices a held symbol to its own entry, so the book shows no gain or loss", () => {
    const quotes = mute(TAPE, "pnl").frames[0]?.quotes ?? [];

    expect(quotes.find((q) => q.symbol === "NVDA")?.price).toBe(100);
    // Nothing is held in GLD, so there is no entry to re-price to and its price stands.
    expect(quotes.find((q) => q.symbol === "GLD")?.price).toBe(200);
  });

  it("never mutates the tape it was handed", () => {
    mute(TAPE, "sentiment");

    expect(TAPE.frames[0]?.quotes[0]?.sentiment).toBe(-0.9);
  });
});
