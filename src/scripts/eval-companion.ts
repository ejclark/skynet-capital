import { COMPANION_FIXTURES } from "../evals/companion/fixtures.js";
import { formatCompanionReport, runCompanionEval } from "../evals/companion/run-eval.js";
import { COMPANION_TOOL_FIXTURES } from "../evals/companion/tool-fixtures.js";

/**
 * Run Moneypenny's replay eval and print the report.
 *   npm run eval:companion
 *
 * Skips cleanly with no `ANTHROPIC_API_KEY` — exit 0, per #1672's own acceptance criterion (a
 * dev machine or a CI lane without the key never fails on this). CI wiring (slice 5) runs it
 * inside the Fly app on the app's own key (`FLY_API_TOKEN`, no new secret) and can gate on the
 * exit code once a baseline earns that; this slice only reports.
 */
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.log("companion eval: skipped — ANTHROPIC_API_KEY not set");
  process.exit(0);
}

// The tool-use fixtures (#7286 slice 5) run beside the main suite, scored on their calls too.
const fixtures = [...COMPANION_FIXTURES, ...COMPANION_TOOL_FIXTURES];
const report = await runCompanionEval(fixtures, apiKey, undefined, undefined, (line) =>
  console.log(line),
);
console.log(formatCompanionReport(report));
process.exit(report.passed === report.total ? 0 : 1);
