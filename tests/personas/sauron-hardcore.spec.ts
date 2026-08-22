import { applyHardcore, createDefaultPersonas } from "../../src/personas/registry.js";
import {
  HARDCORE_SAURON_CONFIG,
  SauronHardcorePersona,
} from "../../src/personas/sauron-hardcore.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("SauronHardcorePersona", () => {
  const persona = new SauronHardcorePersona();

  it("keeps Sauron's identity — same id, so the same account and ledger", () => {
    expect(persona.id).toBe("sauron");
    expect(persona.name).toBe("Sauron");
  });

  describe("panic claim — loosened threshold, tranche-sized, fully contextualized", () => {
    it("buys a small tranche at panic -0.4 (standard Sauron would wait for -0.7)", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.4 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "buy", urgent: true });
      // Tranche-sized: ~12k notional, not standard Sauron's ~120k.
      expect((intents[0]?.quantity ?? 0) * 100).toBeLessThan(30_000);
    });

    it("labels the trade with its strategy and forward expectation — the research contract", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });

      const intent = persona.decide(context, aPortfolio())[0];

      expect(intent?.strategy).toBe("hc-panic-claim");
      expect(intent?.expectation).toContain("mean-reversion");
      expect(intent?.reason).toContain("panic");
    });

    it("scales IN — a held tranche does not block the next claim while room remains", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const oneTranche = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 120, avgPrice: 100 })],
      });

      const intents = persona.decide(context, oneTranche);

      expect(intents[0]).toMatchObject({ symbol: "NVDA", side: "buy" });
    });

    it("stops scaling at the tranche cap", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const capped = aPortfolio({
        // 3 tranches' worth already held: 360 × $100 = $36k = 3 × trancheNotional.
        positions: [aPosition({ symbol: "NVDA", quantity: 360, avgPrice: 100 })],
      });

      expect(persona.decide(context, capped)).toEqual([]);
    });
  });

  describe("euphoria fade — scales OUT instead of dumping", () => {
    it("sells half into exhausted greed at the loosened threshold", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });

      const intent = persona.decide(context, portfolio)[0];

      expect(intent).toMatchObject({
        symbol: "NVDA",
        side: "sell",
        quantity: 100,
        strategy: "hc-euphoria-fade",
      });
    });

    it("closes the whole position when the remainder would be dust", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      // Half of 40 leaves 20 × $200 = $4k < dustNotional — no tails.
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] });

      expect(persona.decide(context, portfolio)[0]).toMatchObject({ side: "sell", quantity: 40 });
    });
  });

  describe("momentum stop — the universal exit", () => {
    it("withdraws fully when momentum breaks, even in euphoric sentiment", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.01, sentiment: 0.5 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });

      const intent = persona.decide(context, portfolio)[0];

      expect(intent).toMatchObject({
        side: "sell",
        quantity: 200,
        strategy: "hc-momentum-stop",
      });
    });
  });

  describe("momentum scalp — the ordinary-conditions play", () => {
    it("rides a strong run when sentiment says nothing at all", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.1 } });

      const intent = persona.decide(context, aPortfolio())[0];

      expect(intent).toMatchObject({
        side: "buy",
        urgent: true,
        strategy: "hc-momentum-scalp",
      });
      expect(intent?.expectation).toContain("intraday");
    });

    it("does not momentum-chase into panic or euphoria bands — those have their own plays", () => {
      const panicky = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: -0.5 } });
      const claimed = persona.decide(panicky, aPortfolio())[0];
      expect(claimed?.strategy).toBe("hc-panic-claim");

      const euphoric = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.5 } });
      expect(persona.decide(euphoric, aPortfolio())).toEqual([]);
    });
  });

  describe("restraint survives the loosening", () => {
    it("still does nothing in genuinely quiet conditions", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.005, sentiment: -0.2 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });

    it("still refuses a falling knife — panic without the momentum turn", () => {
      const context = aContext({ NVDA: { last: 100, momentum: -0.03, sentiment: -0.6 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });

    it("imposes no order on a garbage quote", () => {
      const context = aContext({ NVDA: { last: 0, momentum: 0.01, sentiment: -0.6 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  it("uses the documented default config", () => {
    expect(HARDCORE_SAURON_CONFIG.trancheNotional).toBeLessThan(120_000 / 5);
    expect(HARDCORE_SAURON_CONFIG.panicSentiment).toBeGreaterThan(-0.7);
  });
});

describe("applyHardcore — the SKYNET_HARDCORE_BOTS roster swap", () => {
  it("stays completely dark when the var is unset", () => {
    const base = createDefaultPersonas();
    const roster = applyHardcore(base, {} as NodeJS.ProcessEnv);
    expect(roster.hardcore.size).toBe(0);
    expect(roster.rejected).toEqual([]);
    expect(roster.personas).toEqual(base);
  });

  it("swaps a named persona for its hardcore build, same id and slot", () => {
    const roster = applyHardcore(createDefaultPersonas(), {
      SKYNET_HARDCORE_BOTS: "sauron",
    } as NodeJS.ProcessEnv);
    const sauron = roster.personas.find((p) => p.id === "sauron");
    expect(sauron).toBeInstanceOf(SauronHardcorePersona);
    expect(roster.hardcore.has("sauron")).toBe(true);
  });

  it("Mission Control overrides the env in both directions", () => {
    const disarmed = applyHardcore(
      createDefaultPersonas(),
      { SKYNET_HARDCORE_BOTS: "sauron" } as NodeJS.ProcessEnv,
      { bots: { sauron: { hardcore: false } } },
    );
    expect(disarmed.hardcore.size).toBe(0);

    const armed = applyHardcore(createDefaultPersonas(), {} as NodeJS.ProcessEnv, {
      bots: { sauron: { hardcore: true } },
    });
    expect(armed.hardcore.has("sauron")).toBe(true);
    expect(armed.personas.find((p) => p.id === "sauron")).toBeInstanceOf(SauronHardcorePersona);
  });

  it("refuses ids with no hardcore build instead of guessing", () => {
    const roster = applyHardcore(createDefaultPersonas(), {
      SKYNET_HARDCORE_BOTS: "sauron, banker",
    } as NodeJS.ProcessEnv);
    expect(roster.hardcore.has("sauron")).toBe(true);
    expect(roster.rejected).toEqual(["banker"]);
    expect(roster.personas.find((p) => p.id === "banker")).not.toBeInstanceOf(
      SauronHardcorePersona,
    );
  });
});
