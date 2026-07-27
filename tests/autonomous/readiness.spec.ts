import { assessReadiness } from "../../src/autonomous/readiness.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { genericSafetyScenarios } from "../../src/evals/scenarios/generic-safety.js";
import { scenarioPacks } from "../../src/evals/scenarios/index.js";
import { DayTraderPersona } from "../../src/personas/day-trader.js";
import type { Persona } from "../../src/personas/persona.js";

/** A persona that throws on assessment — an unhandled crash is itself a safety failure. */
class Crashy implements Persona {
  readonly id = "crashy";
  readonly name = "Crashy";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    throw new Error("boom");
  }
}

/** A no-op persona with no scenario pack — safe, but not certifiable. */
class Idle implements Persona {
  readonly id = "idle";
  readonly name = "Idle";
  readonly thesis = "test";
  decide(): OrderIntent[] {
    return [];
  }
}

describe("assessReadiness — the autonomy gate", () => {
  it("certifies a persona that is safe and passes its quality pack", () => {
    const r = assessReadiness(new DayTraderPersona(), {
      pack: scenarioPacks["day-trader"],
      safetyScenarios: genericSafetyScenarios,
    });
    expect(r.ready).toBe(true);
    expect(r.report?.ready).toBe(true);
  });

  it("refuses a persona that violates the safety battery", () => {
    const r = assessReadiness(new Crashy(), {
      pack: scenarioPacks["day-trader"],
      safetyScenarios: genericSafetyScenarios,
    });
    expect(r.ready).toBe(false);
    expect(r.reason).toContain("safety battery");
  });

  it("refuses a safe persona that has no readiness pack (not yet certified)", () => {
    const r = assessReadiness(new Idle(), {
      safetyScenarios: genericSafetyScenarios,
    });
    expect(r.ready).toBe(false);
    expect(r.reason).toContain("no readiness pack");
  });

  it("refuses when the quality score is below an impossibly high threshold", () => {
    const r = assessReadiness(new DayTraderPersona(), {
      pack: scenarioPacks["day-trader"],
      safetyScenarios: genericSafetyScenarios,
      threshold: 101,
    });
    expect(r.ready).toBe(false);
    expect(r.reason).toContain("below threshold");
  });
});
