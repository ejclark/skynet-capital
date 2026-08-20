import {
  buildOccSymbol,
  humanizeOptionSymbol,
  isOccSymbol,
  parseOccSymbol,
} from "../../src/trading/option-symbols.js";

describe("OCC option symbols", () => {
  it("builds the broker's wire format from parts", () => {
    expect(
      buildOccSymbol({ underlying: "MSFT", expiration: "2026-09-18", type: "put", strike: 420 }),
    ).toBe("MSFT260918P00420000");
    expect(
      buildOccSymbol({
        underlying: "brk.b",
        expiration: "2026-01-02",
        type: "call",
        strike: 132.5,
      }),
    ).toBe("BRK.B260102C00132500");
  });

  it("round-trips through parse", () => {
    const parts = parseOccSymbol("MSFT260918P00420000");
    expect(parts).toEqual({
      underlying: "MSFT",
      expiration: "2026-09-18",
      type: "put",
      strike: 420,
    });
    expect(parseOccSymbol("AAPL261218C00150000")?.strike).toBe(150);
  });

  it("tells option contracts apart from plain tickers", () => {
    expect(isOccSymbol("MSFT260918P00420000")).toBe(true);
    expect(isOccSymbol("MSFT")).toBe(false);
    expect(isOccSymbol("AAPL")).toBe(false);
    expect(parseOccSymbol("not-an-option")).toBeUndefined();
  });

  it("refuses unbuildable input rather than emitting a wrong symbol", () => {
    expect(() =>
      buildOccSymbol({ underlying: "MSFT", expiration: "18 SEP 26", type: "put", strike: 420 }),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      buildOccSymbol({ underlying: "MSFT", expiration: "2026-09-18", type: "put", strike: 0 }),
    ).toThrow(/strike/);
  });

  it("humanizes for the blotter, passing plain tickers through untouched", () => {
    expect(humanizeOptionSymbol("MSFT260918P00420000")).toBe("MSFT $420 PUT · 18 SEP 26");
    expect(humanizeOptionSymbol("AAPL261218C00152500")).toBe("AAPL $152.50 CALL · 18 DEC 26");
    expect(humanizeOptionSymbol("AAPL")).toBe("AAPL");
  });
});

describe("BRK.B-style dotted underlyings", () => {
  it("does not treat a dotted ticker as an option", () => {
    expect(isOccSymbol("BRK.B")).toBe(false);
  });
});
