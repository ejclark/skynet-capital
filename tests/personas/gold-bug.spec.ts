import { GoldBugPersona } from "../../src/personas/gold-bug.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * The Gold Bug distrusts equities. It buys the safe haven (GLD) when the market
 * turns risk-off, hoards it, and never touches a risk asset.
 */
describe("GoldBugPersona", () => {
  const persona = new GoldBugPersona();

  describe("when broad sentiment turns risk-off and it holds no gold", () => {
    it("buys the safe haven", () => {
      const context = aContext({
        SPY: { last: 500, sentiment: -0.6 },
        GLD: { last: 200 },
      });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "GLD", side: "buy" });
    });
  });

  describe("when already hoarding gold in a risk-off market", () => {
    it("does not pyramid", () => {
      const context = aContext({
        SPY: { last: 500, sentiment: -0.6 },
        GLD: { last: 200 },
      });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "GLD", quantity: 50 })] });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });

  describe("when the market is calm or euphoric", () => {
    it("does nothing — no risk-off signal", () => {
      const context = aContext({
        SPY: { last: 500, momentum: 0.06, sentiment: 0.8 },
        GLD: { last: 200 },
      });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("even in a risk-off panic", () => {
    it("never buys a risk asset — only the safe haven", () => {
      const context = aContext({
        SPY: { last: 500, sentiment: -0.9 },
        GLD: { last: 200 },
      });

      const intents = persona.decide(context, aPortfolio());

      expect(intents.every((i) => i.symbol === "GLD")).toBe(true);
    });
  });
});
