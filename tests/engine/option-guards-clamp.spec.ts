import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { bookNeeds } from "../../src/domain/option-book.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import { openLedger } from "../../src/engine/guard-batch.js";
import {
  clampOption,
  type OptionBatch,
  type OptionGuardConfig,
} from "../../src/engine/option-guards.js";
import {
  aContext,
  anOptionIntent,
  anOptionQuote,
  aPortfolio,
  aPosition,
  withOptionQuotes,
} from "../support/builders.js";

// `clampOption` driven directly — the option half of the risk guards, one intent at a time against a
// shared batch ledger. `option-guards.spec.ts` covers the same rules through `applyGuardsWithVerdicts`
// (refusal names, the ladder, S2/E1); this file adds what only a direct door can show: the unit
// sizing, the order the rules run in, the freshness boundaries, and what one approved intent leaves
// for the next in the same batch. Wednesday 2026-10-07, 11:00 ET, a month before CRWV's print window
// (11-09..11-16).
const AS_OF = "2026-10-07T15:00:00Z";
const PUT = "CRWV261106P00085000";
const CALL_95 = "CRWV261106C00095000";
const CALL_100 = "CRWV261106C00100000";
const CALL_95_LATE = "CRWV261113C00095000";
const CALL_100_LATE = "CRWV261113C00100000";
const PUT_ON_BLACKOUT_DAY = "CRWV261109P00085000";
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];
const subscription = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "CRWV-WHEEL",
  mode: "standard",
  capitalAllocated: 10_000,
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});
const configWith = (
  capitalAllocated: number | undefined = 10_000,
  rest: Partial<OptionGuardConfig> = {},
): OptionGuardConfig => ({
  optionsLevel: 3,
  discipline: { calendar: CALENDAR },
  subscriptions: [subscription({ capitalAllocated })],
  playbookSymbols: new Map([["CRWV-WHEEL", ["CRWV"]]]),
  ...rest,
});
const CONFIG = configWith();

const QUOTES: readonly OptionContractQuote[] = [
  anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }),
  anOptionQuote(CALL_95, { bid: 3.5, ask: 3.7, at: AS_OF }),
  anOptionQuote(CALL_100, { bid: 1.6, ask: 1.8, at: AS_OF }),
  anOptionQuote(CALL_95_LATE, { bid: 3.5, ask: 3.7, at: AS_OF }),
  anOptionQuote(CALL_100_LATE, { bid: 1.6, ask: 1.8, at: AS_OF }),
  anOptionQuote(PUT_ON_BLACKOUT_DAY, { bid: 2, ask: 2.2, at: AS_OF }),
];
const market = (quotes: readonly OptionContractQuote[] = QUOTES): MarketContext =>
  withOptionQuotes(aContext({ CRWV: { last: 90 }, NVDA: { last: 100 } }, AS_OF), quotes);

const sellPut = anOptionIntent();
const longCall = anOptionIntent({
  side: "buy",
  option: {
    structure: "long-call",
    legs: [{ occSymbol: CALL_95, side: "buy", ratio: 1 }],
    limitPrice: 3.6,
  },
});
const spreadOn = (long: string, short: string, limitPrice = 2): OrderIntent =>
  anOptionIntent({
    side: "buy",
    option: {
      structure: "call-debit-spread",
      legs: [
        { occSymbol: long, side: "buy", ratio: 1 },
        { occSymbol: short, side: "sell", ratio: 1 },
      ],
      limitPrice,
    },
  });
const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: CALL_100, side: "sell", ratio: 1 }],
    limitPrice: 1.7,
  },
});
const closing = (
  occSymbol: string,
  side: "buy" | "sell",
  limitPrice: number,
  { quantity = 2, ratio = 1 }: { quantity?: number; ratio?: number } = {},
): OrderIntent =>
  anOptionIntent({
    side,
    quantity,
    playbookId: undefined,
    playbookMode: undefined,
    option: { effect: "close", structure: "close", legs: [{ occSymbol, side, ratio }], limitPrice },
  });
