import { equityDrawdown } from "../../src/observatory/equity-sparkline.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

const s = (at: string, equity: number): EquitySample => ({
  at,
  participantId: "x",
  equity,
  cash: 0,
  realizedPl: 0,
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
