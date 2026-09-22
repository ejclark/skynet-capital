import {
  HARDCORE_SAURON_CONFIG,
  SauronHardcorePersona,
} from "../../src/personas/sauron-hardcore.js";
import {
  type TacticalRule,
  tacticalIntentForSymbol,
} from "../../src/playbooks/tactical-playbook.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/** Hardcore Sauron's exact thresholds, translated into the four generic tactic kinds, in the
 *  same priority order `decideSymbol` checks them. Reused by the parity suite below and stands
 *  as the reference shape a real `HC-SAURON` playbook definition (a later slice) would declare. */
const HARDCORE_SAURON_RULES: readonly TacticalRule[] = [
  { kind: "momentum-stop", momentumAtOrBelow: HARDCORE_SAURON_CONFIG.stopMomentum },
  {
    kind: "sentiment-fade",
    sentimentAtOrAbove: HARDCORE_SAURON_CONFIG.euphoriaSentiment,
    momentumAtOrBelow: HARDCORE_SAURON_CONFIG.rolloverMomentumMax,
    exitFraction: HARDCORE_SAURON_CONFIG.exitFraction,
    dustNotional: HARDCORE_SAURON_CONFIG.dustNotional,
  },
  {
    kind: "sentiment-claim",
    sentimentAtOrBelow: HARDCORE_SAURON_CONFIG.panicSentiment,
    momentumAtOrAbove: HARDCORE_SAURON_CONFIG.reboundMomentumMin,
    trancheNotional: HARDCORE_SAURON_CONFIG.trancheNotional,
    maxConviction: HARDCORE_SAURON_CONFIG.maxConviction,
    maxTrancheValue:
      HARDCORE_SAURON_CONFIG.trancheNotional * HARDCORE_SAURON_CONFIG.maxTranchesPerSymbol,
  },
  {
    kind: "momentum-scalp",
    momentumAtOrAbove: HARDCORE_SAURON_CONFIG.scalpEntryMomentum,
    sentimentAbove: HARDCORE_SAURON_CONFIG.panicSentiment,
    sentimentBelow: HARDCORE_SAURON_CONFIG.euphoriaSentiment,
    notional: HARDCORE_SAURON_CONFIG.scalpNotional,
    maxTrancheValue:
      HARDCORE_SAURON_CONFIG.trancheNotional * HARDCORE_SAURON_CONFIG.maxTranchesPerSymbol,
  },
];

