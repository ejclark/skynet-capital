import {
  basketIndex,
  cagr,
  cashGrowth,
  drawdownProfile,
  harvest,
  nearTrough,
  rollingStarts,
  simulate,
  timing,
  triggerMoves,
} from "../../scripts/research/rebalance-band-math.mjs";

/**
 * The rebalancing-band backtest's book-keeping (#5483 slice 1, the dry-powder study). Specified
 * against constructed series with known answers: the failures these exist to prevent are a band
 * that fires at the wrong price (the default the study ships is read straight off these rules), a
 * holding place that quietly earns too much or too little, and a timing hit rate that judges trades
 * the data cannot judge.
 */

const flat = (n: number) => Array.from({ length: n }, () => 1);

describe("cashGrowth", () => {
  it("compounds a yield over calendar days, so a weekend earns three days", () => {
    const g = cashGrowth(["2026-01-02", "2027-01-02"], [0.05, 0.05]);
    expect(g[0]).toBe(1);
    expect(g[1]).toBeCloseTo(1.05, 10);
    const weekend = cashGrowth(["2026-10-09", "2026-10-12"], [0.0365, 0.0365]);
    expect(weekend[1]).toBeCloseTo(1.0365 ** (3 / 365), 12);
  });

  it("carries the last known yield over a missing day, and a leading gap uses the first known", () => {
    const g = cashGrowth(["2026-01-01", "2026-01-02", "2026-01-03"], [null, 0.1, null]);
    // (0 → 1) uses the first known yield (0.1) for the leading gap; (1 → 2) uses day 1's.
    expect(g[1]).toBeCloseTo(1.1 ** (1 / 365), 12);
    expect(g[2]).toBeCloseTo(1.1 ** (1 / 365), 12);
  });
});

describe("basketIndex", () => {
  it("is the mean of each member's growth from the first session", () => {
    expect(
      basketIndex([
        [10, 20, 5],
        [4, 4, 8],
      ]),
    ).toEqual([1, 1.5, 1.25]);
  });

  it("refuses members on different calendars", () => {
    expect(() => basketIndex([[1, 2], [1]])).toThrow(/aligned/);
  });
});

describe("simulate", () => {
  it("with no holding and no band is buy and hold", () => {
    const run = simulate([100, 150, 75], flat(3), { hold: 0, band: Infinity });
    expect(run.equity).toEqual([1, 1.5, 0.75]);
    expect(run.trades).toHaveLength(0);
  });

  it("with an infinite band is the static mix: the active share drifts and nothing trades", () => {
    const run = simulate([100, 200], flat(2), { hold: 0.3, band: Infinity });
    expect(run.equity[1]).toBeCloseTo(0.7 * 2 + 0.3, 12);
    expect(run.trades).toHaveLength(0);
    expect(run.maxDrift).toBeCloseTo(1.4 / 1.7 - 0.7, 12);
  });

  it("buys with holding after a fall past the band, back to the target at that close", () => {
    const run = simulate([100, 70], flat(2), { hold: 0.3, band: 0.05 });
    const eq = 0.7 * 0.7 + 0.3;
    expect(run.trades).toEqual([
      {
        i: 1,
        side: "buy",
        drift: expect.closeTo(0.49 / eq - 0.7, 12),
        moved: expect.closeTo(0.7 - 0.49 / eq, 12),
      },
    ]);
    expect(run.equity[1]).toBeCloseTo(eq, 12);
  });

  it("trims to holding after a rise past the band, and pays its cost out of holding", () => {
    const run = simulate([100, 140], flat(2), { hold: 0.3, band: 0.05, costBps: 10 });
    const eq = 0.7 * 1.4 + 0.3;
    const moved = 0.98 - 0.7 * eq;
    expect(run.trades[0]?.side).toBe("sell");
    expect(run.equity[1]).toBeCloseTo(eq - moved * 0.001, 12);
  });

  it("harvests volatility in a flat-but-choppy tape (Shannon's demon)", () => {
    // ×2, ×½, ×2, ×½: buy and hold ends where it started; a 50/50 mix rebalanced every close
    // gains 12.5% per round trip.
    const closes = [1, 2, 1, 2, 1];
    expect(simulate(closes, flat(5), { hold: 0, band: Infinity }).equity.at(-1)).toBe(1);
    const demon = simulate(closes, flat(5), { hold: 0.5, band: 0 });
    expect(demon.equity.at(-1)).toBeCloseTo(1.125 ** 2, 12);
    expect(demon.trades.map((t) => t.side)).toEqual(["sell", "buy", "sell", "buy"]);
  });

  it("refuses a holding target that leaves nothing active", () => {
    expect(() => simulate([1, 1], flat(2), { hold: 1, band: 0.1 })).toThrow(/hold/);
  });
});

