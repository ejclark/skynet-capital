import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import {
  applyGuardsWithVerdicts,
  type GuardRefusalReason,
  type RiskConfig,
} from "../../src/engine/guards.js";
import {
  aContext,
  anOptionIntent,
  anOptionQuote,
  aPortfolio,
  aPosition,
  withOptionQuotes,
} from "../support/builders.js";

// The option clamp (`engine/option-guards.ts`), driven through the one public door every intent
// takes. Wednesday 2026-10-07, 11:00 ET: past E1, a month before CRWV's 11-09..11-16 print window.
const AS_OF = "2026-10-07T15:00:00Z";
const PUT = "CRWV261106P00085000";
const CALL_95 = "CRWV261106C00095000";
const CALL_100 = "CRWV261106C00100000";
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];
const WHEEL: PlaybookSubscription = {
  accountId: "sauron",
  playbookId: "CRWV-WHEEL",
  mode: "standard",
  capitalAllocated: 10_000,
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};
const CONFIG: RiskConfig = {
  maxPositionPct: 0.03,
  optionsLevel: 3,
  discipline: { calendar: CALENDAR },
  subscriptions: [WHEEL],
  playbookSymbols: new Map([["CRWV-WHEEL", ["CRWV"]]]),
};

const QUOTES: readonly OptionContractQuote[] = [
  anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }),
  anOptionQuote(CALL_95, { bid: 3.5, ask: 3.7, at: AS_OF }),
  anOptionQuote(CALL_100, { bid: 1.6, ask: 1.8, at: AS_OF }),
];
const market = (quotes: readonly OptionContractQuote[] = QUOTES, asOf = AS_OF): MarketContext =>
  withOptionQuotes(aContext({ CRWV: { last: 90 } }, asOf), quotes);

const sellPut = anOptionIntent();
const spread = anOptionIntent({
  side: "buy",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: CALL_95, side: "buy", ratio: 1 },
      { occSymbol: CALL_100, side: "sell", ratio: 1 },
    ],
    limitPrice: 2,
    band: { low: 1.7, high: 2.1, at: AS_OF },
  },
});
const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: CALL_100, side: "sell", ratio: 1 }],
    limitPrice: 1.7,
  },
});
const closing = (occSymbol: string, side: "buy" | "sell", limitPrice: number): OrderIntent =>
  anOptionIntent({
    side,
    quantity: 2,
    playbookId: undefined,
    playbookMode: undefined,
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol, side, ratio: 1 }],
      limitPrice,
    },
  });

function verdict(
  intent: OrderIntent,
  {
    portfolio = aPortfolio({ cash: 10_000 }),
    context = market(),
    config = CONFIG,
  }: { portfolio?: Portfolio; context?: MarketContext; config?: RiskConfig } = {},
): GuardRefusalReason | OrderIntent | undefined {
  const result = applyGuardsWithVerdicts([intent], portfolio, context, config);
  return result.refused[0]?.reason ?? result.approved[0];
}

describe("option guards — an open that passes", () => {
  it("approves a cash-secured put the account can secure, at exactly one contract", () => {
    expect(verdict({ ...sellPut, quantity: 3 })).toEqual({ ...sellPut, quantity: 1 });
  });

  it("approves a debit spread at level 3 and a covered call on 100 free shares", () => {
    expect(verdict(spread)).toMatchObject({ quantity: 1 });
    const shares = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 100 })] });
    expect(verdict(coveredCall, { portfolio: shares })).toMatchObject({ quantity: 1 });
  });
});

