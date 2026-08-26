import { ScriptedAtmQuotes } from "../../src/adapters/scripted-atm-quotes.js";
import type { AtmOptionQuote } from "../../src/ports/atm-quotes.js";

const quote = (symbol: string): AtmOptionQuote => ({
  symbol,
  spot: 100,
  strike: 100,
  daysToExpiry: 30,
  type: "call",
  midPrice: 4.57,
});

describe("ScriptedAtmQuotes", () => {
  it("serves only the requested underlyings", async () => {
    const port = new ScriptedAtmQuotes([quote("NVDA"), quote("GOOG")]);
    const quotes = await port.atmQuotes(["NVDA"]);
    expect(quotes.map((q) => q.symbol)).toEqual(["NVDA"]);
  });

  it("omits a symbol it has no quote for, rather than inventing a zeroed one", async () => {
    const port = new ScriptedAtmQuotes([quote("NVDA")]);
    expect(await port.atmQuotes(["NVDA", "MU"])).toHaveLength(1);
  });

  it("answers an empty table with nothing at all", async () => {
    const port = new ScriptedAtmQuotes([]);
    expect(await port.atmQuotes(["NVDA"])).toEqual([]);
  });

  it("preserves the requested order", async () => {
    const port = new ScriptedAtmQuotes([quote("NVDA"), quote("GOOG"), quote("MU")]);
    const quotes = await port.atmQuotes(["MU", "NVDA"]);
    expect(quotes.map((q) => q.symbol)).toEqual(["MU", "NVDA"]);
  });
});
