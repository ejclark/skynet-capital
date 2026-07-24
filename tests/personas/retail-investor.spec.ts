import { NewsFaderPersona } from "../../src/personas/news-fader.js";
import { RetailInvestorPersona } from "../../src/personas/retail-investor.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * The Retail Investor is the FOMO mirror of the News Fader: it BUYS the hype the
 * Fader sells, and PANIC-SELLS the fear the Fader buys. Specs pin that behavior.
 */
describe("RetailInvestorPersona", () => {
  const persona = new RetailInvestorPersona();

  describe("when a name we don't hold rips on strongly positive news", () => {
    it("chases it — buys the hype", () => {
      const context = aContext({ GME: { last: 30, momentum: 0.08, sentiment: 0.9 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "GME", side: "buy" });
      expect(intents[0]?.quantity).toBeGreaterThan(0);
    });
  });

  describe("when a held name craters on strongly negative news", () => {
    it("panic-sells the whole position", () => {
      const context = aContext({ GME: { last: 15, momentum: -0.09, sentiment: -0.8 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "GME", quantity: 300 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents[0]).toMatchObject({ symbol: "GME", side: "sell", quantity: 300 });
    });
  });

  describe("when hype hits but momentum hasn't confirmed", () => {
    it("does not chase on a headline alone", () => {
      const context = aContext({ GME: { last: 30, momentum: 0.0, sentiment: 0.9 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("mirror contract with the News Fader on a euphoric tape", () => {
    it("Retail buys what the Fader sells", () => {
      const context = aContext({ NVDA: { last: 120, momentum: 0.06, sentiment: 0.8 } });
      const held = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 100 })] });

      const retail = persona.decide(context, aPortfolio());
      const fader = new NewsFaderPersona().decide(context, held);

      expect(retail[0]?.side).toBe("buy");
      expect(fader[0]?.side).toBe("sell");
    });
  });
});