describe("option guards — every refusal names itself", () => {
  it("option-shape: a malformed option order is never sized", () => {
    expect(verdict({ ...sellPut, type: "market" })).toBe("option-shape");
  });

  it("options-level: absent, or below what the structure needs — fail closed", () => {
    const { optionsLevel: _, ...noLevel } = CONFIG;
    expect(verdict(sellPut, { config: noLevel })).toBe("options-level");
    expect(verdict(sellPut, { config: { ...CONFIG, optionsLevel: 0 } })).toBe("options-level");
    expect(verdict(spread, { config: { ...CONFIG, optionsLevel: 2 } })).toBe("options-level");
  });

  it("subscription-filter: the subscription is aimed at other symbols", () => {
    const aimed = { ...CONFIG, subscriptions: [{ ...WHEEL, symbols: ["NVDA"] }] };
    expect(verdict(sellPut, { config: aimed })).toBe("subscription-filter");
  });

  it("option-print-unknown: no calendar, or no print on file for the underlying", () => {
    const { discipline: _, ...noCalendar } = CONFIG;
    expect(verdict(sellPut, { config: noCalendar })).toBe("option-print-unknown");
    expect(verdict(sellPut, { config: { ...CONFIG, discipline: { calendar: [] } } })).toBe(
      "option-print-unknown",
    );
  });

  it("option-spans-print: an expiry on or after the blackout's first day", () => {
    const nov13 = "CRWV261113P00085000";
    const across = anOptionIntent({
      option: { legs: [{ occSymbol: nov13, side: "sell", ratio: 1 }] },
    });
    expect(verdict(across, { context: market([anOptionQuote(nov13, { at: AS_OF })]) })).toBe(
      "option-spans-print",
    );
  });

  it("option-spans-print: on the session after the window, where S2 has already let the print go", () => {
    const at = "2026-11-17T16:00:00Z"; // 11:00 ET
    const dec = "CRWV261218P00085000";
    const late = anOptionIntent({ option: { legs: [{ occSymbol: dec, side: "sell", ratio: 1 }] } });
    expect(verdict(late, { context: market([anOptionQuote(dec, { at })], at) })).toBe(
      "option-spans-print",
    );
  });

  it("option-quote-stale: a snapshot read over 120s ago, a feed stamp over 15 min, or none on an open", () => {
    const readLongAgo = anOptionQuote(PUT, { at: AS_OF, fetchedAt: "2026-10-07T14:57:00Z" });
    expect(verdict(sellPut, { context: market([readLongAgo]) })).toBe("option-quote-stale");
    const oldFeed = anOptionQuote(PUT, { at: AS_OF, quotedAt: "2026-10-07T14:44:00Z" });
    expect(verdict(sellPut, { context: market([oldFeed]) })).toBe("option-quote-stale");
    const unstamped = anOptionQuote(PUT, { at: AS_OF, quotedAt: undefined });
    expect(verdict(sellPut, { context: market([unstamped]) })).toBe("option-quote-stale");
  });

  it("option-limit-outside-quote: the band comes from the snapshot, never the intent's own claim", () => {
    const laundered = anOptionIntent({
      option: { limitPrice: 2.5, band: { low: 2, high: 2.6, at: AS_OF } },
    });
    expect(verdict(laundered)).toBe("option-limit-outside-quote");
  });

  it("no-quote: a leg missing from the snapshot, or quoted one-sided, or no snapshot at all", () => {
    expect(verdict(spread, { context: market([QUOTES[0] as OptionContractQuote]) })).toBe(
      "no-quote",
    );
    const oneSided = anOptionQuote(PUT, { at: AS_OF, ask: undefined });
    expect(verdict(sellPut, { context: market([oneSided]) })).toBe("no-quote");
    expect(verdict(sellPut, { context: aContext({ CRWV: { last: 90 } }, AS_OF) })).toBe("no-quote");
  });

  it("put-not-secured: not enough free cash for the strike × 100", () => {
    expect(verdict(sellPut, { portfolio: aPortfolio({ cash: 8_000 }) })).toBe("put-not-secured");
  });

  it("collateral-reserved / insufficient-cash: a debit the cash covers only before its promises", () => {
    const heldPut = [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })];
    const promised = aPortfolio({ cash: 8_600, positions: heldPut });
    expect(verdict(spread, { portfolio: promised })).toBe("collateral-reserved");
    expect(verdict(spread, { portfolio: aPortfolio({ cash: 100 }) })).toBe("insufficient-cash");
  });

  it("call-not-covered: a covered call on fewer than 100 free shares", () => {
    const fifty = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 50 })] });
    expect(verdict(coveredCall, { portfolio: fifty })).toBe("call-not-covered");
  });

  it("option-unallocated: no subscription, or one with no finite allocation", () => {
    expect(verdict(sellPut, { config: { ...CONFIG, subscriptions: [] } })).toBe(
      "option-unallocated",
    );
    const { capitalAllocated: _, ...uncapped } = WHEEL;
    expect(verdict(sellPut, { config: { ...CONFIG, subscriptions: [uncapped] } })).toBe(
      "option-unallocated",
    );
  });

  it("subscription-budget: the allocation, less what the basket already holds, can't secure it", () => {
    expect(
      verdict(sellPut, {
        config: { ...CONFIG, subscriptions: [{ ...WHEEL, capitalAllocated: 8_000 }] },
      }),
    ).toBe("subscription-budget");
    // $12,000 allocated, but 50 CRWV shares (~$4,500 at the ask) already sit in the basket.
    const holding = aPortfolio({
      cash: 20_000,
      positions: [aPosition({ symbol: "CRWV", quantity: 50 })],
    });
    const twelve = { ...CONFIG, subscriptions: [{ ...WHEEL, capitalAllocated: 12_000 }] };
    expect(verdict(sellPut, { portfolio: holding, config: twelve })).toBe("subscription-budget");
  });

  it("ladder-block, e1-open and s2-print gate an option OPEN exactly as they gate a share buy", () => {
    expect(verdict(sellPut, { config: { ...CONFIG, accountTier: "restricted" } })).toBe(
      "ladder-block",
    );
    const preOpen = "2026-10-07T13:35:00Z"; // 09:35 ET
    const quoted = market([anOptionQuote(PUT, { at: preOpen })], preOpen);
    expect(verdict(sellPut, { context: quoted })).toBe("e1-open");
    expect(verdict({ ...sellPut, urgent: true }, { context: quoted })).toMatchObject({
      quantity: 1,
    });
  });

  it("s2-print ignores allowThroughPrint on an option — it is a share-only opt-out", () => {
    const nearPrint = "2026-11-09T16:00:00Z"; // inside the window, 11:00 ET
    const inWindow = market([anOptionQuote(PUT, { at: nearPrint })], nearPrint);
    expect(verdict({ ...sellPut, allowThroughPrint: true }, { context: inWindow })).toBe(
      "s2-print",
    );
  });
});

