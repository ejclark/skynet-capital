import { evaluatePersona, formatReport } from "../evals/run-eval.js";
import { scenarioPacks } from "../evals/scenarios/index.js";
import { createDefaultPersonas } from "../personas/registry.js";

/**
 * Run a persona's readiness eval and print the report.
 *   npm run eval:persona            # defaults to day-trader
 *   npm run eval:persona day-trader
 * Exit code 0 when READY, 1 when not, 2 on a usage error — so CI / a future
 * issue-driven setup flow can gate on it.
 */
const id = process.argv[2] ?? "day-trader";
const persona = createDefaultPersonas().find((p) => p.id === id);

if (!persona) {
  const known = createDefaultPersonas()
    .map((p) => p.id)
    .join(", ");
  console.error(`unknown persona '${id}'. known: ${known}`);
  process.exit(2);
}

const scenarios = scenarioPacks[id];
if (!scenarios || scenarios.length === 0) {
  const packs = Object.keys(scenarioPacks).join(", ") || "(none yet)";
  console.error(`no scenario pack for '${id}' yet. packs: ${packs}`);
  process.exit(2);
}

const report = evaluatePersona(persona, scenarios);
console.log(formatReport(report));
process.exit(report.ready ? 0 : 1);
