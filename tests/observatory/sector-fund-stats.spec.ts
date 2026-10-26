import { fundStats, realizedVol20 } from "../../src/observatory/sector-fund-stats.js";

/**
 * The sector fund numbers on R&D → Coverage (#3811 slice 3, criterion 5): a month's return, its
 * gap to SPY over the SAME stretch, and 20-day realized vol — absent, never estimated, when the
 * bars cannot support them.
 */

const DAY = 24 * 60 * 60 * 1000;
const END = Date.parse("2026-10-23T04:00:00Z");

/** Daily bars ending on END, one per calendar day, closing at `close(i)` (i = 0 is the oldest). */
const bars = (days: number, close: (i: number) => number) =>
  Array.from({ length: days }, (_, i) => ({
    t: new Date(END - (days - 1 - i) * DAY).toISOString(),
    c: close(i),
  }));

describe("sector fund stats", () => {
  it("measures the month as last close against the close 30 days back", () => {
    // 40 days of bars: the close 30 days before the last (index 9) is 100, the last is 110.
    const stats = fundStats(
      bars(40, (i) => (i < 10 ? 100 : 110)),
      undefined,
    );
    expect(stats?.ret).toBeCloseTo(0.1, 6);
    expect(stats?.asOf).toBe("2026-10-23");
  });

  it("states the gap to SPY when both legs end on the same session", () => {
    const fund = bars(40, (i) => (i < 10 ? 100 : 110));
    const spy = bars(40, (i) => (i < 10 ? 100 : 104));
    expect(fundStats(fund, spy)?.vsSpy).toBeCloseTo(0.06, 6);
  });

  it("leaves the gap out when SPY's bars stop on a different day", () => {
    const fund = bars(40, (i) => (i < 10 ? 100 : 110));
    const spy = bars(40, () => 100).slice(0, -1);
    expect(fundStats(fund, spy)?.vsSpy).toBeUndefined();
  });

  it("returns nothing when the bars do not reach back a month", () => {
    expect(
      fundStats(
        bars(10, () => 100),
        undefined,
      ),
    ).toBeUndefined();
  });

  it("annualizes 20 daily log returns, and is zero for a flat line", () => {
    expect(realizedVol20(bars(30, () => 100))).toBe(0);
    // Alternating ±1% moves: a daily sd near 1%, so annualized near 16%.
    const vol = realizedVol20(bars(30, (i) => (i % 2 === 0 ? 100 : 101)));
    expect(vol).toBeGreaterThan(0.15);
    expect(vol).toBeLessThan(0.17);
  });

  it("will not call 19 returns a 20-day vol", () => {
    expect(realizedVol20(bars(20, (i) => 100 + i))).toBeUndefined();
  });
});
