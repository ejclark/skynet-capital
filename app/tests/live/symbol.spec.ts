import { normalizeSymbol } from "../../src/live/symbol";

/**
 * `normalizeSymbol` (#738 cockpit plan, red-team finding) — the guard that keeps a hand-typed or
 * stale `?symbol=` in the URL from rendering garbage into the ticket. Not a copy of the server's
 * `UNDERLYING_PATTERN` — a looser, client-side shape check, so cases here should track what the
 * ticket's own symbol fields already accept (equities up to a class suffix, Alpaca crypto pairs).
 */
describe("normalizeSymbol", () => {
  it("trims and uppercases a lowercase symbol", () => {
    expect(normalizeSymbol("nvda")).toBe("NVDA");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSymbol("  aapl  ")).toBe("AAPL");
  });

  it("keeps a class-suffixed equity like BRK.B", () => {
    expect(normalizeSymbol("brk.b")).toBe("BRK.B");
  });

  it("keeps an Alpaca-style crypto pair like BTC/USD", () => {
    expect(normalizeSymbol("btc/usd")).toBe("BTC/USD");
  });

  it("drops a value with disallowed characters", () => {
    expect(normalizeSymbol("$$$")).toBeUndefined();
  });

  it("drops a value over 12 characters before any slash", () => {
    expect(normalizeSymbol("ABCDEFGHIJKLM")).toBeUndefined();
  });

  it("drops an empty string", () => {
    expect(normalizeSymbol("")).toBeUndefined();
  });

  it("drops a non-string value", () => {
    expect(normalizeSymbol(12345)).toBeUndefined();
    expect(normalizeSymbol({ symbol: "NVDA" })).toBeUndefined();
    expect(normalizeSymbol(undefined)).toBeUndefined();
    expect(normalizeSymbol(null)).toBeUndefined();
  });
});