const withLimit = (intent: OrderIntent, limitPrice: number): OrderIntent => ({
  ...intent,
  option: { ...(intent.option as NonNullable<OrderIntent["option"]>), limitPrice },
});

type Outcome = ReturnType<typeof clampOption>;
type Scene = { portfolio?: Portfolio; context?: MarketContext; config?: OptionGuardConfig };

const batchFor = (intents: readonly OrderIntent[], portfolio: Portfolio): OptionBatch => {
  const book = bookNeeds(portfolio);
  return { ledger: openLedger(intents, book, portfolio), book };
};
function clamp(intent: OrderIntent, scene: Scene = {}, batch?: OptionBatch): Outcome {
  const { portfolio = aPortfolio({ cash: 10_000 }), context = market(), config = CONFIG } = scene;
  if (!intent.option) throw new Error("not an option intent");
  return clampOption(
    intent,
    intent.option,
    portfolio,
    context,
    config,
    batch ?? batchFor([intent], portfolio),
  );
}
/** The refusal's name, or the approved quantity — one value to assert on. */
const verdict = (outcome: Outcome): string | number =>
  outcome.ok ? outcome.intent.quantity : outcome.reason;
const cashOf = (cash: number): Scene => ({ portfolio: aPortfolio({ cash }) });

describe("clampOption — how many contracts an open may take", () => {
  it("takes exactly one of a covered call or a spread, however many were asked for", () => {
    const shares = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "CRWV", quantity: 500 })],
    });
    const rich = { portfolio: shares, config: configWith(100_000) };
    expect(verdict(clamp({ ...coveredCall, quantity: 5 }, rich))).toBe(1);
    expect(verdict(clamp({ ...spreadOn(CALL_95, CALL_100), quantity: 5 }, rich))).toBe(1);
  });

  it("gives a cash-secured put what it asked for, when the cash and the allocation allow", () => {
    const rich = { ...cashOf(100_000), config: configWith(100_000) };
    expect(verdict(clamp({ ...sellPut, quantity: 5 }, rich))).toBe(5);
  });

  it("caps a multi-contract open at 20, however much cash and allocation stand behind it", () => {
    const rich = { ...cashOf(1_000_000), config: configWith(1_000_000) };
    expect(verdict(clamp({ ...sellPut, quantity: 50 }, rich))).toBe(20);
    expect(verdict(clamp({ ...longCall, quantity: 100 }, rich))).toBe(20);
  });

  it("cuts a put to the whole contracts its cash can secure ($8,500 each)", () => {
    const scene = { ...cashOf(30_000), config: configWith(100_000) };
    expect(verdict(clamp({ ...sellPut, quantity: 10 }, scene))).toBe(3);
  });

  it("cuts a put to the whole contracts its allocation can carry", () => {
    const scene = { ...cashOf(100_000), config: configWith(20_000) };
    expect(verdict(clamp({ ...sellPut, quantity: 10 }, scene))).toBe(2);
  });

  it("cuts a bought call to the contracts its premium ($360 each) can pay for", () => {
    const scene = { ...cashOf(1_000), config: configWith(100_000) };
    expect(verdict(clamp({ ...longCall, quantity: 5 }, scene))).toBe(2);
    expect(
      verdict(
        clamp({ ...longCall, quantity: 5 }, { ...cashOf(100_000), config: configWith(100_000) }),
      ),
    ).toBe(5);
  });

  it("never sizes below one — a contract that cannot be secured is refused for the reason a single one would get", () => {
    const scene = { ...cashOf(5_000), config: configWith(100_000) };
    expect(verdict(clamp({ ...sellPut, quantity: 10 }, scene))).toBe("put-not-secured");
  });

  it("returns the intent unchanged but for its quantity", () => {
    const outcome = clamp({ ...sellPut, quantity: 3 }, cashOf(10_000));
    expect(outcome).toEqual({ ok: true, intent: { ...sellPut, quantity: 1 } });
  });
});

