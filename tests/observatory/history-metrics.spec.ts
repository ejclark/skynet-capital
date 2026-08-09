import {
  aggregateDoubling,
  changeOver,
  DAY_MS,
  doubledAt,
  firstAccountToDouble,
  MONTH_MS,
  seedBaseline,
} from "../../src/observatory/history-metrics.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

const s = (at: string, equity: number, participantId = "x"): EquitySample => ({
  at,
  participantId,
  equity,
  cash: 0,
  realizedPl: 0,
});

const NOW = "2026-08-09T12:00:00.000Z";

describe("changeOver", () => {
  it("measures from the last sample at or before the window start", () => {
    const samples = [
      s("2026-08-07T12:00:00.000Z", 100), // two days back — the day-window baseline
      s("2026-08-08T11:00:00.000Z", 110), // just before the day cutoff → this is the baseline
      s("2026-08-09T09:00:00.000Z", 130),
    ];
    const change = changeOver(samples, DAY_MS, NOW);
    expect(change).toEqual({
      abs: 20,
      pct: (20 / 110) * 100,
      from: "2026-08-08T11:00:00.000Z",
      to: "2026-08-09T09:00:00.000Z",
      partial: false,
    });
  });

  it("marks a young history partial and falls back to the first sample", () => {
    const samples = [s("2026-08-09T10:00:00.000Z", 100), s("2026-08-09T11:00:00.000Z", 105)];
    const change = changeOver(samples, DAY_MS, NOW);
    expect(change?.partial).toBe(true);
    expect(change?.abs).toBe(5);
  });

  it("is null under two samples (the honest 'history still accruing' seam)", () => {
    expect(changeOver([], DAY_MS, NOW)).toBeNull();
    expect(changeOver([s("2026-08-09T10:00:00.000Z", 100)], DAY_MS, NOW)).toBeNull();
  });

  it("orders by timestamp regardless of input order", () => {
    const shuffled = [s("2026-08-09T09:00:00.000Z", 130), s("2026-08-07T12:00:00.000Z", 100)];
    expect(changeOver(shuffled, 3 * DAY_MS, NOW)?.abs).toBe(30);
  });

  it("the monthly window reaches back past samples the daily one excludes", () => {
    const samples = [
      s("2026-07-12T12:00:00.000Z", 100), // ~4 weeks back — inside the 30-day window only
      s("2026-08-08T11:00:00.000Z", 110),
      s("2026-08-09T09:00:00.000Z", 130),
    ];
    expect(changeOver(samples, MONTH_MS, NOW)?.abs).toBe(30); // from the July baseline
    expect(changeOver(samples, DAY_MS, NOW)?.abs).toBe(20); // from yesterday's sample
  });
});

describe("seedBaseline", () => {
  it("returns the earliest sample — the founding record", () => {
    const samples = [s("2026-08-09T09:00:00.000Z", 130), s("2026-08-07T12:00:00.000Z", 100)];
    expect(seedBaseline(samples)?.equity).toBe(100);
  });
  it("is null with no history", () => {
    expect(seedBaseline([])).toBeNull();
  });
});

describe("doubledAt", () => {
  it("finds the first instant equity reached 2× the seed", () => {
    const samples = [
      s("t1", 100),
      s("t2", 150),
      s("t3", 200), // doubled here
      s("t4", 250),
    ];
    expect(doubledAt(samples)?.at).toBe("t3");
  });

  it("is null while the account hasn't doubled", () => {
    expect(doubledAt([s("t1", 100), s("t2", 199)])).toBeNull();
  });

  it("never awards from a non-positive seed (no trophy from a broken baseline)", () => {
    expect(doubledAt([s("t1", 0), s("t2", 100)])).toBeNull();
  });
});

describe("firstAccountToDouble", () => {
  it("awards once, to the earliest doubling across participants", () => {
    const samples = [
      s("t1", 100, "alice"),
      s("t3", 210, "alice"), // alice doubles at t3
      s("t1", 50, "bob"),
      s("t2", 120, "bob"), // bob doubles at t2 — bob wins
    ];
    expect(firstAccountToDouble(samples)).toEqual({ participantId: "bob", at: "t2" });
  });

  it("is null while nobody has doubled", () => {
    expect(firstAccountToDouble([s("t1", 100, "alice"), s("t2", 150, "alice")])).toBeNull();
  });
});

describe("aggregateDoubling", () => {
  it("sums each participant's seed and latest, and flags the 2×", () => {
    const samples = [
      s("t1", 100, "alice"),
      s("t2", 250, "alice"),
      s("t1", 100, "bob"),
      s("t2", 150, "bob"),
    ];
    expect(aggregateDoubling(samples)).toEqual({ seedTotal: 200, latestTotal: 400, doubled: true });
  });

  it("does not flag below 2×", () => {
    const samples = [s("t1", 100, "alice"), s("t2", 199, "alice")];
    expect(aggregateDoubling(samples)?.doubled).toBe(false);
  });

  it("is null with no history", () => {
    expect(aggregateDoubling([])).toBeNull();
  });
});
