import {
  AlpacaAtmQuotes,
  type AtmQuoteReader,
  pickAtmQuote,
  pickTenor,
} from "../../src/adapters/alpaca-atm-quotes.js";
import type { OptionChainRow } from "../../src/alpaca/alpaca-options-client.js";

/**
 * The live at-the-money quote behind the IV clock: a constant ~30-day tenor, the call nearest spot,
 * two-sided quotes at the mid — and absent, never fabricated, whenever any of that can't be read.
 */

const NOW = new Date("2026-09-25T19:40:00Z"); // 3:40 PM ET, a Friday

const row = (strike: number, bid?: number, ask?: number, closePrice?: number): OptionChainRow => ({
  occSymbol: `CRWV261023C${String(strike * 1000).padStart(8, "0")}`,
  strike,
  ...(bid !== undefined ? { bid } : {}),
  ...(ask !== undefined ? { ask } : {}),
  ...(closePrice !== undefined ? { closePrice } : {}),
});

describe("pickTenor", () => {
  it("takes the listed expiry nearest 30 days", () => {
    const tenor = pickTenor(["2026-10-02", "2026-10-16", "2026-10-23", "2026-11-20"], NOW);
    expect(tenor?.expiration).toBe("2026-10-23");
    expect(tenor?.daysToExpiry).toBeCloseTo(28, 0);
  });

  it("never samples a contract in its last week, even when it is the only one listed", () => {
    expect(pickTenor(["2026-09-26", "2026-10-01"], NOW)).toBeUndefined();
  });
});

describe("pickAtmQuote", () => {
  it("prices the call nearest spot at the mid of its two sides", () => {
    const quote = pickAtmQuote("CRWV", 86.9, 28, [
      row(80, 9, 9.4),
      row(85, 5.8, 6.2),
      row(90, 3.3, 3.7),
    ]);
    expect(quote).toEqual({
      symbol: "CRWV",
      spot: 86.9,
      strike: 85,
      daysToExpiry: 28,
      type: "call",
      midPrice: 6,
    });
  });

  it("skips a one-sided or close-only strike rather than solving a stale number", () => {
    const quote = pickAtmQuote("CRWV", 86.9, 28, [
      row(85, undefined, 6.2, 5.9),
      row(87, 0, 5),
      row(90, 3.3, 3.7),
    ]);
    expect(quote?.strike).toBe(90);
  });

  it("is absent when no strike is two-sided", () => {
    expect(pickAtmQuote("CRWV", 86.9, 28, [row(85, undefined, undefined, 6)])).toBeUndefined();
  });
});

describe("AlpacaAtmQuotes", () => {
  const reader = (over: Partial<AtmQuoteReader> = {}): AtmQuoteReader => ({
    getUnderlyingPrice: (s) => Promise.resolve(s === "CRWV" ? 86.9 : 400),
    getExpirations: () => Promise.resolve(["2026-10-02", "2026-10-23"]),
    getChain: () => Promise.resolve([row(85, 5.8, 6.2), row(400, 10, 10.4)]),
    ...over,
  });

  it("quotes every symbol it can, one per underlying", async () => {
    const quotes = await new AlpacaAtmQuotes(reader(), () => NOW).atmQuotes(["CRWV", "NVDA"]);
    expect(quotes.map((q) => [q.symbol, q.strike])).toEqual([
      ["CRWV", 85],
      ["NVDA", 400],
    ]);
  });

  it("leaves a symbol out when its spot, listing or chain can't be read — never throws", async () => {
    const quotes = await new AlpacaAtmQuotes(
      reader({
        getUnderlyingPrice: (s) => Promise.resolve(s === "HALT" ? undefined : 86.9),
        getChain: (s) =>
          s === "BOOM" ? Promise.reject(new Error("503")) : Promise.resolve([row(85, 5.8, 6.2)]),
      }),
      () => NOW,
    ).atmQuotes(["HALT", "BOOM", "CRWV"]);
    expect(quotes.map((q) => q.symbol)).toEqual(["CRWV"]);
  });
});