describe("clampOption — the order the rules run in", () => {
  const noLevel: OptionGuardConfig = { ...CONFIG, optionsLevel: undefined };

  it("judges the quote before the account: a stale read is named even when the level is missing", () => {
    const stale = anOptionQuote(PUT, { at: AS_OF, fetchedAt: "2026-10-07T14:50:00Z" });
    expect(verdict(clamp(sellPut, { config: noLevel, context: market([stale]) }))).toBe(
      "option-quote-stale",
    );
  });

  it("judges the limit before the account: a limit outside the band is named even when the level is missing", () => {
    expect(verdict(clamp(withLimit(sellPut, 3), { config: noLevel }))).toBe(
      "option-limit-outside-quote",
    );
  });

  it("judges the level before the print, the subscription filter before the print, the print before the cover, the cover before the allocation", () => {
    const { discipline: _, ...noCalendar } = CONFIG;
    expect(verdict(clamp(sellPut, { config: { ...noCalendar, optionsLevel: 0 } }))).toBe(
      "options-level",
    );
    const aimed = { ...noCalendar, subscriptions: [subscription({ symbols: ["NVDA"] })] };
    expect(verdict(clamp(sellPut, { config: aimed }))).toBe("subscription-filter");
    expect(verdict(clamp(sellPut, { config: noCalendar, ...cashOf(0) }))).toBe(
      "option-print-unknown",
    );
    expect(
      verdict(clamp(sellPut, { config: { ...CONFIG, subscriptions: [] }, ...cashOf(0) })),
    ).toBe("put-not-secured");
  });

  it("asks for level 2 to buy a call and level 1 to sell a put or cover a call", () => {
    const at = (optionsLevel: number): Scene => ({
      ...cashOf(100_000),
      config: configWith(100_000, { optionsLevel }),
    });
    expect(verdict(clamp(longCall, at(1)))).toBe("options-level");
    expect(verdict(clamp(longCall, at(2)))).toBe(1);
    expect(verdict(clamp(sellPut, at(1)))).toBe(1);
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100), at(2)))).toBe("options-level");
  });

  it("refuses a fractional level, which is no level the broker grants", () => {
    expect(verdict(clamp(sellPut, { config: { ...CONFIG, optionsLevel: 2.5 } }))).toBe(
      "options-level",
    );
  });
});

