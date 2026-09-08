import { searchTickers, TICKER_DIRECTORY } from "../../src/domain/ticker-directory/index.js";
import { trackedUnderlyings } from "../../src/research/tracked-underlyings.js";

describe("the ticker directory", () => {
  it("has no duplicate symbols", () => {
    const symbols = TICKER_DIRECTORY.map((e) => e.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("has no empty names", () => {
    for (const entry of TICKER_DIRECTORY) {
      expect(entry.name.trim()).not.toBe("");
    }
  });

  it("contains every symbol trackedUnderlyings() derives", () => {
    const symbols = new Set(TICKER_DIRECTORY.map((e) => e.symbol));
    for (const symbol of trackedUnderlyings()) {
      expect(symbols.has(symbol)).toBe(true);
    }
  });

  it("is broad — roughly 350-500 entries, not a handful of mega-caps", () => {
    expect(TICKER_DIRECTORY.length).toBeGreaterThanOrEqual(350);
    expect(TICKER_DIRECTORY.length).toBeLessThanOrEqual(500);
  });
});

describe("searchTickers", () => {
  it("returns an empty list for an empty query", () => {
    expect(searchTickers("")).toEqual([]);
  });

  it("returns an empty list for a whitespace-only query", () => {
    expect(searchTickers("   ")).toEqual([]);
  });

  it("ranks an exact symbol match first", () => {
    const results = searchTickers("NVDA");
    expect(results[0]?.symbol).toBe("NVDA");
  });

  it("puts a symbol-prefix match among the first results", () => {
    const results = searchTickers("NV");
    expect(results.some((e) => e.symbol === "NVDA")).toBe(true);
    expect(results[0]?.symbol).toBe("NVDA");
  });

  it("matches on company name (nvidia)", () => {
    const results = searchTickers("nvidia");
    expect(results.some((e) => e.symbol === "NVDA")).toBe(true);
  });

  it("matches on company name (apple)", () => {
    const results = searchTickers("apple");
    expect(results.some((e) => e.symbol === "AAPL")).toBe(true);
  });

  it("respects the limit and never returns duplicate symbols", () => {
    const results = searchTickers("a", 5);
    expect(results.length).toBeLessThanOrEqual(5);
    const symbols = results.map((e) => e.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("defaults the limit to 8", () => {
    const results = searchTickers("a");
    expect(results.length).toBeLessThanOrEqual(8);
  });
});
