import type { RoundTrip } from "../../src/trading/round-trips.js";
import { realizedByDay, statsBySymbol, tradeStats } from "../../src/trading/trade-stats.js";

const trip = (realized: number, over: Partial<RoundTrip> = {}): RoundTrip => ({
  symbol: "AAPL",
  quantity: 1,
  entryPrice: 100,
  exitPrice: 100 + realized,
  openedAt: "2026-08-01T14:00:00.000Z",
  closedAt: "2026-08-02T14:00:00.000Z",
  realized,
  returnPct: realized,
  holdMs: 24 * 60 * 60 * 1000,
  ...over,
});

describe("tradeStats — the four measures", () => {
  const stats = tradeStats([trip(100), trip(-50), trip(200), trip(-25)]);

  it("counts wins and losses and reports the win rate as a percentage", () => {
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(2);
    expect(stats.winRate).toBe(50);
  });

  it("computes profit factor as gross profit over gross loss", () => {
    expect(stats.grossProfit).toBe(300);
    expect(stats.grossLoss).toBe(75);
    expect(stats.profitFactor).toBeCloseTo(4, 6);
  });

  it("reports expectancy as average realized dollars per trade", () => {
    expect(stats.netRealized).toBe(225);
    expect(stats.expectancy).toBeCloseTo(56.25, 6);
  });

  it("pairs win rate with a payoff ratio of average win to average loss", () => {
    expect(stats.avgWin).toBe(150);
    expect(stats.avgLoss).toBe(37.5);
    expect(stats.payoffRatio).toBeCloseTo(4, 6);
  });

  it("names the best and worst trades", () => {
    expect(stats.bestTrade?.realized).toBe(200);
    expect(stats.worstTrade?.realized).toBe(-50);
  });
});

describe("tradeStats — unmeasurable stats are null, never zero", () => {
  it("returns null measures for an empty history", () => {
    const stats = tradeStats([]);
    expect(stats.trades).toBe(0);
    expect(stats.winRate).toBeNull();
    expect(stats.profitFactor).toBeNull();
    expect(stats.expectancy).toBeNull();
    expect(stats.avgWin).toBeNull();
    expect(stats.avgLoss).toBeNull();
    expect(stats.payoffRatio).toBeNull();
    expect(stats.avgHoldMs).toBeNull();
    expect(stats.bestTrade).toBeNull();
  });

  it("leaves profit factor null when nothing has been lost — infinity is not a stat", () => {
    const stats = tradeStats([trip(10), trip(20)]);
    expect(stats.profitFactor).toBeNull();
    expect(stats.winRate).toBe(100);
  });

  it("excludes exactly-flat trades from the win rate instead of counting them as wins", () => {
    const stats = tradeStats([trip(10), trip(0), trip(-10)]);
    expect(stats.trades).toBe(3);
    expect(stats.scratches).toBe(1);
    expect(stats.winRate).toBe(50);
  });
});

describe("tradeStats — streaks", () => {
  it("tracks the streak in progress at the most recent close", () => {
    const stats = tradeStats([trip(10), trip(-5), trip(20), trip(30)]);
    expect(stats.currentStreak).toEqual({ kind: "win", length: 2 });
  });

  it("records the longest win and loss runs across the whole history", () => {
    const stats = tradeStats([trip(1), trip(2), trip(3), trip(-1), trip(-2), trip(5)]);
    expect(stats.longestWinStreak).toBe(3);
    expect(stats.longestLossStreak).toBe(2);
  });

  it("lets a scratch trade neither extend nor break a run", () => {
    const stats = tradeStats([trip(1), trip(0), trip(2)]);
    expect(stats.currentStreak).toEqual({ kind: "win", length: 2 });
  });
});

describe("statsBySymbol", () => {
  it("groups by ticker and ranks by realized dollars", () => {
    const rows = statsBySymbol([
      trip(50, { symbol: "AAPL" }),
      trip(-20, { symbol: "TSLA" }),
      trip(10, { symbol: "AAPL" }),
    ]);
    expect(rows.map((r) => r.symbol)).toEqual(["AAPL", "TSLA"]);
    expect(rows[0]).toMatchObject({ trades: 2, wins: 2, winRate: 100, netRealized: 60 });
    expect(rows[1]?.netRealized).toBe(-20);
  });
});

describe("realizedByDay", () => {
  it("buckets realized P/L by close date, oldest first", () => {
    const days = realizedByDay(
      [
        trip(10, { closedAt: "2026-08-03T14:00:00.000Z" }),
        trip(-4, { closedAt: "2026-08-03T18:00:00.000Z" }),
        trip(7, { closedAt: "2026-08-04T14:00:00.000Z" }),
      ],
      "UTC",
    );
    expect(days).toEqual([
      { day: "2026-08-03", realized: 6, trades: 2 },
      { day: "2026-08-04", realized: 7, trades: 1 },
    ]);
  });

  it("buckets a late-session close in MARKET time, not the UTC next day", () => {
    // 2026-08-03T23:50Z is 19:50 ET on Aug 3 — the same trading day, not Aug 4.
    const days = realizedByDay([trip(5, { closedAt: "2026-08-03T23:50:00.000Z" })]);
    expect(days[0]?.day).toBe("2026-08-03");
  });
});