describe("clampOption — freshness and the band", () => {
  const freshness = (overrides: Partial<OptionContractQuote>): Scene => ({
    context: market([anOptionQuote(PUT, { at: AS_OF, ...overrides })]),
  });

  it("accepts a snapshot read exactly 120s ago, and refuses one read a second earlier", () => {
    expect(verdict(clamp(sellPut, freshness({ fetchedAt: "2026-10-07T14:58:00Z" })))).toBe(1);
    expect(verdict(clamp(sellPut, freshness({ fetchedAt: "2026-10-07T14:57:59Z" })))).toBe(
      "option-quote-stale",
    );
  });

  it("reads an unparseable stamp as stale, never as fresh", () => {
    expect(verdict(clamp(sellPut, freshness({ fetchedAt: "yesterday" })))).toBe(
      "option-quote-stale",
    );
    expect(verdict(clamp(sellPut, freshness({ quotedAt: "yesterday" })))).toBe(
      "option-quote-stale",
    );
  });

  it("bounds an open's feed stamp by the configured max age, 15 minutes when none is set", () => {
    const tenMinutes = freshness({ quotedAt: "2026-10-07T14:50:00Z" });
    const sixteenMinutes = freshness({ quotedAt: "2026-10-07T14:44:00Z" });
    expect(verdict(clamp(sellPut, tenMinutes))).toBe(1);
    expect(
      verdict(
        clamp(sellPut, { ...tenMinutes, config: { ...CONFIG, optionQuoteMaxAgeMs: 300_000 } }),
      ),
    ).toBe("option-quote-stale");
    expect(verdict(clamp(sellPut, sixteenMinutes))).toBe("option-quote-stale");
    const lenient = { ...CONFIG, optionQuoteMaxAgeMs: 20 * 60_000 };
    expect(verdict(clamp(sellPut, { ...sixteenMinutes, config: lenient }))).toBe(1);
  });

  it("holds every leg of a spread to the same freshness: one stale leg stales the order", () => {
    const stale = anOptionQuote(CALL_100, { at: AS_OF, fetchedAt: "2026-10-07T14:50:00Z" });
    const context = market([QUOTES[1] as OptionContractQuote, stale]);
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100), { context }))).toBe("option-quote-stale");
  });

  it("reads a quote under a contract the order does not name as no quote at all", () => {
    expect(verdict(clamp(sellPut, { context: market([QUOTES[1] as OptionContractQuote]) }))).toBe(
      "no-quote",
    );
  });

  it("accepts a limit anywhere from the bid to the ask, and nothing a cent beyond", () => {
    expect(verdict(clamp(withLimit(sellPut, 2), cashOf(10_000)))).toBe(1);
    expect(verdict(clamp(withLimit(sellPut, 2.2), cashOf(10_000)))).toBe(1);
    expect(verdict(clamp(withLimit(sellPut, 1.99), cashOf(10_000)))).toBe(
      "option-limit-outside-quote",
    );
    expect(verdict(clamp(withLimit(sellPut, 2.21), cashOf(10_000)))).toBe(
      "option-limit-outside-quote",
    );
  });

  it("prices a debit spread as a signed net: long bid less short ask up to long ask less short bid", () => {
    // 3.5 − 1.8 = 1.7 … 3.7 − 1.6 = 2.1
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100, 1.7)))).toBe(1);
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100, 2.1)))).toBe(1);
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100, 1.6)))).toBe("option-limit-outside-quote");
    expect(verdict(clamp(spreadOn(CALL_95, CALL_100, 2.11)))).toBe("option-limit-outside-quote");
  });

  it("accepts a locked market (bid equals ask) at that one price", () => {
    const locked = { context: market([anOptionQuote(PUT, { at: AS_OF, bid: 2.1, ask: 2.1 })]) };
    expect(verdict(clamp(sellPut, locked))).toBe(1);
    expect(verdict(clamp(withLimit(sellPut, 2.2), locked))).toBe("option-limit-outside-quote");
  });

  it("refuses to close on a crossed quote too — a close needs a two-sided read", () => {
    const held = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
    });
    const crossed = market([anOptionQuote(PUT, { at: AS_OF, bid: 2.2, ask: 2 })]);
    expect(verdict(clamp(closing(PUT, "buy", 2.1), { portfolio: held, context: crossed }))).toBe(
      "no-quote",
    );
  });
});

describe("clampOption — the print", () => {
  const calendarOnly = { ...cashOf(100_000), config: configWith(100_000) };

  it("lets a bought call hold through the print, where a spread over the same expiry is refused", () => {
    const late = anOptionIntent({
      side: "buy",
      option: {
        structure: "long-call",
        legs: [{ occSymbol: CALL_95_LATE, side: "buy", ratio: 1 }],
        limitPrice: 3.6,
      },
    });
    expect(verdict(clamp(late, calendarOnly))).toBe(1);
    expect(verdict(clamp(spreadOn(CALL_95_LATE, CALL_100_LATE), calendarOnly))).toBe(
      "option-spans-print",
    );
  });

  it("still needs a print on file before a bought call opens", () => {
    const empty = {
      ...calendarOnly,
      config: { ...calendarOnly.config, discipline: { calendar: [] } },
    };
    expect(verdict(clamp(longCall, empty))).toBe("option-print-unknown");
  });

  it("refuses a short that expires on the blackout's first day, and accepts one a day short of it", () => {
    const first = anOptionIntent({
      option: { legs: [{ occSymbol: PUT_ON_BLACKOUT_DAY, side: "sell", ratio: 1 }] },
    });
    expect(verdict(clamp(first, calendarOnly))).toBe("option-spans-print");
    expect(verdict(clamp(sellPut, calendarOnly))).toBe(1);
  });

  it("refuses a spread when either leg crosses the print", () => {
    const mixed = spreadOn(CALL_95, CALL_100_LATE);
    expect(verdict(clamp(mixed, calendarOnly))).toBe("option-spans-print");
  });

  it("fails closed on a leg whose expiry cannot be read", () => {
    const odd = "NOT-AN-OCC-SYMBOL";
    const quote: OptionContractQuote = { ...anOptionQuote(PUT, { at: AS_OF }), occSymbol: odd };
    const unreadable = anOptionIntent({
      option: { legs: [{ occSymbol: odd, side: "sell", ratio: 1 }] },
    });
    expect(verdict(clamp(unreadable, { ...calendarOnly, context: market([quote]) }))).toBe(
      "option-spans-print",
    );
  });
});

