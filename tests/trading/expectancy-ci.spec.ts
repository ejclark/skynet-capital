import { type ExpectancySample, expectancyBootstrapCI } from "../../src/trading/expectancy-ci.js";

/**
 * `expectancyBootstrapCI` (#2287 PR 7c) — the block bootstrap over whole trading days. A seeded
 * mulberry32 generator makes the resampling deterministic so the interval assertions below are
 * exact, not "close to."
 */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sample = (closedAt: string, returnPct: number): ExpectancySample => ({ closedAt, returnPct });

describe("expectancyBootstrapCI", () => {
  it("returns an honest all-null result for zero samples", () => {
    expect(expectancyBootstrapCI([])).toEqual({
      pointEstimate: null,
      ci: null,
      confidence: 0.95,
      sampleCount: 0,
      dayCount: 0,
    });
  });

  it("computes a point estimate but refuses a CI below the minimum day count — no false precision", () => {
    const samples = [
      sample("2026-09-01T14:00:00Z", 10),
      sample("2026-09-02T14:00:00Z", -5),
      sample("2026-09-03T14:00:00Z", 20),
    ];
    const result = expectancyBootstrapCI(samples);
    expect(result.pointEstimate).toBeCloseTo((10 - 5 + 20) / 3);
    expect(result.ci).toBeNull();
    expect(result.dayCount).toBe(3);
    expect(result.sampleCount).toBe(3);
  });

  it("treats multiple trades on the same day as ONE block, not one per trade", () => {
    // Two trades on day 1, one each on days 2-5 — five distinct days clears the minimum even
    // though day 1 alone contributes two samples.
    const samples = [
      sample("2026-09-01T13:00:00Z", 10),
      sample("2026-09-01T15:00:00Z", 30),
      sample("2026-09-02T14:00:00Z", 5),
      sample("2026-09-03T14:00:00Z", 5),
      sample("2026-09-04T14:00:00Z", 5),
      sample("2026-09-05T14:00:00Z", 5),
    ];
    const result = expectancyBootstrapCI(samples, { rng: seededRng(1) });
    expect(result.dayCount).toBe(5);
    expect(result.sampleCount).toBe(6);
    expect(result.ci).not.toBeNull();
  });

  it("degenerates to a single point when every day has the identical R-multiple", () => {
    const samples = Array.from({ length: 6 }, (_, i) => sample(`2026-09-0${i + 1}T14:00:00Z`, 7));
    const result = expectancyBootstrapCI(samples, { rng: seededRng(42) });
    expect(result.pointEstimate).toBe(7);
    expect(result.ci).toEqual({ low: 7, high: 7 });
  });

  it("never returns an inverted interval — low is always <= high", () => {
    const samples = [
      sample("2026-09-01T14:00:00Z", 40),
      sample("2026-09-02T14:00:00Z", -30),
      sample("2026-09-03T14:00:00Z", 10),
      sample("2026-09-04T14:00:00Z", -15),
      sample("2026-09-05T14:00:00Z", 25),
      sample("2026-09-06T14:00:00Z", -20),
    ];
    const result = expectancyBootstrapCI(samples, { rng: seededRng(7) });
    expect(result.ci).not.toBeNull();
    expect(result.ci?.low).toBeLessThanOrEqual(result.ci?.high as number);
  });

  it("widens the interval as the daily returns get more volatile, same seed both times", () => {
    const tight = [10, 11, 9, 10, 11, 9].map((r, i) => sample(`2026-09-0${i + 1}T14:00:00Z`, r));
    const volatile = [80, -60, 70, -50, 90, -70].map((r, i) =>
      sample(`2026-09-0${i + 1}T14:00:00Z`, r),
    );
    const tightResult = expectancyBootstrapCI(tight, { rng: seededRng(99) });
    const volatileResult = expectancyBootstrapCI(volatile, { rng: seededRng(99) });
    const tightWidth = (tightResult.ci?.high as number) - (tightResult.ci?.low as number);
    const volatileWidth = (volatileResult.ci?.high as number) - (volatileResult.ci?.low as number);
    expect(volatileWidth).toBeGreaterThan(tightWidth);
  });

  it("honors a custom confidence level and echoes it back on the result", () => {
    const samples = Array.from({ length: 6 }, (_, i) =>
      sample(`2026-09-0${i + 1}T14:00:00Z`, i % 2 === 0 ? 10 : -10),
    );
    const result = expectancyBootstrapCI(samples, { confidence: 0.8, rng: seededRng(3) });
    expect(result.confidence).toBe(0.8);
    expect(result.ci).not.toBeNull();
  });
});
