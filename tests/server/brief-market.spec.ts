import { priceOption } from "../../src/options/pricing.js";
import {
  activePrint,
  earningsWindowOf,
  parityImpliedSpot,
  realizedVolatility,
  toBriefQuote,
} from "../../src/server/brief-market.js";

/** The Brief's market arithmetic (#3729), each number checked against a hand-computable case. */

describe("realizedVolatility", () => {
  it("annualizes the sample stdev of log returns by √252", () => {
    const closes = Array.from({ length: 21 }, (_, i) => 100 * (i % 2 === 0 ? 1 : 1.01));
    const r = Math.log(1.01);
    // 20 returns alternating ±r: mean 0, sample variance = 20r²/19
    expect(realizedVolatility(closes)).toBeCloseTo(Math.sqrt(((20 * r * r) / 19) * 252), 10);
  });

  it("refuses fewer than 10 returns", () => {
    expect(realizedVolatility([100, 101, 102])).toBeUndefined();
  });
});

describe("parityImpliedSpot", () => {
  it("recovers spot from an at-the-money call/put pair priced by the same model", () => {
    const days = 30;
    const c =
      priceOption({ spot: 80, strike: 80, daysToExpiry: days, volatility: 0.8, type: "call" })
        ?.price ?? 0;
    const p =
      priceOption({ spot: 80, strike: 80, daysToExpiry: days, volatility: 0.8, type: "put" })
        ?.price ?? 0;
    const row = (price: number) => ({
      occSymbol: "x",
      strike: 80,
      bid: price - 0.05,
      ask: price + 0.05,
    });
    expect(parityImpliedSpot([row(c)], [row(p)], 80, days)).toBeCloseTo(80, 6);
  });

  it("is undefined without a quoted pair", () => {
    expect(parityImpliedSpot([{ occSymbol: "x", strike: 80 }], [], 80, 30)).toBeUndefined();
  });
});

describe("toBriefQuote", () => {
  it("solves IV from the mid and keeps the bid a seller receives", () => {
    const price =
      priceOption({ spot: 80, strike: 90, daysToExpiry: 30, volatility: 0.8, type: "call" })
        ?.price ?? 0;
    const q = toBriefQuote(
      { occSymbol: "x", strike: 90, bid: price - 0.02, ask: price + 0.02, delta: 0.25 },
      "2026-10-30",
      "call",
      80,
      30,
    );
    expect(q.iv).toBeCloseTo(0.8, 3);
    expect(q.bid).toBeCloseTo(price - 0.02, 10);
    expect(q.feedDelta).toBe(0.25);
  });
});

describe("earningsWindowOf", () => {
  it("uses the research-bounded window for an estimate when one exists", () => {
    const w = earningsWindowOf({
      symbol: "CRWV",
      date: "2026-11-10",
      status: "estimate",
      source: "cadence",
      window: { start: "2026-11-09", end: "2026-11-16" },
    });
    expect(w).toMatchObject({ start: "2026-11-09", end: "2026-11-16", status: "estimate" });
  });

  it("widens an unbounded estimate by ±7 days, and a confirmed date spans D and D+1", () => {
    expect(
      earningsWindowOf({ symbol: "X", date: "2026-10-28", status: "estimate", source: "c" }),
    ).toMatchObject({ start: "2026-10-21", end: "2026-11-04" });
    expect(
      earningsWindowOf({ symbol: "X", date: "2026-10-28", status: "confirmed", source: "IR" }),
    ).toMatchObject({ start: "2026-10-28", end: "2026-10-29" });
  });
});

describe("activePrint — the window, not the point date, decides", () => {
  const crwv = {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate" as const,
    source: "c",
    window: { start: "2026-11-09", end: "2026-11-16" },
  };

  it("still respects an estimate after its point date while the window is open", () => {
    expect(activePrint([crwv], "CRWV", "2026-11-12")?.window.end).toBe("2026-11-16");
  });

  it("retires it once the window closes", () => {
    expect(activePrint([crwv], "CRWV", "2026-11-17")).toBeUndefined();
  });
});
