#!/usr/bin/env node
// Dead-code fitness scan — the eye of the dead-code Coach (research pass, missing dimension #1).
//
// Solo-with-agents churn leaves orphans nobody notices: unused files, exports, and types that
// inflate agent context, the untested-file count, and future readers' load. The detector is
// ADOPTED (knip — mark-and-sweep over the real module graph, knip.json holds entry points and
// judged false-positives like hook-invoked scripts); this wrapper is the CRAFTED part: one debt
// number and a committed ratchet-down-only budget, same shape as arch-scan/dupe-scan.
//
// Two scopes, two budgets. knip.json makes app/ (the React shell) its own workspace — the eye
// used to walk only the root project, so a dead component like NetWorthSummary went unflagged.
// Root findings keep `deadCode`; app/ findings get `appDeadCode`, so pointing the eye at the app
// never moves the root budget. An absent app budget is UNKNOWN (exit 2), never infinite.
//
//   node scripts/dead-scan.mjs             # report + enforce (exit 1 if dead code grew)
//   node scripts/dead-scan.mjs --update    # rewrite dead-budget.json (ratchet: only lower)
//   node scripts/dead-scan.mjs --candidate # highest-leverage cleanup target as JSON (+ app's)
//
// Enforced in CI via tests/arch/dead.spec.ts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "dead-budget.json");

// knip exits non-zero when it finds issues; we own the verdict, so tolerate that.
let out = "";
try {
  out = execFileSync("npx", ["knip", "--no-exit-code", "--reporter", "json"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  out = e.stdout ?? "";
}
const report = JSON.parse(out);
const allIssues = report.issues ?? [];

/** One scope's debt: unused files + unused exports + unused exported types. knip 6's JSON
 *  reporter lists an unused file as a per-file `files` entry; older ones had a top-level array. */
function tally(perFile, topFiles) {
  const files = [
    ...topFiles,
    ...perFile.filter((f) => (f.files?.length ?? 0) > 0).map((f) => f.file),
  ];
  const exportsDebt = perFile.reduce((n, f) => n + (f.exports?.length ?? 0), 0);
  const typesDebt = perFile.reduce((n, f) => n + (f.types?.length ?? 0), 0);
  return { files, perFile, exportsDebt, typesDebt, debt: files.length + exportsDebt + typesDebt };
}
const isApp = (file) => file.startsWith("app/");
const topFiles = report.files ?? [];
const scopes = {
  root: tally(
    allIssues.filter((f) => !isApp(f.file)),
    topFiles.filter((f) => !isApp(f)),
  ),
  app: tally(
    allIssues.filter((f) => isApp(f.file)),
    topFiles.filter((f) => isApp(f)),
  ),
};

/** Highest leverage: an entire unused file beats a single export. */
function candidateOf({ files, perFile }) {
  if (files[0]) return { kind: "unused-file", target: files[0] };
  const size = (f) => (f.exports?.length ?? 0) + (f.types?.length ?? 0);
  const worst = [...perFile].sort((a, b) => size(b) - size(a))[0];
  if (!worst || size(worst) === 0) return null;
  return {
    kind: "unused-exports",
    target: worst.file,
    exports: (worst.exports ?? []).map((x) => x.name),
    types: (worst.types ?? []).map((x) => x.name),
  };
}

if (process.argv.includes("--candidate")) {
  // `candidate`/`debt` stay the root scope's — the mortician and /bury read those keys.
  const app = { candidate: candidateOf(scopes.app), debt: scopes.app.debt };
  console.log(
    JSON.stringify({ candidate: candidateOf(scopes.root), debt: scopes.root.debt, app }, null, 2),
  );
  process.exit(0);
}

const KEYS = { root: "deadCode", app: "appDeadCode" };
const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { deadCode: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const next = {};
  for (const [scope, key] of Object.entries(KEYS)) {
    const prev = Number.isFinite(budget[key]) ? budget[key] : scopes[scope].debt;
    next[key] = Math.min(prev, scopes[scope].debt); // ratchet down only
  }
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`dead-budget.json updated — ${JSON.stringify(next)} (only lowers).`);
  process.exit(0);
}

console.log("☠ Dead-code scan (knip) — unused files/exports/types");
let grew = false;
let unknown = false;
for (const [scope, key] of Object.entries(KEYS)) {
  const s = scopes[scope];
  const label = scope === "app" ? "app/" : "root";
  console.log(
    `  ${label}: unused files: ${s.files.length} · unused exports: ${s.exportsDebt} · ` +
      `unused types: ${s.typesDebt} · dead-code debt: ${s.debt}`,
  );
  const cap = budget[key];
  if (scope === "app" && !Number.isFinite(cap)) {
    console.error(
      `\n✗ ${key} missing from dead-budget.json — ${label} verdict UNKNOWN. ` +
        "Seed it: `node scripts/dead-scan.mjs --update`.",
    );
    unknown = true;
  } else if (s.debt > cap) {
    console.error(`\n✗ ${label} dead code grew: ${s.debt} > budget ${cap} (${key}).`);
    grew = true;
  } else {
    console.log(`  ✓ ${label} within budget (${s.debt} ≤ ${cap}).`);
  }
}
if (unknown) process.exit(2);
if (grew) {
  console.error(
    "Fix: delete the unused symbol/file (or wire it up if it's meant to be used). If knip is wrong\n" +
      "(e.g. invoked outside the module graph, like a hook script), add it to knip.json ignore with a\n" +
      "justification. Then `node scripts/dead-scan.mjs --update` to ratchet the budget down.",
  );
  process.exit(1);
}
console.log("\n✓ dead code within budget.");
