import type { RoundTrip } from "../../src/trading/round-trips.js";
import {
  realizedByDay,
  statsByPlaybook,
  statsBySymbol,
  tradeStats,
} from "../../src/trading/trade-stats.js";

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

describe("tradeStats — the playbook metrics family (#3665)", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("breaks trips down by direction — a written option is the short side", () => {
    const stats = tradeStats([trip(10), trip(5), trip(20, { short: true })]);
    expect(stats.byDirection).toEqual({ long: 2, short: 1 });
  });

  it("breaks trips down by instrument, reading call/put from the OCC symbol", () => {
    const stats = tradeStats([
      trip(10),
      trip(5, { symbol: "MSFT260918C00420000" }),
      trip(-3, { symbol: "MSFT260918P00420000" }),
      trip(8, { symbol: "NVDA261016P00120000" }),
    ]);
    expect(stats.byInstrument).toEqual({ stock: 1, call: 1, put: 2 });
  });

  it("sums capital committed as entry price × quantity across trips", () => {
    const stats = tradeStats([
      trip(0, { entryPrice: 100, quantity: 10 }),
      trip(0, { entryPrice: 50, quantity: 4 }),
    ]);
    expect(stats.capitalCommitted).toBe(1200);
  });

  it("weights aggregate return by capital, so a tiny big-percent win can't outvote a large loss", () => {
    const stats = tradeStats([
      trip(5, { entryPrice: 10, quantity: 1, returnPct: 50 }),
      trip(-500, { entryPrice: 100, quantity: 100, returnPct: -5 }),
    ]);
    // A naive mean of per-trip percents would read +22.5%; the capital-weighted truth is negative.
    expect(stats.returnPct).toBeCloseTo((-495 / 10_010) * 100, 6);
  });

  it("names the longest and shortest holds by time, independent of dollars", () => {
    const stats = tradeStats([
      trip(500, { holdMs: 2 * DAY }),
      trip(-10, { holdMs: 30 * DAY }),
      trip(1, { holdMs: DAY / 4 }),
    ]);
    expect(stats.longestHold?.holdMs).toBe(30 * DAY);
    expect(stats.shortestHold?.holdMs).toBe(DAY / 4);
    expect(stats.bestTrade?.realized).toBe(500);
  });

  it("carries the new family through statsByPlaybook, per playbook", () => {
    const [s1] = statsByPlaybook([
      trip(10, { playbookId: "S1-NVDA", entryPrice: 100, quantity: 2 }),
      trip(-4, { playbookId: "S1-NVDA", entryPrice: 100, quantity: 1, short: true }),
    ]);
    expect(s1?.byDirection).toEqual({ long: 1, short: 1 });
    expect(s1?.capitalCommitted).toBe(300);
    expect(s1?.returnPct).toBeCloseTo(2, 6);
  });
});

describe("tradeStats — unmeasurable stats are null, never zero", () => {
  it("leaves the playbook metrics honestly empty for an empty history", () => {
    const stats = tradeStats([]);
    expect(stats.returnPct).toBeNull();
    expect(stats.longestHold).toBeNull();
    expect(stats.shortestHold).toBeNull();
    expect(stats.capitalCommitted).toBe(0);
    expect(stats.byDirection).toEqual({ long: 0, short: 0 });
    expect(stats.byInstrument).toEqual({ stock: 0, call: 0, put: 0 });
  });

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

describe("statsByPlaybook (#2287 PR 7d)", () => {
  it("groups by playbookId and ranks by realized dollars, using the full tradeStats family", () => {
    const rows = statsByPlaybook([
      trip(50, { playbookId: "S1-NVDA" }),
      trip(-20, { playbookId: "G1-GOOG" }),
      trip(10, { playbookId: "S1-NVDA" }),
    ]);
    expect(rows.map((r) => r.playbookId)).toEqual(["S1-NVDA", "G1-GOOG"]);
    expect(rows[0]).toMatchObject({ trades: 2, wins: 2, winRate: 100, netRealized: 60 });
    // The full family rides along, not just the four SymbolStats fields.
    expect(rows[0]).toHaveProperty("profitFactor");
    expect(rows[0]).toHaveProperty("expectancy");
    expect(rows[0]).toHaveProperty("longestWinStreak");
    expect(rows[1]?.netRealized).toBe(-20);
  });

  it("excludes trips with no playbookId — a manual desk trade never scores as a playbook", () => {
    const rows = statsByPlaybook([trip(50, { playbookId: "S1-NVDA" }), trip(30)]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.playbookId).toBe("S1-NVDA");
    expect(rows[0]?.netRealized).toBe(50);
  });

  it("returns an empty list when nothing is attributed to a playbook at all", () => {
    expect(statsByPlaybook([trip(50), trip(-10)])).toEqual([]);
  });

  it("pools trips from what would be different participants under one playbook line", () => {
    // statsByPlaybook itself is participant-agnostic — the pooling across bots/humans happens
    // upstream (playbook-performance.ts); this just proves it never re-splits by anything but
    // playbookId once the trips are handed in already merged.
    const rows = statsByPlaybook([
      trip(100, { playbookId: "S1-NVDA" }),
      trip(50, { playbookId: "S1-NVDA" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ trades: 2, netRealized: 150 });
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
