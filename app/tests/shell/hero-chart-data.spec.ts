import type { Bar } from "../../src/live/bars";
import type { EquityCurvePoint } from "../../src/live/equity-curve";
import { alignOverlay, curveDay, flowMarkers } from "../../src/shell/hero-chart-data";

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

describe("flowMarkers (#4563)", () => {
  const portfolio = [
    { time: "2026-10-01", value: 0 },
    { time: "2026-10-02", value: 0.01 },
    { time: "2026-10-06", value: 0.3 },
  ] as const;
  const flow = (t: string, direction: "added" | "removed" = "added") => ({
    t,
    direction,
    label: `Capital ${direction} $300,000 — not a gain`,
  });

  it("places a flow on the day it landed when the curve draws that day", () => {
    expect(flowMarkers([flow("2026-10-02T15:00:00.000Z")], portfolio)).toEqual([
      { time: "2026-10-02", direction: "added", label: "Capital added $300,000 — not a gain" },
    ]);
  });

  it("moves a weekend reset onto the next day the curve draws, never an earlier one", () => {
    expect(flowMarkers([flow("2026-10-04T15:00:00.000Z")], portfolio)[0]?.time).toBe("2026-10-06");
  });

  it("draws no marker for a flow newer than the curve's last point — no point holds it yet", () => {
    expect(flowMarkers([flow("2026-10-09T15:00:00.000Z")], portfolio)).toEqual([]);
  });

  it("moves a reset made after the close onto the next session, where the jump shows", () => {
    // 6:30 p.m. ET on Oct 2 — still Oct 2 in UTC, but Oct 2's point closed without the capital.
    expect(flowMarkers([flow("2026-10-02T22:30:00.000Z")], portfolio)[0]?.time).toBe("2026-10-06");
  });

  it("reads the day in market time, so a late-evening ET reset is not pulled a UTC day ahead", () => {
    // 11:30 a.m. ET on Oct 2 lands on Oct 2; 9:00 p.m. ET on Oct 1 is Oct 2 in UTC and after
    // Oct 1's close, so it lands on Oct 2 either way — the session that first holds it.
    const placed = flowMarkers(
      [flow("2026-10-02T15:30:00.000Z"), flow("2026-10-02T01:00:00.000Z")],
      portfolio,
    );
    expect(placed.map((m) => m.time)).toEqual(["2026-10-02", "2026-10-02"]);
  });

  it("keeps a reset made before the open on its own session", () => {
    // 8:00 a.m. ET on Oct 2.
    expect(flowMarkers([flow("2026-10-02T12:00:00.000Z")], portfolio)[0]?.time).toBe("2026-10-02");
  });

  it("draws nothing on an empty curve", () => {
    expect(flowMarkers([flow("2026-10-02T15:00:00.000Z")], [])).toEqual([]);
  });

  it("rides the overlay only when there is a flow — a curve with none reads as today", () => {
    const curve = [point("2026-10-01T04:00:00Z", 0), point("2026-10-02T04:00:00Z", 0.3)];
    expect("flows" in alignOverlay(curve, [])).toBe(false);
    expect(alignOverlay(curve, [], [flow("2026-10-02T15:00:00.000Z")]).flows).toHaveLength(1);
  });
});
