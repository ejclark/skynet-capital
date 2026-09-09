import { SauronPersona } from "../../src/personas/sauron.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("SauronPersona", () => {
  const persona = new SauronPersona();

  describe("panic bottoming with momentum turning up, while flat", () => {
    it("claims what fear discards — buys", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.8 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "buy" });
    });

    it("carries a structured strategy tag and forward claim — no stop exists in this config", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.8 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents[0]).toMatchObject({
        strategy: "sauron-panic-claim",
        forecast: { direction: "up" },
      });
      expect(intents[0]?.expectation).toBeTruthy();
      expect(intents[0]?.forecast?.invalidator).toBeTruthy();
      // The finding this PR exists to surface: plain Sauron has no stopMomentum field at all
      // (unlike sauron-hardcore.ts) — the forward claim must say so rather than inventing a stop.
      expect(intents[0]?.expectation).toContain("No stop exists");
    });

    it("sizes up with conviction the deeper the panic ran", () => {
      const shallow = persona.decide(
        aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.7 } }),
        aPortfolio(),
      );
      const deep = persona.decide(
        aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -1 } }),
        aPortfolio(),
      );

      expect((deep[0]?.quantity ?? 0) > (shallow[0]?.quantity ?? 0)).toBe(true);
    });
  });

  describe("euphoria peaking with momentum rolled over, while holding", () => {
    it("restores order — sells the whole position into the greed", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.01, sentiment: 0.8 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 300 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "sell", quantity: 300 });
    });

    it("carries a structured strategy tag and forward claim on the fade leg", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.01, sentiment: 0.8 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 300 })] });

      const intents = persona.decide(context, portfolio);

      expect(intents[0]).toMatchObject({
        strategy: "sauron-euphoria-fade",
        forecast: { direction: "down" },
      });
      expect(intents[0]?.forecast?.invalidator).toBeTruthy();
    });
  });

  describe("panic that is still falling (momentum not yet turned)", () => {
    it("waits — the extreme has not submitted yet", () => {
      const context = aContext({ NVDA: { last: 100, momentum: -0.03, sentiment: -0.8 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("euphoria still climbing (momentum positive), while holding", () => {
    it("does not fade a greed that is still building", () => {
      const context = aContext({ NVDA: { last: 200, momentum: 0.04, sentiment: 0.8 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 300 })] });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });
});
