import {
  barOn,
  changePct,
  dailyReturns,
  median,
  peakAndDrawdown,
  shockDays,
} from "../../scripts/research/energy-recheck-math.mjs";

/**
 * The energy re-check's pure half (#6952 slice 1). The failures these exist to prevent: a weekend
 * as-of date reading as "no price", a peak taken from anything but a daily close, and one name's
 * own collapse being filed as a basket-wide shock day.
 */

const px = (pairs: [string, number][]) => pairs.map(([date, close]) => ({ date, close }));

const series = px([
  ["2026-08-11", 100],
  ["2026-08-12", 100],
  ["2026-08-13", 120],
  ["2026-08-14", 90],
  ["2026-11-06", 80],
]);

describe("barOn", () => {
  it("falls back to the last session on or before a weekend date", () => {
    expect(barOn(series, "2026-08-16")?.date).toBe("2026-08-14");
  });

  it("is null before the series starts", () => {
    expect(barOn(series, "2026-01-01")).toBeNull();
  });
});

describe("changePct", () => {
  it("measures close to close across the window", () => {
    expect(changePct(series, "2026-08-12", "2026-11-06")).toBeCloseTo(-20);
  });

  it("is null when both ends land on the same session", () => {
    expect(changePct(series, "2026-08-15", "2026-08-16")).toBeNull();
  });
});

describe("peakAndDrawdown", () => {
  it("measures from the highest daily close inside the window", () => {
    expect(peakAndDrawdown(series, "2026-08-01", "2026-11-06")).toEqual({
      peakDate: "2026-08-13",
      peak: 120,
      drawdownPct: (80 / 120 - 1) * 100,
    });
  });

  it("ignores a higher close outside the window", () => {
    expect(peakAndDrawdown(series, "2026-08-14", "2026-11-06")?.peak).toBe(90);
  });
});

describe("dailyReturns", () => {
  it("keys each session's return by its own date, the window's first day included", () => {
    const r = dailyReturns(series, "2026-08-13", "2026-08-14");
    expect([...r.keys()]).toEqual(["2026-08-13", "2026-08-14"]);
    expect(r.get("2026-08-13")).toBeCloseTo(20);
    expect(r.get("2026-08-14")).toBeCloseTo(-25);
  });
});

describe("median", () => {
  it("averages the middle pair of an even list", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("shockDays", () => {
  it("ranks by the median member, so one name's collapse is not a basket shock", () => {
    const rets = {
      A: new Map([
        ["d1", -40],
        ["d2", -5],
      ]),
      B: new Map([
        ["d1", 1],
        ["d2", -6],
      ]),
      C: new Map([
        ["d1", 2],
        ["d2", -4],
      ]),
    };
    const worst = shockDays(rets, { n: 1, minNames: 3 })[0];
    if (!worst) throw new Error("expected a shock day");
    expect(worst.date).toBe("d2");
    expect(worst.median).toBe(-5);
    expect(worst.moves).toEqual({ A: -5, B: -6, C: -4 });
  });

  it("skips a session too few members traded", () => {
    const rets = { A: new Map([["d1", -9]]), B: new Map([["d2", -1]]) };
    expect(shockDays(rets, { minNames: 2 })).toEqual([]);
  });
});