describe("clampOption — the allocation", () => {
  it("refuses an open with no playbook to draw an allocation from", () => {
    const orphan = { ...sellPut, playbookId: undefined };
    expect(verdict(clamp(orphan, cashOf(10_000)))).toBe("option-unallocated");
  });

  it("lets a covered call through an allocation the shares have already outgrown", () => {
    const shares = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: "CRWV", quantity: 100 })],
    });
    // $9,005 of CRWV sits in the basket against a $1,000 allocation — a sold put would be refused.
    expect(verdict(clamp(coveredCall, { portfolio: shares, config: configWith(1_000) }))).toBe(1);
  });

  it("sizes a covered call under a paused subscription's terms instead of refusing it as unallocated", () => {
    const shares = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 100 })] });
    const paused = configWith(10_000, {
      subscriptions: [subscription({ enabled: false })],
    });
    expect(verdict(clamp(coveredCall, { portfolio: shares, config: paused }))).toBe(1);
  });

  it("counts the basket's shares against the allocation — every symbol the playbook registered", () => {
    const holding = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: "NVDA", quantity: 20 })], // $2,001 at the ask
    });
    const basket = configWith(10_000, {
      playbookSymbols: new Map([["CRWV-WHEEL", ["CRWV", "NVDA"]]]),
    });
    expect(verdict(clamp(sellPut, { portfolio: holding, config: basket }))).toBe(
      "subscription-budget",
    );
    // Left out of the basket, the same shares commit nothing.
    expect(verdict(clamp(sellPut, { portfolio: holding, config: CONFIG }))).toBe(1);
  });

  describe("when the subscription compounds its allocation", () => {
    const compounding = (realized: number): OptionGuardConfig =>
      configWith(8_000, {
        subscriptions: [subscription({ capitalAllocated: 8_000, compoundAllocation: true })],
        realizedPlForPlaybook: (id) => (id === "CRWV-WHEEL" ? realized : 0),
      });

    it("adds what the playbook has realized, so a $8,000 allocation carries a $8,500 put after a $1,000 win", () => {
      expect(verdict(clamp(sellPut, { ...cashOf(10_000), config: compounding(1_000) }))).toBe(1);
      expect(verdict(clamp(sellPut, { ...cashOf(10_000), config: compounding(0) }))).toBe(
        "subscription-budget",
      );
    });

    it("takes back what the playbook has lost", () => {
      const rich = aPortfolio({ cash: 10_000 });
      const config = { ...compounding(-2_000) };
      expect(verdict(clamp(sellPut, { portfolio: rich, config }))).toBe("subscription-budget");
    });

    it("ignores realized P/L when the subscription does not compound", () => {
      const flat = configWith(8_000, { realizedPlForPlaybook: () => 5_000 });
      expect(verdict(clamp(sellPut, { ...cashOf(10_000), config: flat }))).toBe(
        "subscription-budget",
      );
    });
  });
});

