#!/usr/bin/env node
// The journey-coverage ratchet — the gap count of `coverage.mjs` may not rise above
// `journey-coverage-budget.json`. A gap is a living, decided screen (keep · fold) that no member
// journey step visits at phone width (scripts/crawl/README.md → Coverage). Advisory, like every
// debt-class eye (docs/COACHES.md: taste and debt are a ratchet, never a red mid-flow); the
// blocking half — every screen the code has is judged in triage.json — lives in
// tests/arch/journey-coverage.spec.ts, because other lanes read triage.json as a contract.
//
//   node scripts/crawl/coverage-budget.mjs            # report + enforce (exit 1 if gaps grew)
//   node scripts/crawl/coverage-budget.mjs --update   # rewrite the budget (ratchet: only lowers)
//
// Exit codes: 0 within budget · 1 the gap count grew · 2 no budget file, so the verdict is UNKNOWN
// (an absent budget reading as infinite would pass any count — arch-scan's rule).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BUDGET_FILE = "journey-coverage-budget.json";

/** The joined rows. `coverage.mjs` exits 1 on unjudged/stale rows but still prints the JSON. */
function measure() {
  try {
    return JSON.parse(
      execFileSync("node", ["scripts/crawl/coverage.mjs", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (err) {
    if (typeof err.stdout === "string" && err.stdout.trim().startsWith("{")) {
      return JSON.parse(err.stdout);
    }
    throw err;
  }
}

const result = measure();
const gaps = result.gaps.length;
const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : null;

if (process.argv.includes("--update")) {
  const next = { gaps: Math.min(budget?.gaps ?? gaps, gaps) };
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`${BUDGET_FILE} updated — gaps=${next.gaps} (only lowers).`);
  process.exit(0);
}

console.log(`🧭 Journey coverage — ${result.headline}`);
for (const r of result.gaps)
  console.log(`  gap: ${r.screen} — must be seen by ${r.mustBeSeenBy ?? "—"}`);

if (budget === null) {
  console.error(`\n✗ ${BUDGET_FILE} missing — gap verdict UNKNOWN (seed it with --update).`);
  process.exit(2);
}
if (gaps > budget.gaps) {
  console.error(`\n✗ journey-coverage gaps grew: ${gaps} > budget ${budget.gaps}.`);
  console.error(
    "  Add a phone journey step that visits the screen, or re-judge it in triage.json.",
  );
  process.exit(1);
}
if (gaps < budget.gaps) {
  console.log(`\n✓ gaps fell to ${gaps} (budget ${budget.gaps}) — lock it in with --update.`);
} else {
  console.log(`\n✓ gaps ${gaps} within budget ${budget.gaps}.`);
}
