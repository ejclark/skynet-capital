import { DayTraderPersona } from "../../src/personas/day-trader.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("DayTraderPersona", () => {
  const persona = new DayTraderPersona();

  describe("a big-tech name with strong momentum", () => {
    it("goes long when flat", () => {
      const context = aContext({ NVDA: { last: 140, momentum: 0.03 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "buy" });
    });
  });

  describe("a held big-tech name whose momentum rolls over", () => {
    it("cuts it fast", () => {
      const context = aContext({ AAPL: { last: 200, momentum: -0.02 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 500 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents[0]).toMatchObject({ symbol: "AAPL", side: "sell", quantity: 500 });
    });
  });

  describe("a strong mover outside the focus list", () => {
    it("is ignored — it only trades its watchlist", () => {
      const context = aContext({ EEM: { last: 45, momentum: 0.08 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("a focus name drifting sideways", () => {
    it("waits", () => {
      const context = aContext({ MSFT: { last: 430, momentum: 0.0 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });
});