describe("clampOption — what one approved intent leaves for the next in the same batch", () => {
  it("does not let two puts spend the same cash", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const batch = batchFor([sellPut, sellPut], portfolio);
    expect(verdict(clamp(sellPut, { portfolio }, batch))).toBe(1);
    expect(verdict(clamp(sellPut, { portfolio }, batch))).toBe("put-not-secured");
  });

  it("does not let two opens draw the same allocation", () => {
    const portfolio = aPortfolio({ cash: 100_000 });
    const scene = { portfolio, config: configWith(15_000) };
    const batch = batchFor([sellPut, sellPut], portfolio);
    expect(verdict(clamp(sellPut, scene, batch))).toBe(1);
    // $15,000 less the $8,500 the first put now holds leaves $6,500 — cash is plentiful, the playbook is not.
    expect(verdict(clamp(sellPut, scene, batch))).toBe("subscription-budget");
  });

  it("does not charge a refused intent against the allocation or the cash", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const batch = batchFor([withLimit(sellPut, 3), sellPut], portfolio);
    expect(verdict(clamp(withLimit(sellPut, 3), { portfolio }, batch))).toBe(
      "option-limit-outside-quote",
    );
    expect(verdict(clamp(sellPut, { portfolio }, batch))).toBe(1);
  });

  it("does not let two closes take the same contract", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
    });
    const close = closing(PUT, "buy", 2.1);
    const batch = batchFor([close, close], portfolio);
    expect(verdict(clamp(close, { portfolio }, batch))).toBe(1);
    expect(verdict(clamp(close, { portfolio }, batch))).toBe("nothing-held");
  });

  it("counts an earlier open of a contract as nothing to close — it may never fill", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const close = closing(PUT, "buy", 2.1);
    const batch = batchFor([sellPut, close], portfolio);
    expect(verdict(clamp(sellPut, { portfolio }, batch))).toBe(1);
    expect(verdict(clamp(close, { portfolio }, batch))).toBe("nothing-held");
  });
});

describe("clampOption — closes", () => {
  it("closes in whole spreads of the ratio: three held, two per unit, is one unit", () => {
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: CALL_95, quantity: 3, avgPrice: 3.6 })],
    });
    const close = closing(CALL_95, "sell", 3.6, { quantity: 5, ratio: 2 });
    expect(verdict(clamp(close, { portfolio }))).toBe(1);
  });

  it("takes the least of what was asked and what is held", () => {
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: CALL_95, quantity: 3, avgPrice: 3.6 })],
    });
    expect(verdict(clamp(closing(CALL_95, "sell", 3.6, { quantity: 2 }), { portfolio }))).toBe(2);
    expect(verdict(clamp(closing(CALL_95, "sell", 3.6, { quantity: 9 }), { portfolio }))).toBe(3);
  });

  it("buys a sold call back out of free cash, but not out of the cash another short stands on", () => {
    const shares = aPosition({ symbol: "CRWV", quantity: 100 });
    const shortCall = aPosition({ symbol: CALL_100, quantity: -1, avgPrice: 1.7 });
    const shortNvdaPut = aPosition({ symbol: "NVDA261106P00085000", quantity: -1, avgPrice: 2 });
    const positions = [shares, shortCall, shortNvdaPut];
    const buyBack = closing(CALL_100, "buy", 1.7);
    // $8,500 secures the NVDA put; the $170 buy-back would eat into it.
    expect(verdict(clamp(buyBack, { portfolio: aPortfolio({ cash: 8_600, positions }) }))).toBe(
      "collateral-reserved",
    );
    expect(verdict(clamp(buyBack, { portfolio: aPortfolio({ cash: 8_700, positions }) }))).toBe(1);
  });

  it("is never refused by the level, the subscription, the print or the allocation", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
    });
    const bare: OptionGuardConfig = {};
    expect(verdict(clamp(closing(PUT, "buy", 2.1), { portfolio, config: bare }))).toBe(1);
  });
});
