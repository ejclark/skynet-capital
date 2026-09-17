import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { ProspectorPersona, WARM_UP_CLAIMS } from "../../src/personas/prospector.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { SauronHardcorePersona } from "../../src/personas/sauron-hardcore.js";
import { planForceFlatten } from "../../src/risk/force-flatten.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * CHARACTERIZATION SPECS (issue #3194, "Playbook Anatomy," step 1) — golden-master coverage of
 * every roster persona's `decide()` chained through `applyGuardsWithVerdicts` (and, once, through
 * `planForceFlatten`), pinning TODAY's actual behavior before any anatomy work touches this layer.
 *
 * This is deliberately NOT a test of whether the behavior is *correct* — each persona already has
 * its own behavioral spec for that (`tests/personas/<name>.spec.ts`). This file exists so that any
 * later step in #3194's rollout (additive schema fields, isolation/determinism audits, graduated
 * exit-safety wiring) has a safety net: if one of these assertions goes red, a real behavior change
 * slipped in, and the step that caused it must explain why before it's allowed to proceed.
 *
 * The one persona-level gap the existing per-persona specs don't cover is the CHAINED path through
 * guards — `applyGuardsWithVerdicts` is exercised in isolation (`tests/engine/guards.spec.ts`) and
 * against hand-built intents, never against a real persona's own `decide()` output. That's the gap
 * this file fills, plus one full `decide → guards → force-flatten` chain (using Sauron) proving the
 * three-stage pipeline holds end to end, matching the precedent already set in
 * `tests/risk/force-flatten.spec.ts`'s own guards-chaining test.
 */

const personaById = (id: string) => createDefaultPersonas().find((p) => p.id === id);

