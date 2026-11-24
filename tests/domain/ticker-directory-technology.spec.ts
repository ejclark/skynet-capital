import { TICKER_DIRECTORY } from "../../src/domain/ticker-directory/index.js";
import { TECHNOLOGY } from "../../src/domain/ticker-directory/technology.js";

const bySymbol = (symbol: string) => TECHNOLOGY.find((e) => e.symbol === symbol);

describe("the technology slice of the ticker directory", () => {
  describe("when every row is read", () => {
    it("labels each row with the Technology sector", () => {
      for (const entry of TECHNOLOGY) {
        expect(entry.sector).toBe("Technology");
      }
    });

    it("keeps symbols as upper-case tickers a member could type into the symbol field", () => {
      for (const entry of TECHNOLOGY) {
        expect(entry.symbol).toMatch(/^[A-Z]{1,5}$/);
      }
    });

    it("gives each row a trimmed, non-empty company name", () => {
      for (const entry of TECHNOLOGY) {
        expect(entry.name).not.toBe("");
        expect(entry.name).toBe(entry.name.trim());
      }
    });

    it("lists no symbol twice", () => {
      const symbols = TECHNOLOGY.map((e) => e.symbol);
      expect(new Set(symbols).size).toBe(symbols.length);
    });
  });

  describe("when a member looks for the well-known names", () => {
    it.each([
      ["AAPL", "Apple"],
      ["MSFT", "Microsoft"],
      ["NVDA", "Nvidia"],
      ["AMD", "AMD"],
      ["TSM", "Taiwan Semiconductor"],
      ["ASML", "ASML Holding"],
      ["PLTR", "Palantir"],
    ])("finds %s as %s", (symbol, name) => {
      expect(bySymbol(symbol)?.name).toBe(name);
    });

    it("covers the semiconductor names options traders reach for", () => {
      for (const symbol of ["NVDA", "AVGO", "INTC", "MU", "QCOM", "AMAT", "LRCX", "ARM"]) {
        expect(bySymbol(symbol)).toBeDefined();
      }
    });

    it("covers the software and cybersecurity names as well as hardware", () => {
      for (const symbol of ["CRM", "NOW", "PANW", "CRWD", "SNOW", "DDOG"]) {
        expect(bySymbol(symbol)).toBeDefined();
      }
    });
  });

  describe("when the slice is combined into the full directory", () => {
    it("appears first, in its listed order, ahead of every other sector", () => {
      expect(TICKER_DIRECTORY.slice(0, TECHNOLOGY.length)).toEqual(TECHNOLOGY);
    });

    it("shares no symbol with another sector's slice", () => {
      const rest = TICKER_DIRECTORY.slice(TECHNOLOGY.length).map((e) => e.symbol);
      const techSymbols = new Set(TECHNOLOGY.map((e) => e.symbol));
      expect(rest.filter((s) => techSymbols.has(s))).toEqual([]);
    });
  });
});
