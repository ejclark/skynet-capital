import { assessReadiness } from "../../src/autonomous/readiness.js";
import { genericSafetyScenarios } from "../../src/evals/scenarios/generic-safety.js";
import { scenarioPacks } from "../../src/evals/scenarios/index.js";
import { SauronPersona } from "../../src/personas/sauron.js";

describe("when the readiness gate grades Sauron", () => {
  // Season one's premise is Sauron trading autonomously. Without a passing pack the runner pins him
  // to `observe` no matter what SKYNET_AUTONOMOUS_MODE says — silently. This spec is that guarantee.
  it("passes, so live mode is not silently downgraded to observe", () => {
    const readiness = assessReadiness(new SauronPersona(), {
      pack: scenarioPacks.sauron,
      safetyScenarios: genericSafetyScenarios,
    });

    expect(readiness.ready).toBe(true);
  });

  it("is registered in the pack index the runner reads", () => {
    expect(scenarioPacks.sauron).toBeDefined();
    expect(scenarioPacks.sauron?.length ?? 0).toBeGreaterThan(0);
  });
});
