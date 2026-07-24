import type { OrderIntent } from "../../src/domain/types.js";
import { applyGuards } from "../../src/engine/guards.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

const buy = (symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side: "buy",
  quantity,
  type: "market",
  reason: "test",
});

const sell = (symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side: "sell",
  quantity,
  type: "market",
  reason: "test",
});

describe("applyGuards", () => {
  describe("a buy larger than the per-position cap", () => {
    it("is clamped down to the cap, not dropped", () => {
      const context = aContext({ EEM: { last: 100 } }); // ask ~100.05
      const portfolio = aPortfolio({ cash: 1_000_000 });

      // 20% of $1M equity = $200k budget -> ~1999 shares at ~100.05.
      const [approved] = applyGuards([buy("EEM", 10_000)], portfolio, context, {
        maxPositionPct: 0.2,
      });

      expect(approved?.side).toBe("buy");
      expect(approved?.quantity).toBeGreaterThan(0);
      expect(approved?.quantity).toBeLessThan(10_000);
      // Position value must not exceed the 20% cap.
      const eemAsk = context.quotes.EEM?.ask ?? 0;
      expect((approved?.quantity ?? 0) * eemAsk).toBeLessThanOrEqual(200_000);
    });
  });

  describe("a buy with no cash", () => {
    it("is dropped entirely", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ cash: 0 });

      expect(applyGuards([buy("EEM", 10)], portfolio, context)).toEqual([]);
    });
  });

  describe("a sell larger than the holding", () => {
    it("is clamped to the quantity actually held", () => {
      const context = aContext({ EEM: { last: 100 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "EEM", quantity: 30 })] });

      const [approved] = applyGuards([sell("EEM", 500)], portfolio, context);

      expect(approved).toMatchObject({ side: "sell", quantity: 30 });
    });
  });

  describe("a sell of something not held", () => {
    it("is dropped (no accidental shorting)", () => {
      const context = aContext({ EEM: { last: 100 } });

      expect(applyGuards([sell("EEM", 10)], aPortfolio(), context)).toEqual([]);
    });
  });
});
