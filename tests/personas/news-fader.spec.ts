import { NewsFaderPersona } from "../../src/personas/news-fader.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * Behavioral specs for the News Fader. These assert on *what the persona decides*
 * given a market — never on how it computes it — so the logic can be refactored freely.
 */
describe("NewsFaderPersona", () => {
  const persona = new NewsFaderPersona();

  describe("when a held name rips on strongly positive news", () => {
    it("sells the entire position to fade the hype", () => {
      const context = aContext({ NVDA: { last: 120, momentum: 0.06, sentiment: 0.8 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "sell", quantity: 200 });
    });
  });

  describe("when a name we don't hold capitulates on strongly negative news", () => {
    it("buys the panic", () => {
      const context = aContext({ ARKK: { last: 40, momentum: -0.07, sentiment: -0.8 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]?.side).toBe("buy");
      expect(intents[0]?.quantity).toBeGreaterThan(0);
    });
  });

  describe("when good news arrives but we hold nothing", () => {
    it("does not chase — it has no position to fade", () => {
      const context = aContext({ NVDA: { last: 120, momentum: 0.06, sentiment: 0.8 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("when the tape is quiet", () => {
    it("stays flat", () => {
      const context = aContext({ NVDA: { last: 120, momentum: 0.0, sentiment: 0.1 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA" })] });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });
});