describe("characterization: persona.decide() → applyGuardsWithVerdicts", () => {
  it("news-fader: buys the panic and it survives guards untouched", () => {
    const persona = personaById("news-fader");
    const context = aContext({ AAPL: { sentiment: -0.6, momentum: -0.05 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "buy", quantity: 99 })]);
    const { approved, refused } = applyGuardsWithVerdicts(
      raw,
      portfolio,
      context,
      DEFAULT_RISK_CONFIG,
    );
    expect(approved).toEqual(raw);
    expect(refused).toEqual([]);
  });

  it("news-fader: sells the hype it holds and it survives guards untouched", () => {
    const persona = personaById("news-fader");
    const context = aContext({ AAPL: { sentiment: 0.6, momentum: 0.05 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "sell", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("retail-investor: chases the hype and it survives guards untouched", () => {
    const persona = personaById("retail-investor");
    const context = aContext({ AAPL: { sentiment: 0.6, momentum: 0.03 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "buy", quantity: 79 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("retail-investor: panic-sells everything held and it survives guards untouched", () => {
    const persona = personaById("retail-investor");
    const context = aContext({ AAPL: { sentiment: -0.6 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "sell", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("futurist: buys confirmed breakout strength and it survives guards untouched", () => {
    const persona = personaById("futurist");
    const context = aContext({ NVDA: { momentum: 0.03 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "buy", quantity: 119 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("futurist: never sells, even a name it holds through a drawdown", () => {
    const persona = personaById("futurist");
    const context = aContext({ NVDA: { momentum: -0.2 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 50 })] });
    expect(persona?.decide(context, portfolio)).toEqual([]);
  });

  it("gold-bug: flees to GLD on risk-off mood and it survives guards untouched", () => {
    const persona = personaById("gold-bug");
    const context = aContext({ AAPL: { sentiment: -0.5 }, GLD: {} });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "GLD", side: "buy", quantity: 149 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("gold-bug: never sells GLD once it holds it", () => {
    const persona = personaById("gold-bug");
    const context = aContext({ AAPL: { sentiment: -0.9 }, GLD: {} });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "GLD", quantity: 100 })] });
    expect(persona?.decide(context, portfolio)).toEqual([]);
  });

  it("day-trader: rides momentum in its focus list and it survives guards untouched", () => {
    const persona = personaById("day-trader");
    const context = aContext({ NVDA: { momentum: 0.02 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "buy", quantity: 1199 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("day-trader: cuts weakness fast and it survives guards untouched", () => {
    const persona = personaById("day-trader");
    const context = aContext({ NVDA: { momentum: -0.02 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("day-trader: ignores a symbol entirely outside its focus list", () => {
    const persona = personaById("day-trader");
    const context = aContext({ SHOP: { momentum: 0.5 } });
    expect(persona?.decide(context, aPortfolio())).toEqual([]);
  });

  it("rumor-trader: accumulates a building whisper and it survives guards untouched", () => {
    const persona = personaById("rumor-trader");
    const context = aContext({ AAPL: { sentiment: 0.4, momentum: 0.01 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "buy", quantity: 999 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("rumor-trader: sells into the landed headline and it survives guards untouched", () => {
    const persona = personaById("rumor-trader");
    const context = aContext({ AAPL: { sentiment: 0.8 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "AAPL", side: "sell", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("sauron: fades exhausted euphoria and it survives guards untouched", () => {
    const persona = personaById("sauron");
    const context = aContext({ AAPL: { sentiment: 0.8, momentum: -0.01 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([
      expect.objectContaining({
        symbol: "AAPL",
        side: "sell",
        quantity: 50,
        strategy: "sauron-euphoria-fade",
      }),
    ]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("sauron: claims exhausted panic with conviction-scaled size, surviving guards untouched", () => {
    const persona = personaById("sauron");
    const context = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([
      expect.objectContaining({
        symbol: "AAPL",
        side: "buy",
        quantity: 1319,
        strategy: "sauron-panic-claim",
      }),
    ]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("banker: underwrites a calm tape and it survives guards untouched", () => {
    const persona = personaById("banker");
    const context = aContext({ SPY: { momentum: 0.001 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "SPY", side: "buy", quantity: 999 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("banker: harvests a mature gain and it survives guards untouched", () => {
    const persona = personaById("banker");
    const context = aContext({ SPY: { last: 95, momentum: 0.001 } });
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "SPY", quantity: 100, avgPrice: 90 })],
    });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "SPY", side: "sell", quantity: 100 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("banker: protects the vault on a drawdown and it survives guards untouched", () => {
    const persona = personaById("banker");
    const context = aContext({ SPY: { last: 80, momentum: 0.001 } });
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "SPY", quantity: 100, avgPrice: 90 })],
    });
    const raw = persona?.decide(context, portfolio) ?? [];
    expect(raw).toEqual([expect.objectContaining({ symbol: "SPY", side: "sell", quantity: 100 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("prospector: stakes an unconditional claim and it survives guards untouched", () => {
    const persona = new ProspectorPersona({ ...WARM_UP_CLAIMS, claims: ["NVDA"] });
    const context = aContext({ NVDA: { last: 100 } });
    const portfolio = aPortfolio();
    const raw = persona.decide(context, portfolio);
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "buy", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("prospector: cuts a barren claim on its fixed stop and it survives guards untouched", () => {
    const persona = new ProspectorPersona({ ...WARM_UP_CLAIMS, claims: ["NVDA"] });
    const context = aContext({ NVDA: { last: 95 } });
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 100 })],
    });
    const raw = persona.decide(context, portfolio);
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 50 })]);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });

  it("prospector: the trailing stop only arms after real runway (stateful across two decide() calls)", () => {
    const persona = new ProspectorPersona({ ...WARM_UP_CLAIMS, claims: ["NVDA"] });
    const portfolio = aPortfolio({
      positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 100 })],
    });
    // Call 1: +10% — clears runway (3%) but is still AT the peak, so the trail (2.5% off peak)
    // hasn't fired yet. This call is what records the peak for call 2 to trail against.
    expect(persona.decide(aContext({ NVDA: { last: 110 } }), portfolio)).toEqual([]);
    // Call 2: pulls back to 105, which is 4.5% off the 110 peak — past the 2.5% trail.
    const raw = persona.decide(aContext({ NVDA: { last: 105 } }), portfolio);
    expect(raw).toEqual([expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 50 })]);
  });

  it("sauron-hardcore: shares Sauron's id and its panic-claim entry survives guards untouched", () => {
    const persona = new SauronHardcorePersona();
    const context = aContext({ AAPL: { sentiment: -0.8, momentum: 0.01 } });
    const portfolio = aPortfolio();
    expect(persona.id).toBe("sauron");
    const raw = persona.decide(context, portfolio);
    expect(raw.length).toBeGreaterThan(0);
    const { approved } = applyGuardsWithVerdicts(raw, portfolio, context, DEFAULT_RISK_CONFIG);
    expect(approved).toEqual(raw);
  });
});

describe("characterization: the risk ladder's block rung, against a real persona's own intent", () => {
  it("refuses a real buy at the restricted tier — the ladder-block reason, not silence", () => {
    const persona = personaById("day-trader");
    const context = aContext({ NVDA: { momentum: 0.02 } });
    const portfolio = aPortfolio();
    const raw = persona?.decide(context, portfolio) ?? [];
    const { approved, refused } = applyGuardsWithVerdicts(raw, portfolio, context, {
      ...DEFAULT_RISK_CONFIG,
      accountTier: "restricted",
    });
    expect(approved).toEqual([]);
    expect(refused).toEqual([{ intent: raw[0], reason: "ladder-block" }]);
  });

  it("never blocks a real sell at the restricted tier — exits always pass", () => {
    const persona = personaById("day-trader");
    const context = aContext({ NVDA: { momentum: -0.02 } });
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 50 })] });
    const raw = persona?.decide(context, portfolio) ?? [];
    const { approved, refused } = applyGuardsWithVerdicts(raw, portfolio, context, {
      ...DEFAULT_RISK_CONFIG,
      accountTier: "restricted",
    });
    expect(approved).toEqual(raw);
    expect(refused).toEqual([]);
  });
});

describe("characterization: the full chain, decide() → guards → force-flatten (Sauron)", () => {
  it("force-flatten closes a persona's real holdings and the resulting sells survive the liquidate tier", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "AAPL", quantity: 50, avgPrice: 90 }),
        aPosition({ symbol: "NVDA", quantity: 30, avgPrice: 400 }),
      ],
    });
    const plan = planForceFlatten(portfolio, "risk ladder reached the liquidate rung");
    expect(plan.intents).toEqual([
      expect.objectContaining({ symbol: "AAPL", side: "sell", quantity: 50, urgent: true }),
      expect.objectContaining({ symbol: "NVDA", side: "sell", quantity: 30, urgent: true }),
    ]);
    expect(plan.unflattened).toEqual([]);

    const context = aContext({ AAPL: {}, NVDA: {} });
    const { approved, refused } = applyGuardsWithVerdicts(plan.intents, portfolio, context, {
      ...DEFAULT_RISK_CONFIG,
      accountTier: "liquidate",
    });
    expect(approved).toEqual(plan.intents);
    expect(refused).toEqual([]);
  });
});