describe("tacticalIntentForSymbol", () => {
  describe("momentum-stop", () => {
    const rule: TacticalRule = { kind: "momentum-stop", momentumAtOrBelow: -0.004 };

    it("sells everything held when momentum breaks the stop", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.01, sentiment: 0.5 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        portfolio,
      );

      expect(intent).toMatchObject({ side: "sell", quantity: 200, urgent: true });
    });

    it("never fires against a flat position, however negative momentum runs", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.5, sentiment: 0 } });

      expect(
        tacticalIntentForSymbol("HC-TEST", "standard", "NVDA", [rule], context, aPortfolio()),
      ).toBeNull();
    });
  });

  describe("sentiment-fade", () => {
    const rule: TacticalRule = {
      kind: "sentiment-fade",
      sentimentAtOrAbove: 0.35,
      momentumAtOrBelow: 0.005,
      exitFraction: 0.5,
      dustNotional: 6_000,
    };

    it("sells the configured fraction into exhausted euphoria", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        portfolio,
      );

      expect(intent).toMatchObject({ side: "sell", quantity: 100 });
    });

    it("closes the whole position when the remainder would be dust", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        portfolio,
      );

      expect(intent).toMatchObject({ side: "sell", quantity: 40 });
    });
  });

  describe("sentiment-claim", () => {
    const rule: TacticalRule = {
      kind: "sentiment-claim",
      sentimentAtOrBelow: -0.35,
      momentumAtOrAbove: -0.005,
      trancheNotional: 12_000,
      maxConviction: 2,
      maxTrancheValue: 36_000,
    };

    it("buys a conviction-scaled tranche into panic", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        aPortfolio(),
      );

      expect(intent).toMatchObject({ side: "buy", urgent: true });
      expect((intent?.quantity ?? 0) * 100).toBeGreaterThan(12_000); // conviction > 1x
    });

    it("scales in — an existing tranche does not block the next claim while room remains", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 120, avgPrice: 100 })],
      });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        portfolio,
      );

      expect(intent).toMatchObject({ side: "buy" });
    });

    it("stops scaling once the shared tranche cap is reached", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 360, avgPrice: 100 })],
      });

      expect(
        tacticalIntentForSymbol("HC-TEST", "standard", "NVDA", [rule], context, portfolio),
      ).toBeNull();
    });
  });

  describe("momentum-scalp", () => {
    const rule: TacticalRule = {
      kind: "momentum-scalp",
      momentumAtOrAbove: 0.012,
      sentimentAbove: -0.35,
      sentimentBelow: 0.35,
      notional: 8_000,
      maxTrancheValue: 36_000,
    };

    it("rides a run when sentiment is unremarkable", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.1 } });

      const intent = tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        [rule],
        context,
        aPortfolio(),
      );

      expect(intent).toMatchObject({ side: "buy", urgent: true });
    });

    it("never fires inside the panic or euphoria bands — those have their own tactics", () => {
      const euphoric = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.5 } });
      expect(
        tacticalIntentForSymbol("HC-TEST", "standard", "NVDA", [rule], euphoric, aPortfolio()),
      ).toBeNull();

      const panicky = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: -0.5 } });
      expect(
        tacticalIntentForSymbol("HC-TEST", "standard", "NVDA", [rule], panicky, aPortfolio()),
      ).toBeNull();
    });
  });

  it("returns null on a garbage quote", () => {
    const context = aContext({ NVDA: { last: 0, momentum: 0.01, sentiment: -0.6 } });

    expect(
      tacticalIntentForSymbol(
        "HC-TEST",
        "standard",
        "NVDA",
        HARDCORE_SAURON_RULES,
        context,
        aPortfolio(),
      ),
    ).toBeNull();
  });

  /**
   * Parity with `SauronHardcorePersona` (issue #3527 plan, slice 1): the same scenarios that
   * characterize the bespoke persona today, run through the generic tactic chain instead. This is
   * the safety net a later slice's cutover leans on — if this suite passes, the tactic chain is a
   * faithful, config-only re-expression of hardcore Sauron's exact behavior.
   */
  describe("parity with SauronHardcorePersona", () => {
    const persona = new SauronHardcorePersona();

    function bothDecide(
      context: ReturnType<typeof aContext>,
      portfolio: ReturnType<typeof aPortfolio>,
    ) {
      const personaIntent = persona.decide(context, portfolio)[0] ?? null;
      const tacticalIntent = tacticalIntentForSymbol(
        "HC-SAURON",
        "standard",
        "NVDA",
        HARDCORE_SAURON_RULES,
        context,
        portfolio,
      );
      return { personaIntent, tacticalIntent };
    }

    it("panic claim: same side and quantity", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(tacticalIntent).toMatchObject({
        side: personaIntent?.side,
        quantity: personaIntent?.quantity,
      });
    });

    it("scale-in: same side and quantity with a tranche already held", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 120, avgPrice: 100 })],
      });
      const { personaIntent, tacticalIntent } = bothDecide(context, portfolio);

      expect(tacticalIntent).toMatchObject({
        side: personaIntent?.side,
        quantity: personaIntent?.quantity,
      });
    });

    it("tranche cap: both refuse once the cap is reached", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.01, sentiment: -0.5 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "NVDA", quantity: 360, avgPrice: 100 })],
      });
      const { personaIntent, tacticalIntent } = bothDecide(context, portfolio);

      expect(personaIntent).toBeNull();
      expect(tacticalIntent).toBeNull();
    });

    it("euphoria fade: same side and quantity", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });
      const { personaIntent, tacticalIntent } = bothDecide(context, portfolio);

      expect(tacticalIntent).toMatchObject({
        side: personaIntent?.side,
        quantity: personaIntent?.quantity,
      });
    });

    it("dust close: same quantity (the whole position, not half)", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.001, sentiment: 0.4 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 40 })] });
      const { personaIntent, tacticalIntent } = bothDecide(context, portfolio);

      expect(tacticalIntent).toMatchObject({ quantity: personaIntent?.quantity });
    });

    it("momentum stop: same quantity, takes priority over euphoric sentiment", () => {
      const context = aContext({ NVDA: { last: 200, momentum: -0.01, sentiment: 0.5 } });
      const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 200 })] });
      const { personaIntent, tacticalIntent } = bothDecide(context, portfolio);

      expect(tacticalIntent).toMatchObject({
        side: personaIntent?.side,
        quantity: personaIntent?.quantity,
      });
    });

    it("momentum scalp: same side", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.1 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(tacticalIntent).toMatchObject({ side: personaIntent?.side });
    });

    it("panic beats scalp priority in both engines", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: -0.5 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(personaIntent?.strategy).toBe("hc-panic-claim");
      expect(tacticalIntent).toMatchObject({ side: "buy" });
    });

    it("euphoria blocks the scalp in both engines", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.015, sentiment: 0.5 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(personaIntent).toBeNull();
      expect(tacticalIntent).toBeNull();
    });

    it("quiet conditions: both do nothing", () => {
      const context = aContext({ NVDA: { last: 100, momentum: 0.005, sentiment: -0.2 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(personaIntent).toBeNull();
      expect(tacticalIntent).toBeNull();
    });

    it("falling knife: both refuse panic without the momentum turn", () => {
      const context = aContext({ NVDA: { last: 100, momentum: -0.03, sentiment: -0.6 } });
      const { personaIntent, tacticalIntent } = bothDecide(context, aPortfolio());

      expect(personaIntent).toBeNull();
      expect(tacticalIntent).toBeNull();
    });
  });
});
