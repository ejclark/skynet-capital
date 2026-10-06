import {
  priceEventFromMessage,
  quoteTickFromMessage,
} from "../../src/alpaca/market-data-stream-events.js";

describe("priceEventFromMessage", () => {
  it("maps a trade tick to a price event", () => {
    const event = priceEventFromMessage({ T: "t", S: "NVDA", p: 142.5, t: "2026-07-24T15:01:00Z" });
    expect(event).toEqual({
      type: "price",
      symbol: "NVDA",
      price: 142.5,
      at: "2026-07-24T15:01:00Z",
    });
  });

  it("ignores non-trade messages", () => {
    expect(priceEventFromMessage({ T: "q", S: "NVDA" })).toBeNull();
    expect(priceEventFromMessage({ T: "success", S: undefined })).toBeNull();
  });

  it("ignores a trade with no price", () => {
    expect(priceEventFromMessage({ T: "t", S: "NVDA" })).toBeNull();
  });
});

describe("quoteTickFromMessage", () => {
  it("maps a quote message to a bid/ask tick with the feed's own time", () => {
    expect(
      quoteTickFromMessage({ T: "q", S: "NVDA", bp: 141.2, ap: 141.3, t: "2026-10-01T15:01:00Z" }),
    ).toEqual({ symbol: "NVDA", bid: 141.2, ask: 141.3, at: "2026-10-01T15:01:00Z" });
  });

  it("ignores anything that isn't a quote, and a quote missing half its book", () => {
    expect(quoteTickFromMessage({ T: "t", S: "NVDA", p: 141 })).toBeNull();
    expect(quoteTickFromMessage({ T: "q", bp: 1, ap: 2 })).toBeNull();
    expect(quoteTickFromMessage({ T: "q", S: "NVDA", bp: 141.2 })).toBeNull();
    expect(quoteTickFromMessage({ T: "q", S: "NVDA", ap: 141.3 })).toBeNull();
  });

  it("passes a zero or inverted book through — judging it belongs to quote-view, not here", () => {
    // Two opinions on what counts as a tradeable book is how the two drift apart; `nbboView` in
    // `src/trading/quote-view.ts` is the one that decides.
    expect(quoteTickFromMessage({ T: "q", S: "NVDA", bp: 0, ap: 141.3, t: "x" })).toEqual({
      symbol: "NVDA",
      bid: 0,
      ask: 141.3,
      at: "x",
    });
    expect(quoteTickFromMessage({ T: "q", S: "NVDA", bp: 9, ap: 1, t: "x" })?.ask).toBe(1);
  });
});
