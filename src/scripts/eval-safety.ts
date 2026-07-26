import { evaluatePersona } from "../evals/run-eval.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { createDefaultPersonas } from "../personas/registry.js";

/**
 * Run the GENERIC safety battery against every registered persona. Unlike per-persona quality packs,
 * this is the check that scales to author-your-own personas: it only asserts safety, so it applies to
 * any strategy. Exits 0 when all personas are safe, 1 if any is unsafe — a gate CI (and the future
 * bot-creation flow) can run against an arbitrary persona.
 */
const personas = createDefaultPersonas();
let allSafe = true;

console.log(
  `Generic safety battery — ${genericSafetyScenarios.length} scenarios × ${personas.length} personas\n`,
);
for (const persona of personas) {
  const report = evaluatePersona(persona, genericSafetyScenarios);
  const unsafe = report.results.filter((r) => !r.safe);
  if (unsafe.length === 0) {
    console.log(`  [SAFE  ] ${persona.name}`);
  } else {
    allSafe = false;
    console.log(`  [UNSAFE] ${persona.name}`);
    for (const r of unsafe) {
      console.log(`           ! ${r.id}: ${r.violations.join("; ")}`);
    }
  }
}
console.log(`\n  ${allSafe ? "ALL PERSONAS SAFE" : "SAFETY FAILURES ABOVE"}`);
process.exit(allSafe ? 0 : 1);
