import { benchmarkReturns } from "../../src/observatory/benchmark-returns.js";

// SPY's per-window return for the Accounts hero's "vs S&P" column (#3689 slice 3).
describe("benchmarkReturns", () => {
  const bar = (day: string, c: number) => ({ t: `${day}T04:00:00Z`, c });

  it("measures last close against the close on or just before each window's start", () => {
    const r = benchmarkReturns([
      bar("2026-08-24", 480), // 30 days before 9/23 falls on this Monday
      bar("2026-09-15", 495),
      bar("2026-09-16", 500), // exactly 7 days back
      bar("2026-09-23", 510),
    ]);
    expect(r["7D"]).toBeCloseTo(510 / 500 - 1, 10);
    expect(r["1M"]).toBeCloseTo(510 / 480 - 1, 10);
  });

  it("leaves out a window the bars don't reach, rather than stretching a shorter one", () => {
    const r = benchmarkReturns([bar("2026-09-16", 500), bar("2026-09-23", 510)]);
    expect(r["7D"]).toBeDefined();
    expect(r["3M"]).toBeUndefined();
    expect(r["1Y"]).toBeUndefined();
  });

  it("says nothing without bars", () => {
    expect(benchmarkReturns([])).toEqual({});
  });
});
