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

  describe("restore/snapshot — durability across a process restart", () => {
    it("snapshot returns exactly what was recorded", () => {
      const t = new MomentumTracker();
      t.record("NVDA", 100);
      t.record("NVDA", 110);
      expect(t.snapshot()).toEqual({ NVDA: [100, 110] });
    });

    it("restore seeds a fresh tracker so momentum reads correctly with no new ticks", () => {
      const t = new MomentumTracker();
      t.restore({ NVDA: [100, 110] });
      expect(t.momentum("NVDA")).toBeCloseTo(0.1, 10);
      expect(t.lastPrice("NVDA")).toBe(110);
    });

    it("trims a restored series to the current window size", () => {
      const t = new MomentumTracker(2);
      t.restore({ NVDA: [90, 100, 110] });
      expect(t.snapshot().NVDA).toEqual([100, 110]);
    });

    it("round-trips through snapshot -> restore on a fresh tracker", () => {
      const original = new MomentumTracker();
      original.record("NVDA", 100);
      original.record("NVDA", 105);
      const restored = new MomentumTracker();
      restored.restore(original.snapshot());
      expect(restored.snapshot()).toEqual(original.snapshot());
    });
  });
});
