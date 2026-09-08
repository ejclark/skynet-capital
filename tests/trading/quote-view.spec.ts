import { quoteView } from "../../src/trading/quote-view.js";

describe("quoteView", () => {
  it("computes a positive change/pct, rounded to the cent and 2dp, tone pos", () => {
    const view = quoteView("NVDA", { last: 181.32, prevClose: 179.18 });
    expect(view).toEqual({
      symbol: "NVDA",
      last: 181.32,
      change: 2.14,
      changePct: 1.19,
      tone: "pos",
    });
  });

  it("computes a negative change/pct, tone neg", () => {
    const view = quoteView("NVDA", { last: 179.18, prevClose: 181.32 });
    expect(view.change).toBeCloseTo(-2.14);
    expect(view.changePct).toBeCloseTo(-1.18);
    expect(view.tone).toBe("neg");
  });

  it("is flat when last equals prevClose exactly", () => {
    const view = quoteView("NVDA", { last: 100, prevClose: 100 });
    expect(view.change).toBe(0);
    expect(view.changePct).toBe(0);
    expect(view.tone).toBe("flat");
  });

  it("guards a non-positive prevClose to a flat, zeroed change rather than a divide-by-zero", () => {
    const zero = quoteView("NVDA", { last: 100, prevClose: 0 });
    expect(zero).toEqual({ symbol: "NVDA", last: 100, change: 0, changePct: 0, tone: "flat" });

    const negative = quoteView("NVDA", { last: 100, prevClose: -5 });
    expect(negative).toEqual({ symbol: "NVDA", last: 100, change: 0, changePct: 0, tone: "flat" });
  });

  it("rounds float-noise change to the cent", () => {
    const view = quoteView("MSFT", { last: 420.15, prevClose: 420.1 });
    expect(String(view.change)).toMatch(/^-?\d+(\.\d{1,2})?$/);
    expect(view.change).toBeCloseTo(0.05);
  });
});
