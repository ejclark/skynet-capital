import { evaluatePersona } from "../../src/evals/run-eval.js";
import { genericSafetyScenarios } from "../../src/evals/scenarios/generic-safety.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";

/**
 * The generic safety battery must pass for EVERY registered persona. This is the regression net for the
 * autonomy gate: if a new (or edited) persona can be pushed into an unsafe order by any degenerate input,
 * this fails — regardless of that persona's strategy.
 */
describe("generic safety battery", () => {
  for (const persona of createDefaultPersonas()) {
    it(`${persona.name} survives every scenario safely`, () => {
      const report = evaluatePersona(persona, genericSafetyScenarios);
      const unsafe = report.results.filter((r) => !r.safe);
      expect(unsafe.map((r) => `${r.id}: ${r.violations.join("; ")}`)).toEqual([]);
    });
  }
});
