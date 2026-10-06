import { describeHolding } from "../../src/companion/companion-holding.js";

// The position half of the chat's context stamp (#2224 shape 2, slice 2): what the member holds
// on the page's symbol, from their own desk read — and nothing when that read can't be trusted.

const shares = { symbol: "NVDA", quantity: 100, avgPrice: 120, marketValue: 13_000 };
const shortPut = {
  symbol: "NVDA261218P00100000",
  quantity: -1,
  avgPrice: 320,
  marketValue: -150,
};
const other = { symbol: "MSFT", quantity: 10, avgPrice: 400, marketValue: 4_200 };

describe("describeHolding — their own position on the page's symbol", () => {
  it("names shares and contracts on the symbol, and nothing else they hold", () => {
    expect(describeHolding("NVDA", { positions: [shares, shortPut, other] })).toBe(
      "on NVDA they hold 100 shares at $120.00 avg, now worth $13,000.00; short 1 NVDA $100 PUT · 18 DEC 26 contract at $320.00 each, now worth -$150.00",
    );
  });

  it("says plainly when a successful read shows nothing on the symbol", () => {
    expect(describeHolding("AAPL", { positions: [shares, other] })).toBe(
      "they hold no open position on AAPL",
    );
  });

  it("does not match a ticker that merely starts with the symbol", () => {
    expect(describeHolding("NVD", { positions: [shares, shortPut] })).toBe(
      "they hold no open position on NVD",
    );
  });

  it("adds nothing without a symbol, without a desk, or when the desk read failed", () => {
    expect(describeHolding(undefined, { positions: [shares] })).toBeUndefined();
    expect(describeHolding("NVDA", undefined)).toBeUndefined();
    expect(describeHolding("NVDA", { positions: [], error: "401" })).toBeUndefined();
  });

  it("caps a long list of contracts", () => {
    const legs = Array.from({ length: 7 }, (_, i) => ({
      symbol: `NVDA2612${10 + i}C00200000`,
      quantity: 1,
      avgPrice: 100,
      marketValue: 90,
    }));
    const line = describeHolding("NVDA", { positions: legs });
    expect(line?.split("; ")).toHaveLength(6);
    expect(line).toMatch(/and 2 more$/);
  });
});
