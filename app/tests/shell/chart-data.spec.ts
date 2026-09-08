import type { Bar } from "../../src/live/bars";
import {
  barsToSeriesData,
  barTime,
  compactVolume,
  indexBarsByDay,
  isUpBar,
  timeKey,
  withAlpha,
} from "../../src/shell/chart-data";

/**
 * The chart section's pure data-mapping layer (#2017 Phase 1 chart build-out, the mount slice) —
 * specced WITHOUT mounting a chart, per `docs/ENGINEERING.md`'s gotcha: bars → the candle and
 * volume points `lightweight-charts` draws, the day-direction colour on the volume band, and the
 * legend's helpers.
 */

const TONE = { pos: "#3fb950", neg: "#f85149" };

const bar = (t: string, o: number, h: number, l: number, c: number, v: number): Bar => ({
  t,
  o,
  h,
  l,
  c,
  v,
});

describe("barsToSeriesData", () => {
  const bars = [
    bar("2026-09-01T00:00:00Z", 100, 105, 99, 104, 1_200_000),
    bar("2026-09-02T00:00:00Z", 104, 106, 101, 102, 845_000),
    bar("2026-09-03", 102, 102, 98, 102, 500),
  ];
  const data = barsToSeriesData(bars, TONE);

  it("maps every bar to a business-day candle with the OHLC verbatim", () => {
    expect(data.candles).toEqual([
      { time: "2026-09-01", open: 100, high: 105, low: 99, close: 104 },
      { time: "2026-09-02", open: 104, high: 106, low: 101, close: 102 },
      { time: "2026-09-03", open: 102, high: 102, low: 98, close: 102 },
    ]);
  });

  it("colours each volume bar by that day's direction, at reduced alpha", () => {
    expect(data.volume.map((p) => p.value)).toEqual([1_200_000, 845_000, 500]);
    expect(data.volume.map((p) => p.color)).toEqual(["#3fb95080", "#f8514980", "#3fb95080"]);
  });

  it("keeps candle and volume times aligned one-to-one", () => {
    expect(data.volume.map((p) => p.time)).toEqual(data.candles.map((p) => p.time));
  });

  it("maps an empty array to empty series", () => {
    expect(barsToSeriesData([], TONE)).toEqual({ candles: [], volume: [] });
  });
});

describe("isUpBar", () => {
  it("reads a close at or above the open as up, below as down", () => {
    expect(isUpBar(bar("2026-09-01", 10, 11, 9, 10.5, 1))).toBe(true);
    expect(isUpBar(bar("2026-09-01", 10, 11, 9, 10, 1))).toBe(true);
    expect(isUpBar(bar("2026-09-01", 10, 11, 9, 9.5, 1))).toBe(false);
  });
});

describe("withAlpha", () => {
  it("appends the alpha byte to a 6-digit hex", () => {
    expect(withAlpha("#3fb950")).toBe("#3fb95080");
    expect(withAlpha("#3FB950", "40")).toBe("#3FB95040");
  });

  it("leaves any other colour form untouched rather than guessing", () => {
    expect(withAlpha("rgb(63, 185, 80)")).toBe("rgb(63, 185, 80)");
    expect(withAlpha("#3fb95080")).toBe("#3fb95080");
    expect(withAlpha("")).toBe("");
  });
});

describe("barTime / timeKey / indexBarsByDay", () => {
  it("folds an ISO timestamp and a bare date to the same business day", () => {
    expect(barTime("2026-09-04T00:00:00Z")).toBe("2026-09-04");
    expect(barTime("2026-09-04")).toBe("2026-09-04");
  });

  it("folds every Time shape the crosshair can hand back to the same key", () => {
    expect(timeKey("2026-09-04")).toBe("2026-09-04");
    expect(timeKey({ year: 2026, month: 9, day: 4 })).toBe("2026-09-04");
    expect(timeKey(Math.floor(Date.UTC(2026, 8, 4) / 1000) as never)).toBe("2026-09-04");
  });

  it("indexes bars by day so a crosshair time finds its bar", () => {
    const bars = [bar("2026-09-01T00:00:00Z", 1, 2, 0, 1, 1), bar("2026-09-02", 1, 2, 0, 1, 2)];
    const byDay = indexBarsByDay(bars);
    expect(byDay.get(timeKey({ year: 2026, month: 9, day: 2 }))).toBe(bars[1]);
    expect(byDay.get("2026-09-03")).toBeUndefined();
  });
});

describe("compactVolume", () => {
  it("reads millions with one decimal, thousands with none, small counts plain", () => {
    expect(compactVolume(1_234_567)).toBe("1.2M");
    expect(compactVolume(845_000)).toBe("845K");
    expect(compactVolume(845_499)).toBe("845K");
    expect(compactVolume(950)).toBe("950");
    expect(compactVolume(0)).toBe("0");
    expect(compactVolume(2_500_000_000)).toBe("2.5B");
  });
});
