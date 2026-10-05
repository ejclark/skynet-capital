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
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aPosition,
  withOptionQuotes,
} from "../support/builders.js";

// End to end: an owner's Store subscription → the house roster → playbookIntents → the option
// guards, on a realistic paper book. Nothing is mocked but the market snapshot.

const subscribed = (playbookId: string, capitalAllocated: number): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  capitalAllocated,
  enabled: true,
  createdAt: "2026-10-05T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
});

/** The bot's cycle with its options level and its own subscriptions: what each play emits, and
 *  what the guards make of it. */
function cycle(
  subscription: PlaybookSubscription,
  calendar: readonly EarningsPrint[],
  context: MarketContext,
  portfolio: Portfolio,
  optionsLevel = 3,
): {
  readonly intents: readonly OrderIntent[];
  readonly approved: readonly OrderIntent[];
  readonly refused: readonly GuardRefusalReason[];
} {
  const { enabled, rejected } = subscriptionRoster([subscription]);
  if (rejected.length > 0) throw new Error(`not a house playbook: ${rejected.join(", ")}`);
  const intents = playbookIntents(enabled, context, portfolio, calendar);
  const config: RiskConfig = {
    maxPositionPct: 0.03,
    optionsLevel,
    discipline: { calendar },
    subscriptions: [subscription],
    playbookSymbols: new Map(enabled.map((e) => [e.playbook.id, e.playbook.symbols])),
  };
  const result = applyGuardsWithVerdicts(intents, portfolio, context, config);
  return {
    intents,
    approved: result.approved,
    refused: result.refused.map((r) => r.reason),
  };
}

describe("CRWV-WHEEL through the guards", () => {
  // As filed 2026-10-05: blackout Nov 9–17, then the February estimate.
  const CALENDAR: readonly EarningsPrint[] = [
    {
      symbol: "CRWV",
      date: "2026-11-10",
      status: "estimate",
      source: "test",
      window: { start: "2026-11-09", end: "2026-11-16" },
    },
    {
      symbol: "CRWV",
      date: "2027-02-25",
      status: "estimate",
      source: "test",
      window: { start: "2027-02-18", end: "2027-03-05" },
    },
  ];
  const AS_OF = "2026-11-18T16:00:00Z"; // 11:00 ET, past the open deferral
  const occ = (type: "call" | "put", strike: number) =>
    buildOccSymbol({ underlying: "CRWV", expiration: "2026-12-31", type, strike });
  const quote = (type: "call" | "put", strike: number, delta: number, bid: number, ask: number) =>
    anOptionQuote(occ(type, strike), { delta, bid, ask, openInterest: 800, at: AS_OF });
  const QUOTES: readonly OptionContractQuote[] = [
    quote("put", 75, -0.15, 1.65, 1.85),
    quote("put", 80, -0.21, 2.2, 2.4),
    quote("put", 85, -0.28, 3.3, 3.5),
    quote("call", 100, 0.37, 3.9, 4.15),
    quote("call", 105, 0.28, 2.7, 2.9),
    quote("call", 110, 0.21, 1.85, 2),
  ];
  const context = withOptionQuotes(aContext({ CRWV: { last: 92 } }, AS_OF), QUOTES, {
    CRWV: ["2026-11-20", "2026-12-18", "2026-12-31", "2027-01-15"],
  });
  const wheel = subscribed("CRWV-WHEEL", 10_000);

  it("sells a cash-secured $80 put the guards approve as one contract", () => {
    const run = cycle(wheel, CALENDAR, context, aPortfolio({ cash: 100_000 }));
    expect(run.refused).toEqual([]);
    expect(run.approved).toHaveLength(1);
    expect(run.approved[0]).toMatchObject({
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      playbookId: "CRWV-WHEEL",
      playbookMode: "standard",
      option: { structure: "cash-secured-put", legs: [{ occSymbol: occ("put", 80) }] },
    });
  });

  it("is refused put-not-secured when the account lacks the strike × 100 in cash", () => {
    const run = cycle(wheel, CALENDAR, context, aPortfolio({ cash: 7_999 }));
    expect(run.intents).toHaveLength(1);
    expect(run.approved).toEqual([]);
    expect(run.refused).toEqual(["put-not-secured"]);
  });

  it("writes a covered call on assigned shares the guards approve", () => {
    const assigned = aPortfolio({
      cash: 20_000,
      positions: [aPosition({ symbol: "CRWV", quantity: 100, avgPrice: 80 })],
    });
    const run = cycle(wheel, CALENDAR, context, assigned);
    expect(run.refused).toEqual([]);
    expect(run.approved[0]).toMatchObject({
      quantity: 1,
      option: { structure: "covered-call", legs: [{ occSymbol: occ("call", 105) }] },
    });
  });
});

