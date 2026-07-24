import { priceEventFromMessage } from "../../src/alpaca/market-data-stream-events.js";

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
