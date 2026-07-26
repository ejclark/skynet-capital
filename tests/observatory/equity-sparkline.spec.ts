import { equityChange, renderEquitySparkline } from "../../src/observatory/equity-sparkline.js";
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
