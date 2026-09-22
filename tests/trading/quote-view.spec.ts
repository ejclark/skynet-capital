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

  it("tones a sub-cent decline neg even though the rounded dollar change is flat", () => {
    const view = quoteView("XYZ", { last: 0.4489, prevClose: 0.4523 });
    // Rounds to -$0.00 (a real -0, not a fabricated +0) — toBeCloseTo doesn't care about the
    // sign of zero, which is exactly the point: the DOLLAR figure is flat either way.
    expect(view.change).toBeCloseTo(0);
    expect(view.changePct).not.toBe(0);
    expect(view.tone).toBe("neg");
  });

  it("carries bid, ask and the cent-rounded mid when both sides are live (#3407 slice 6)", () => {
    const view = quoteView("NVDA", { last: 181.32, prevClose: 179.18, bid: 181.27, ask: 181.32 });
    expect(view).toMatchObject({ bid: 181.27, ask: 181.32, mid: 181.3 });
    // 181.295 rounds half-up to the cent the ticket will send
    expect(quoteView("X", { last: 1, prevClose: 1, bid: 181.28, ask: 181.31 }).mid).toBe(181.3);
  });

  it("carries no NBBO from half a book, a zero bid, or an inverted book", () => {
    expect(quoteView("X", { last: 1, prevClose: 1, bid: 181.27 })).not.toHaveProperty("mid");
    expect(quoteView("X", { last: 1, prevClose: 1, ask: 181.32 })).not.toHaveProperty("bid");
    expect(quoteView("X", { last: 1, prevClose: 1, bid: 0, ask: 181.32 })).not.toHaveProperty(
      "mid",
    );
    expect(quoteView("X", { last: 1, prevClose: 1, bid: 181.4, ask: 181.32 })).not.toHaveProperty(
      "mid",
    );
    // the flat guard keeps the book too
    expect(quoteView("X", { last: 1, prevClose: 0, bid: 1, ask: 1.02 })).toMatchObject({
      mid: 1.01,
    });
  });
});
