import { RumorTraderPersona } from "../../src/personas/rumor-trader.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("RumorTraderPersona", () => {
  const persona = new RumorTraderPersona();

  describe("a story building on moderate, rising sentiment", () => {
    it("buys the rumor when flat", () => {
      const context = aContext({ AMD: { last: 120, momentum: 0.02, sentiment: 0.4 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "AMD", side: "buy" });
    });
  });

  describe("a held name once the headline lands (euphoric sentiment)", () => {
    it("sells the news", () => {
      const context = aContext({ AMD: { last: 140, momentum: 0.05, sentiment: 0.85 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AMD", quantity: 400 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents[0]).toMatchObject({ symbol: "AMD", side: "sell", quantity: 400 });
    });
  });

  describe("a name that's already euphoric while we're flat", () => {
    it("does not chase — the news is already out", () => {
      const context = aContext({ AMD: { last: 140, momentum: 0.05, sentiment: 0.9 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("positive sentiment but no momentum to confirm", () => {
    it("waits for the whisper to gain traction", () => {
      const context = aContext({ AMD: { last: 120, momentum: 0.0, sentiment: 0.4 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });
});
