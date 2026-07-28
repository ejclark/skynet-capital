#!/usr/bin/env node
// Dependency-graph fitness scan — the eye of the dep-graph Coach.
//
// Solo-with-agents churn quietly grows the import graph sideways: cycles form after a decompose,
// orphans linger, and the hexagonal grain (domain → ports → adapters, never the reverse) erodes one
// convenient import at a time. The detector is ADOPTED (dependency-cruiser walks the real module
// graph; .dependency-cruiser.cjs holds the rules); this wrapper is the CRAFTED part: one debt number
// (total rule violations) and a committed ratchet-down-only budget, same shape as dead-scan.
//
//   node scripts/dep-graph-scan.mjs             # report + enforce (exit 1 if violations grew)
//   node scripts/dep-graph-scan.mjs --update    # rewrite dep-graph-budget.json (ratchet: only lower)
//   node scripts/dep-graph-scan.mjs --candidate # worst offending cycle/module as JSON
//
// Enforced in CI via tests/arch/dep-graph.spec.ts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "dep-graph-budget.json");
const DEPCRUISE = join(ROOT, "node_modules", ".bin", "depcruise");

// depcruise exits non-zero when it finds error-severity violations; we own the verdict, so tolerate it.
let out = "";
try {
  out = execFileSync(
    DEPCRUISE,
    ["src/**/*.ts", "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (e) {
  out = e.stdout ?? "";
}
const report = JSON.parse(out);
const violations = report.summary?.violations ?? [];

// One debt number: every rule violation counts (cycles, orphans, layering breaches).
const debt = violations.length;

// Break the debt down by rule for the human-readable report.
const byRule = {};
for (const v of violations) byRule[v.rule.name] = (byRule[v.rule.name] ?? 0) + 1;
const circular = byRule["no-circular"] ?? 0;

if (process.argv.includes("--candidate")) {
  // Highest leverage: a cycle beats a layering breach beats an orphan.
  const rank = (name) => (name === "no-circular" ? 0 : name.startsWith("no-orphans") ? 2 : 1);
  const worst = [...violations].sort((a, b) => rank(a.rule.name) - rank(b.rule.name))[0];
  const candidate = worst
    ? {
        kind: worst.rule.name,
        severity: worst.rule.severity,
        from: worst.from,
        to: worst.to,
        cycle: worst.cycle ?? null,
      }
    : null;
  console.log(JSON.stringify({ candidate, debt, byRule }, null, 2));
  process.exit(0);
}

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { depGraph: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const prev = Number.isFinite(budget.depGraph) ? budget.depGraph : debt;
  const next = { depGraph: Math.min(prev, debt) }; // ratchet down only
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`dep-graph-budget.json updated — depGraph=${next.depGraph} (only lowers).`);
  process.exit(0);
}

console.log("⬡ Dependency-graph scan (dependency-cruiser) — cycles/orphans/layering");
console.log(
  `  circular: ${circular} · other violations: ${debt - circular} · by rule: ${JSON.stringify(byRule)}`,
);
console.log(`  dep-graph debt: ${debt}`);

const cap = budget.depGraph;
if (debt > cap) {
  console.error(`\n✗ dependency-graph debt grew: ${debt} > budget ${cap}.`);
  console.error(
    "Fix: break the cycle / wire-or-delete the orphan / restore the layer direction (run\n" +
      "`node scripts/dep-graph-scan.mjs --candidate` for the highest-leverage target). If a rule is\n" +
      "genuinely wrong, adjust .dependency-cruiser.cjs with a justification. Then\n" +
      "`node scripts/dep-graph-scan.mjs --update` to ratchet the budget down.",
  );
  process.exit(1);
}
console.log(`\n✓ dependency graph within budget (${debt} ≤ ${cap}).`);
