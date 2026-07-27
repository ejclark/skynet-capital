import {
  equityChange,
  equityDrawdown,
  renderEquitySparkline,
} from "../../src/observatory/equity-sparkline.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

const s = (at: string, equity: number): EquitySample => ({
  at,
  participantId: "x",
  equity,
  cash: 0,
  realizedPl: 0,
});

describe("renderEquitySparkline", () => {
  it("returns null for fewer than two samples (caller keeps the honest seam)", () => {
    expect(renderEquitySparkline([])).toBeNull();
    expect(renderEquitySparkline([s("t1", 100)])).toBeNull();
  });

  it("draws an SVG line for two or more samples", () => {
    const svg = renderEquitySparkline([s("t1", 100), s("t2", 120)]);
    expect(svg).toContain("<svg");
    expect(svg).toContain("equity-spark");
    expect(svg).toContain("<path");
  });

  it("colours the line by direction (pos when up, neg when down)", () => {
    expect(renderEquitySparkline([s("t1", 100), s("t2", 140)])).toContain("var(--pos)");
    expect(renderEquitySparkline([s("t1", 140), s("t2", 100)])).toContain("var(--neg)");
  });

  it("orders by timestamp regardless of input order", () => {
    const a = renderEquitySparkline([s("2026-01-02", 120), s("2026-01-01", 100)]);
    const b = renderEquitySparkline([s("2026-01-01", 100), s("2026-01-02", 120)]);
    expect(a).toBe(b); // sorted, so both render the same rising line
  });
});

describe("equityChange", () => {
  it("computes absolute + percent change across the window", () => {
    expect(equityChange([s("t1", 100), s("t2", 130)])).toEqual({ abs: 30, pct: 30 });
  });
  it("is null for fewer than two samples", () => {
    expect(equityChange([s("t1", 100)])).toBeNull();
  });
});

describe("equityDrawdown", () => {
  it("measures the worst peak-to-trough dip against the running peak", () => {
    // peak 120 at t2, trough 90 at t3 → dd = 30/120 = 25%; later recovery to 130 doesn't erase it.
    const dd = equityDrawdown([s("t1", 100), s("t2", 120), s("t3", 90), s("t4", 130)]);
    expect(dd).toEqual({ peak: 130, ddPct: 25, ddAbs: 30 });
  });
  it("is zero drawdown for a monotonic rise", () => {
    expect(equityDrawdown([s("t1", 100), s("t2", 110), s("t3", 130)])).toEqual({
      peak: 130,
      ddPct: 0,
      ddAbs: 0,
    });
  });
  it("orders by timestamp before measuring", () => {
    const dd = equityDrawdown([s("t3", 90), s("t1", 100), s("t2", 120)]);
    expect(dd).toEqual({ peak: 120, ddPct: 25, ddAbs: 30 });
  });
  it("is null for fewer than two samples", () => {
    expect(equityDrawdown([s("t1", 100)])).toBeNull();
  });
});