describe("NVDA-CALL-SPREAD through the guards", () => {
  // NVIDIA's call notice posted, confirming 11-18; February's row is the next one on file.
  const CALENDAR: readonly EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-11-18", status: "confirmed", source: "test: IR call notice" },
    {
      symbol: "NVDA",
      date: "2027-02-24",
      status: "estimate",
      source: "test",
      window: { start: "2027-02-17", end: "2027-03-03" },
    },
  ];
  const occ = (strike: number) =>
    buildOccSymbol({ underlying: "NVDA", expiration: "2026-11-13", type: "call", strike });
  const marketAt = (
    asOf: string,
    spot: number,
    rows: readonly [number, number, number, number][],
  ) =>
    withOptionQuotes(
      aContext({ NVDA: { last: spot } }, asOf),
      rows.map(([strike, delta, bid, ask]) =>
        anOptionQuote(occ(strike), { delta, bid, ask, openInterest: 2_000, at: asOf }),
      ),
      { NVDA: ["2026-11-06", "2026-11-13", "2026-11-20"] },
    );
  const spread = subscribed("NVDA-CALL-SPREAD", 2_000);

  const OCT_28 = "2026-10-28T15:00:00Z"; // 11:00 ET
  const openMarket = marketAt(OCT_28, 240, [
    [235, 0.61, 10.9, 11.2],
    [240, 0.52, 8.3, 8.55],
    [250, 0.33, 4.4, 4.6],
    [255, 0.26, 3.1, 3.25],
    [260, 0.19, 2.1, 2.22],
  ]);

  it("opens a 240/255 debit spread the guards approve as one spread at level 3", () => {
    const run = cycle(spread, CALENDAR, openMarket, aPortfolio({ cash: 50_000 }));
    expect(run.refused).toEqual([]);
    expect(run.approved).toHaveLength(1);
    expect(run.approved[0]).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      quantity: 1,
      playbookId: "NVDA-CALL-SPREAD",
      option: {
        structure: "call-debit-spread",
        legs: [{ occSymbol: occ(240) }, { occSymbol: occ(255) }],
        limitPrice: 5.3,
      },
    });
  });

  it("is refused below options level 3 — a spread needs it", () => {
    const run = cycle(spread, CALENDAR, openMarket, aPortfolio({ cash: 50_000 }), 2);
    expect(run.refused).toEqual(["options-level"]);
  });

  it("sells the spread back on D-5 as one order the guards approve", () => {
    const nov11 = "2026-11-11T15:30:00Z"; // 10:30 ET
    const held = aPortfolio({
      cash: 49_470,
      positions: [
        aPosition({ symbol: occ(240), quantity: 1, avgPrice: 8.43 }),
        aPosition({ symbol: occ(255), quantity: -1, avgPrice: 3.13 }),
      ],
    });
    const closeMarket = marketAt(nov11, 250, [
      [240, 0.71, 11.4, 11.7],
      [255, 0.36, 3.9, 4.1],
    ]);
    const run = cycle(spread, CALENDAR, closeMarket, held);
    expect(run.refused).toEqual([]);
    expect(run.approved[0]).toMatchObject({
      side: "sell",
      quantity: 1,
      option: { effect: "close", limitPrice: -7.55 },
    });
  });
});
