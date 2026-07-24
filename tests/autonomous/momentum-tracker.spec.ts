import { MomentumTracker } from "../../src/autonomous/momentum-tracker.js";

describe("MomentumTracker", () => {
  it("returns 0 momentum until at least two ticks exist", () => {
    const t = new MomentumTracker();
    expect(t.momentum("NVDA")).toBe(0);
    t.record("NVDA", 100);
    expect(t.momentum("NVDA")).toBe(0);
  });

  it("computes fractional change across the window", () => {
    const t = new MomentumTracker();
    t.record("NVDA", 100);
    t.record("NVDA", 110);
    expect(t.momentum("NVDA")).toBeCloseTo(0.1, 10);
  });

  it("only considers the most recent `window` ticks", () => {
    const t = new MomentumTracker(3);
    t.record("NVDA", 100); // falls out of the window
    t.record("NVDA", 200);
    t.record("NVDA", 210);
    t.record("NVDA", 220); // window is now [200, 210, 220]
    expect(t.momentum("NVDA")).toBeCloseTo((220 - 200) / 200, 10);
  });

  it("builds a context with quotes and momentum for every tracked symbol", () => {
    const t = new MomentumTracker();
    t.record("NVDA", 100);
    t.record("NVDA", 105);
    const ctx = t.context("2026-07-24T14:00:00Z");
    expect(ctx.quotes.NVDA).toMatchObject({ symbol: "NVDA", last: 105 });
    expect(ctx.momentum?.NVDA).toBeCloseTo(0.05, 10);
  });
});
