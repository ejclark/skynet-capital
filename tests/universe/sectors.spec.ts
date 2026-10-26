import { sectorOf } from "../../src/universe/sectors.js";

describe("sectors", () => {
  describe("sectorOf", () => {
    it("maps known tickers to sectors and defaults the rest to market", () => {
      expect(sectorOf("NVDA")).toBe("tech");
      expect(sectorOf("meta")).toBe("tech"); // case-insensitive
      expect(sectorOf("XOM")).toBe("energy");
      expect(sectorOf("EEM")).toBe("broad");
      expect(sectorOf("GLD")).toBe("gold");
      expect(sectorOf("WMT")).toBe("market");
    });
  });
});
