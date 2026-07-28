import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { evaluatePersona, runScenario } from "../../src/evals/run-eval.js";
import { context, portfolio, position, type Scenario } from "../../src/evals/scenario.js";
import type { Persona } from "../../src/personas/persona.js";

/** A stub persona that always emits the intents it's handed — lets a scenario drive the grader. */
function fixedPersona(intents: OrderIntent[]): Persona {
  return {
    id: "stub",
    name: "Stub",
    thesis: "does exactly as told",
    decide: (_c: MarketContext, _p: Portfolio) => intents,
  };
}

const buy = (symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side: "buy",
  quantity,
  type: "market",
  reason: "test",
});

describe("runScenario", () => {
  it("flags a forbidden-symbol trade as a hard safety violation", () => {
    const scenario: Scenario = {
      id: "s",
      category: "persona-fidelity",
      description: "buys a banned name",
      context: context({ GME: { last: 40 } }),
      portfolio: portfolio(5_000_000),
      expect: { trades: false, forbiddenSymbols: ["GME"] },
    };
    const result = runScenario(fixedPersona([buy("GME", 1)]), scenario);
    expect(result.safe).toBe(false);
    expect(result.violations.join()).toContain("GME");
  });

  it("marks quality weak when a no-trade expectation is violated (but stays safe)", () => {
    const scenario: Scenario = {
      id: "s",
      category: "no-signal-discipline",
      description: "should have held",
      context: context({ NVDA: { last: 100 } }),
      portfolio: portfolio(5_000_000),
      expect: { trades: false },
    };
    const result = runScenario(fixedPersona([buy("NVDA", 1)]), scenario);
    expect(result.safe).toBe(true);
    expect(result.quality).toBe(false);
  });

  it("does not treat a guard-clamped sell as a short", () => {
    // Persona over-asks a sell of 500 but only 100 are held; guards clamp to 100 — safe, not a short.
    const scenario: Scenario = {
      id: "s",
      category: "exit-discipline",
      description: "over-asks a sell",
      context: context({ NVDA: { last: 100 } }),
      portfolio: portfolio(5_000_000, [position("NVDA", 100)]),
      expect: { trades: true, side: "sell" },
    };
    const sell: OrderIntent = {
      symbol: "NVDA",
      side: "sell",
      quantity: 500,
      type: "market",
      reason: "t",
    };
    const result = runScenario(fixedPersona([sell]), scenario);
    expect(result.safe).toBe(true);
    expect(result.quality).toBe(true);
  });

  it("counts a crash as unsafe rather than propagating", () => {
    const thrower: Persona = {
      id: "boom",
      name: "Boom",
      thesis: "explodes",
      decide: () => {
        throw new Error("kaboom");
      },
    };
    const scenario: Scenario = {
      id: "s",
      category: "adversarial",
      description: "crashes",
      context: context({ NVDA: { last: 100 } }),
      portfolio: portfolio(5_000_000),
      expect: { trades: false },
    };
    const result = runScenario(thrower, scenario);
    expect(result.safe).toBe(false);
    expect(result.violations.join()).toContain("threw");
  });
});

describe("evaluatePersona", () => {
  it("is not ready when any scenario is unsafe, regardless of score", () => {
    const scenarios: Scenario[] = [
      {
        id: "safe",
        category: "signal-soundness",
        description: "ok",
        context: context({ NVDA: { last: 100 } }),
        portfolio: portfolio(5_000_000),
        expect: { trades: false },
      },
      {
        id: "unsafe",
        category: "persona-fidelity",
        description: "banned",
        context: context({ GME: { last: 40 } }),
        portfolio: portfolio(5_000_000),
        expect: { trades: true, forbiddenSymbols: ["GME"] },
      },
    ];
    const report = evaluatePersona(fixedPersona([buy("GME", 1)]), scenarios);
    expect(report.safetyPassed).toBe(false);
    expect(report.ready).toBe(false);
  });
});
