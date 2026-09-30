import { betaFromCloses, type DailyClose, MIN_BETA_OBSERVATIONS } from "../../src/options/beta.js";

/**
 * Beta from real closes (#4327): the OLS slope of daily returns, fitted only where both series
 * closed, and refused — never guessed — when there is too little overlap to mean anything.
 */

/** Closes on consecutive days from a return path, starting at 100. */
function series(returns: readonly number[], startDay = 1): DailyClose[] {
  const out: DailyClose[] = [{ t: day(startDay), c: 100 }];
  returns.forEach((r, i) => {
    out.push({ t: day(startDay + i + 1), c: (out[i]?.c ?? 100) * (1 + r) });
  });
  return out;
}
function day(n: number): string {
  return new Date(Date.UTC(2026, 0, 1) + n * 86_400_000).toISOString();
}

// A deterministic, non-constant benchmark path.
const bench = Array.from({ length: 120 }, (_, i) => Math.sin(i * 1.7) * 0.01);

describe("beta from daily closes", () => {
  it("recovers the slope of a stock that moves exactly twice the benchmark", () => {
    const b = betaFromCloses(series(bench.map((r) => 2 * r)), series(bench));
    expect(b?.beta).toBeCloseTo(2, 9);
    expect(b?.observations).toBe(120);
  });

  it("is unmoved by a constant daily drift on the stock (the intercept, not the slope)", () => {
    const b = betaFromCloses(series(bench.map((r) => 0.5 * r + 0.001)), series(bench));
    expect(b?.beta).toBeCloseTo(0.5, 9);
  });

  it("stamps the as-of as the last day both series closed", () => {
    const stock = series(bench.map((r) => r));
    const b = betaFromCloses(stock, series(bench).slice(0, -3));
    expect(b?.asOf).toBe(day(118).slice(0, 10));
  });

  it("pairs only shared days, so a day missing from one series never spans two", () => {
    const stock = series(bench.map((r) => 2 * r));
    const gapped = stock.filter((_, i) => i !== 50);
    const b = betaFromCloses(gapped, series(bench));
    // Across the gap both series return over the SAME two-day span, so the pair stays honest;
    // compounding makes that one pair only approximately 2×.
    expect(b?.beta).toBeCloseTo(2, 3);
    expect(b?.observations).toBe(119);
  });

  it("refuses a beta on too little history rather than presenting noise", () => {
    const short = bench.slice(0, MIN_BETA_OBSERVATIONS - 1);
    expect(betaFromCloses(series(short.map((r) => r)), series(short))).toBeUndefined();
  });

  it("refuses a beta against a benchmark that never moved", () => {
    const flat = bench.map(() => 0);
    expect(betaFromCloses(series(bench), series(flat))).toBeUndefined();
  });
});
