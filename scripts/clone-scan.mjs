#!/usr/bin/env node
// Clone (copy-paste) fitness scan — the eye of the "clone" Coach (a new fitness dimension).
//
// dupe-scan catches the same top-level SYMBOL defined in more than one file (same-named helpers). It
// is blind to a pasted BLOCK whose identifiers were renamed — the classic "copy this loop, tweak the
// variable names" drift. jscpd (adopted; token-level copy-paste detector) sees those pasted bodies
// even when nothing shares a name. This wrapper is the CRAFTED part: one debt number (clone count)
// and a committed ratchet-down-only budget, same shape as arch-scan/dupe-scan/dead-scan. It
// COMPLEMENTS dupe-scan — different eye, different smell, same detect-and-correct loop (drill: /dedupe).
//
// Two scopes, two budgets. `.jscpd.json` covers root src/ (`clones`); `.jscpd.app.json` covers the
// React shell's app/src — .ts, .tsx AND .css, where a 2026-10 component-library census measured ~11%
// of CSS rule lines duplicating another file's rule (`appClones`). Separate runs, so pointing the eye
// at the app never moves the root number; cross-scope clones are out of both on purpose.
//
//   node scripts/clone-scan.mjs             # report + enforce (exit 1 if clones grew past budget)
//   node scripts/clone-scan.mjs --update    # rewrite clone-budget.json (ratchet: only lower)
//   node scripts/clone-scan.mjs --candidate # emit the biggest clone pair as JSON (two file:line locs)
//
// Enforced in CI via tests/arch/clone.spec.ts — runs on every PR, no extra workflow.
//
// Exit codes: 0 within budget · 1 clones grew past budget · 2 could not do its job — jscpd wrote
// no report, or clone-budget.json (or one of its two keys) is missing (an absent budget used to
// read as infinite, which passed any count), so the verdict is UNKNOWN.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "clone-budget.json");

/** Run jscpd with `configArgs` and return its parsed JSON report — or exit 2 (UNKNOWN) when it
 *  wrote none. We own the verdict, so jscpd's own exit code is tolerated. */