describe("triggerMoves", () => {
  it("translates a band in points of active share into the price move that trips it", () => {
    const t = triggerMoves(0.3, 0.05);
    expect(t.fall).toBeCloseTo(0.195 / 0.245 - 1, 12); // about −20%
    expect(t.rise).toBeCloseTo(0.225 / 0.175 - 1, 12); // about +29%
  });

  it("agrees with the simulator: just past the fall trips the band, just short of it does not", () => {
    const { fall } = triggerMoves(0.3, 0.1);
    const past = simulate([100, 100 * (1 + fall) - 0.01], flat(2), { hold: 0.3, band: 0.1 });
    const short = simulate([100, 100 * (1 + fall) + 0.01], flat(2), { hold: 0.3, band: 0.1 });
    expect(past.trades).toHaveLength(1);
    expect(short.trades).toHaveLength(0);
  });

  it("says never when the band's upper edge is a fully active book", () => {
    expect(triggerMoves(0.1, 0.15).rise).toBe(Infinity);
  });
});

describe("drawdownProfile", () => {
  it("reads the deepest fall, the share of sessions ≥ 10% under, and the longest stretch under", () => {
    const p = drawdownProfile([1, 1.2, 0.9, 1.0, 1.3]);
    expect(p.maxDd).toBeCloseTo(-0.25, 12);
    expect(p.timeUnder).toBeCloseTo(2 / 5, 12);
    expect(p.longestUnder).toBe(2);
  });

  it("counts a stretch still underwater at the end as far as it got", () => {
    expect(drawdownProfile([1, 0.95, 0.95, 0.95]).longestUnder).toBe(3);
  });
});

describe("timing", () => {
  // A V: down 1 a session to 80, then back up. The trough is session 20.
  const v = [
    ...Array.from({ length: 21 }, (_, i) => 100 - i),
    ...Array.from({ length: 20 }, (_, i) => 81 + i),
  ];

  it("judges a buy at the trough as near it, and one well above it as not", () => {
    expect(nearTrough(v, 20, 3)).toBe(true);
    expect(nearTrough(v, 15, 10)).toBe(false); // 85 against a local low of 80: 6% above
  });

  it("only judges trades with a full window either side, and reports the base rate beside them", () => {
    const trades = [
      { i: 20, side: "buy" as const, drift: -0.06, moved: 0.06 },
      { i: 1, side: "buy" as const, drift: -0.06, moved: 0.06 },
    ];
    const t = timing(v, trades, 5);
    expect(t.buys).toMatchObject({ judged: 1, hits: 1, rate: 1, unjudged: 1 });
    expect(t.buys.base).toBeGreaterThan(0);
    expect(t.buys.base).toBeLessThan(1);
    expect(t.sells).toMatchObject({ judged: 0, rate: null });
  });
});

describe("cagr, harvest and rollingStarts", () => {
  it("annualizes over calendar years", () => {
    expect(cagr([1, 4], ["2020-01-01", "2022-01-01"])).toBeCloseTo(4 ** (365.25 / 731) - 1, 12);
  });

  it("reads zero harvest when the band grew exactly at its parts' weighted geometric mean", () => {
    const parts = 1.2 ** 0.7 * 1.04 ** 0.3 - 1;
    expect(harvest(parts, 0.2, 0.04, 0.3)).toBeCloseTo(0, 12);
  });

  it("steps windows that fit entirely inside the series", () => {
    expect(rollingStarts(10, 4, 3)).toEqual([0, 3, 6]);
    expect(rollingStarts(3, 4, 1)).toEqual([]);
  });
});
