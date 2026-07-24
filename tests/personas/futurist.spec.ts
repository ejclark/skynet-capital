import { FuturistPersona } from "../../src/personas/futurist.js";
import { NewsFaderPersona } from "../../src/personas/news-fader.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("FuturistPersona", () => {
  const persona = new FuturistPersona();

  describe("when a name breaks out on strong momentum", () => {
    it("buys into the strength", () => {
      const context = aContext({ PLTR: { last: 50, momentum: 0.05 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "PLTR", side: "buy" });
      expect(intents[0]?.quantity).toBeGreaterThan(0);
    });
  });

  describe("when it already holds the breakout name", () => {
    it("does not pyramid — one entry only", () => {
      const context = aContext({ PLTR: { last: 50, momentum: 0.05 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "PLTR" })] });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });

  describe("when momentum is flat", () => {
    it("waits", () => {
      const context = aContext({ PLTR: { last: 50, momentum: 0.0 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("news sentiment", () => {
    it("is ignored — a euphoric headline alone does not trigger a buy", () => {
      const context = aContext({ PLTR: { last: 50, momentum: 0.0, sentiment: 0.9 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });
});

/**
 * The two personas are designed to be mirror images. This spec pins that contract:
 * on the same euphoric tape, the Futurist buys and the News Fader sells.
 */
describe("Futurist vs News Fader on the same euphoric tape", () => {
  it("take opposite sides", () => {
    const context = aContext({ NVDA: { last: 120, momentum: 0.06, sentiment: 0.8 } });
    const held = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 100 })] });

    const faderIntents = new NewsFaderPersona().decide(context, held);
    const futuristIntents = new FuturistPersona().decide(context, aPortfolio());

    expect(faderIntents[0]?.side).toBe("sell");
    expect(futuristIntents[0]?.side).toBe("buy");
  });
});