function runJscpd(label, configArgs) {
  const outDir = mkdtempSync(join(tmpdir(), "jscpd-"));
  let jscpdError = null;
  try {
    execFileSync(
      "npx",
      ["jscpd", "--silent", ...configArgs, "--reporters", "json", "--output", outDir],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (err) {
    // jscpd exits non-zero when its own threshold trips — our budget is the real gate. Kept only to
    // explain a missing report below: a failed run that wrote nothing is UNKNOWN, never zero clones.
    jscpdError = err;
  }
  const REPORT_FILE = join(outDir, "jscpd-report.json");
  if (!existsSync(REPORT_FILE)) {
    const why = `${jscpdError?.stderr ?? ""}`.trim() || jscpdError?.message || "no error output";
    console.error(
      `✗ jscpd wrote no report (${label}) — clone count UNKNOWN.\n  ${why.split("\n").join("\n  ")}`,
    );
    process.exit(2);
  }
  return JSON.parse(readFileSync(REPORT_FILE, "utf8"));
}

// jscpd reports paths relative to the scanned dir; `prefix` makes the app's actionable from root.
const SCOPES = {
  root: { label: "src", key: "clones", configArgs: [], prefix: "" }, // reads .jscpd.json
  app: {
    label: "app/src",
    key: "appClones",
    configArgs: ["--config", ".jscpd.app.json"],
    prefix: "app/src/",
  },
};

function summarize(report, prefix) {
  const total = report.statistics.total;
  // Biggest clone pair first — most lines duplicated = the highest-leverage consolidation target.
  const clones = [...report.duplicates].sort((a, b) => b.lines - a.lines);
  const asPair = (d) =>
    d
      ? {
          lines: d.lines,
          tokens: d.tokens,
          a: `${prefix}${d.firstFile.name}:${d.firstFile.start}-${d.firstFile.end}`,
          b: `${prefix}${d.secondFile.name}:${d.secondFile.start}-${d.secondFile.end}`,
        }
      : null;
  const byFormat = {};
  for (const [format, stats] of Object.entries(report.statistics.formats ?? {})) {
    byFormat[format] = stats.total?.clones ?? stats.clones ?? 0;
  }
  return {
    debt: total.clones, // clone count = pasted block-pairs; the number we ratchet down
    duplicatedLines: total.duplicatedLines,
    percentage: total.percentage,
    clones,
    asPair,
    byFormat,
  };
}

const results = {};
for (const [scope, s] of Object.entries(SCOPES)) {
  results[scope] = summarize(runJscpd(s.label, s.configArgs), s.prefix);
}

if (process.argv.includes("--candidate")) {
  // `candidate`/`runnerUp`/`debt`/`duplicatedLines` stay the root scope's (the existing contract).
  const pick = (r) => ({
    candidate: r.asPair(r.clones[0]),
    runnerUp: r.asPair(r.clones[1]),
    debt: r.debt,
    duplicatedLines: r.duplicatedLines,
  });
  console.log(JSON.stringify({ ...pick(results.root), app: pick(results.app) }, null, 2));
  process.exit(0);
}

// Required for the verdict: an absent budget is UNKNOWN, not infinite (exit 2 below). Only
// --update may run without it, because seeding it is how the budget comes to exist.
const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : null;

if (process.argv.includes("--update")) {
  const next = {};
  for (const [scope, { key }] of Object.entries(SCOPES)) {
    const prev = Number.isFinite(budget?.[key]) ? budget[key] : results[scope].debt;
    next[key] = Math.min(prev, results[scope].debt); // ratchet down only
  }
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`clone-budget.json updated — ${JSON.stringify(next)} (only lowers).`);
  process.exit(0);
}

console.log("⧉ Clone scan — pasted blocks (token-level, renamed identifiers included)");
for (const [scope, { label }] of Object.entries(SCOPES)) {
  const r = results[scope];
  console.log(`\n  ── ${label} ──`);
  for (const p of r.clones.slice(0, 10).map(r.asPair)) {
    console.log(`  ${String(p.lines).padStart(3)} lines  ${p.a}`);
    console.log(`             ↔  ${p.b}`);
  }
  const formats = Object.entries(r.byFormat)
    .map(([f, n]) => `${f} ${n}`)
    .join(" · ");
  console.log(
    `\n  ${label} clone debt (pairs): ${r.debt}   duplicated lines: ${r.duplicatedLines} ` +
      `(${r.percentage.toFixed(2)}%)${scope === "app" && formats ? `   by format: ${formats}` : ""}`,
  );
}

if (!budget) {
  console.error(
    `\n✗ clone-budget.json missing — clone verdict UNKNOWN (no budget to compare ${results.root.debt} against). ` +
      "Seed it: `node scripts/clone-scan.mjs --update`.",
  );
  process.exit(2);
}
let grew = false;
for (const [scope, { label, key }] of Object.entries(SCOPES)) {
  const debt = results[scope].debt;
  const cap = budget[key];
  if (!Number.isFinite(cap)) {
    console.error(
      `\n✗ ${key} missing from clone-budget.json — ${label} clone verdict UNKNOWN. ` +
        "Seed it: `node scripts/clone-scan.mjs --update`.",
    );
    process.exit(2);
  }
  if (debt > cap) {
    console.error(`\n✗ ${label} clones grew: ${debt} > budget ${cap} (${key}).`);
    grew = true;
  } else {
    console.log(`\n✓ ${label} clones within budget (${debt} ≤ ${cap}).`);
  }
}
if (grew) {
  console.error(
    "Fix: extract the pasted block into one shared function/module and call it from both sites —\n" +
      "run /dedupe (judgment: renamed-identifier clones may be coincidental). Then\n" +
      "`node scripts/clone-scan.mjs --update` to ratchet the budget down.",
  );
  process.exit(1);
}