describe("option guards — closes", () => {
  const shortPut = aPortfolio({
    cash: 10_000,
    positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
  });

  it("closes only what is held, and nothing-held closes nothing", () => {
    expect(verdict(closing(PUT, "buy", 2.1), { portfolio: shortPut })).toMatchObject({
      quantity: 1,
    });
    expect(verdict(closing(PUT, "buy", 2.1))).toBe("nothing-held");
    // Selling to close a SHORT is not a close of anything held.
    expect(verdict(closing(PUT, "sell", 2.1), { portfolio: shortPut })).toBe("nothing-held");
  });

  it("is never gated by level, allocation, print or the ladder — risk reduction always passes", () => {
    const bare: RiskConfig = { maxPositionPct: 0.03, accountTier: "liquidate" };
    expect(verdict(closing(PUT, "buy", 2.1), { portfolio: shortPut, config: bare })).toMatchObject({
      quantity: 1,
    });
  });

  it("still needs a fresh two-sided quote — and accepts one without a feed stamp", () => {
    expect(verdict(closing(PUT, "buy", 2.1), { portfolio: shortPut, context: market([]) })).toBe(
      "no-quote",
    );
    const unstamped = market([anOptionQuote(PUT, { at: AS_OF, quotedAt: undefined })]);
    expect(
      verdict(closing(PUT, "buy", 2.1), { portfolio: shortPut, context: unstamped }),
    ).toMatchObject({ quantity: 1 });
  });

  it("closes a vertical as one order at a credit inside the signed band", () => {
    const vertical = aPortfolio({
      positions: [
        aPosition({ symbol: CALL_95, quantity: 1, avgPrice: 3.6 }),
        aPosition({ symbol: CALL_100, quantity: -1, avgPrice: 1.7 }),
      ],
    });
    const close = anOptionIntent({
      side: "sell",
      option: {
        effect: "close",
        structure: "close",
        legs: [
          { occSymbol: CALL_95, side: "sell", ratio: 1 },
          { occSymbol: CALL_100, side: "buy", ratio: 1 },
        ],
        limitPrice: -1.9,
      },
    });
    expect(verdict(close, { portfolio: vertical })).toMatchObject({ quantity: 1 });
  });

  it("call-not-covered: closing the long that caps a sold call would leave it bare", () => {
    const creditSpread = aPortfolio({
      positions: [
        aPosition({ symbol: CALL_95, quantity: -1, avgPrice: 3.6 }),
        aPosition({ symbol: CALL_100, quantity: 1, avgPrice: 1.7 }),
      ],
    });
    expect(verdict(closing(CALL_100, "sell", 1.7), { portfolio: creditSpread })).toBe(
      "call-not-covered",
    );
    // With 100 shares under it, the call stays covered once its cap is gone.
    const covered = aPortfolio({
      positions: [...creditSpread.positions, aPosition({ symbol: "CRWV", quantity: 100 })],
    });
    expect(verdict(closing(CALL_100, "sell", 1.7), { portfolio: covered })).toMatchObject({
      quantity: 1,
    });
  });

  it("put-not-secured: closing the long that caps a sold put needs the strike in cash", () => {
    const putSpread = aPortfolio({
      cash: 1_000,
      positions: [
        aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 }),
        aPosition({ symbol: "CRWV261106P00080000", quantity: 1, avgPrice: 1 }),
      ],
    });
    const quotes = [
      ...QUOTES,
      anOptionQuote("CRWV261106P00080000", { bid: 1, ask: 1.2, at: AS_OF }),
    ];
    expect(
      verdict(closing("CRWV261106P00080000", "sell", 1.1), {
        portfolio: putSpread,
        context: market(quotes),
      }),
    ).toBe("put-not-secured");
  });
});
