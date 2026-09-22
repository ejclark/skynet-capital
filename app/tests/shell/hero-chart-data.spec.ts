import type { Bar } from "../../src/live/bars";
import type { EquityCurvePoint } from "../../src/live/equity-curve";
import { alignOverlay, curveDay } from "../../src/shell/hero-chart-data";

/**
 * The hero chart's alignment logic (#3186 slice 2) — the fiddly part, specced without mounting a
 * chart: two independently-fetched series (an account's equity curve, a benchmark symbol's daily
 * bars) folded onto one shared day axis, each normalized to % return from the portfolio curve's
 * own start.
 */

const point = (t: string, value: number): EquityCurvePoint => ({ t, value });
const bar = (t: string, c: number): Bar => ({ t, o: c, h: c, l: c, c, v: 0 });

describe("curveDay", () => {
  it("keeps the first ten characters of an ISO instant", () => {
    expect(curveDay("2026-09-10T14:00:00.000Z")).toBe("2026-09-10");
  });
});

describe("alignOverlay", () => {
  it("normalizes the portfolio series to the server's own % return, verbatim", () => {
    const curve = [point("2026-09-01T00:00:00Z", 0), point("2026-09-02T00:00:00Z", 0.05)];
    const { portfolio } = alignOverlay(curve, []);
    expect(portfolio).toEqual([
      { time: "2026-09-01", value: 0 },
      { time: "2026-09-02", value: 0.05 },
    ]);
  });

  it("normalizes the benchmark from the bar nearest at-or-before the curve's first day", () => {
    const curve = [point("2026-09-02T00:00:00Z", 0), point("2026-09-03T00:00:00Z", 0.1)];
    // Sep 2 has no SPY bar (a holiday) — the nearest at-or-before is Sep 1's close, $500.
    const bars = [bar("2026-09-01T00:00:00Z", 500), bar("2026-09-03T00:00:00Z", 550)];

    const { benchmark } = alignOverlay(curve, bars);

    expect(benchmark[0]).toEqual({ time: "2026-09-02", value: 0 }); // priced off the Sep 1 base
    expect(benchmark[1]?.time).toBe("2026-09-03");
    expect(benchmark[1]?.value).toBeCloseTo(0.1, 10); // 550 / 500 - 1
  });

  it("never looks at a benchmark bar AFTER the portfolio day it's pricing", () => {
    const curve = [point("2026-09-01T00:00:00Z", 0)];
    // Only a later bar exists — there is nothing to price Sep 1 against honestly.
    const bars = [bar("2026-09-05T00:00:00Z", 600)];

    const { benchmark } = alignOverlay(curve, bars);

    expect(benchmark).toEqual([]);
  });

  it("returns an empty benchmark series when no bars are available", () => {
    const curve = [point("2026-09-01T00:00:00Z", 0)];
    expect(alignOverlay(curve, []).benchmark).toEqual([]);
  });

  it("returns an empty overlay when the curve itself has no points", () => {
    expect(alignOverlay([], [bar("2026-09-01T00:00:00Z", 500)])).toEqual({
      portfolio: [],
      benchmark: [],
    });
  });

  it("dedupes multiple bars landing on the same day to that day's last close", () => {
    const curve = [point("2026-09-02T00:00:00Z", 0)];
    const bars = [bar("2026-09-01T09:30:00Z", 490), bar("2026-09-01T16:00:00Z", 500)];

    const { benchmark } = alignOverlay(curve, bars);

    expect(benchmark).toEqual([{ time: "2026-09-02", value: 0 }]);
  });
});
