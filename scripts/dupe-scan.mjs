#!/usr/bin/env node
// Duplication fitness scan — the eye of the "de-dupe" Coach (audit finding C2).
//
// Custom code that re-pastes the same helper/token block in file after file is how a codebase drifts:
// `escapeHtml` defined 3×, the design-token block copied across pages. This measures that debt as a
// single number — how many top-level symbols are DEFINED in more than one file — and enforces a
// committed BUDGET so new duplication can't land, while `--update` ratchets the budget DOWN as copies
// are consolidated into src/ui. Grandfathers today's duplication (frozen, not blocked) like arch-scan.
//
// Two scopes, two budgets. The eye walked only root src/*.ts for its first life, so the React
// shell (app/src, .ts + .tsx) was invisible — a 2026-10 component-library census found 64 number
// formatters in 49 app files, `pct` alone defined 12× with four different behaviours. Root keeps
// `duplicateDefs`; app/src gets `appDuplicateDefs`, counted within the app only, so pointing the eye
// at the app never moves the root number. An absent app budget is UNKNOWN (exit 2), never infinite.
//
//   node scripts/dupe-scan.mjs            # report + enforce (exit 1 if duplication grew past budget)
//   node scripts/dupe-scan.mjs --update   # rewrite dupe-budget.json (ratchet: only lower)
//   node scripts/dupe-scan.mjs --candidate# emit the highest-leverage consolidation target as JSON
//
// Enforced in CI via tests/arch/dupe.spec.ts — runs on every PR, no extra workflow.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "dupe-budget.json");

function walk(dir, ext, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (ext.test(e.name) && !e.name.endsWith(".d.ts") && !e.name.endsWith(".gen.ts"))
      acc.push(p);
  }
  return acc;
}
const rel = (f) => relative(ROOT, f).split("\\").join("/");

// Map each top-level definition name → the set of files that define it. A name defined in ≥2 files is
// duplication debt. We match top-level `function`/`const`/`class` declarations (exported or not).
// A same name in two files isn't *proof* of a pasted implementation — the drill judges that — but it's
// the cheap, high-recall signal. IGNORE holds conventional per-file names that are legitimately separate.
const SCOPES = {
  root: {
    dir: join(ROOT, "src"),
    ext: /\.ts$/,
    key: "duplicateDefs",
    ignore: new Set(["main"]), // each script's own entrypoint, not shared code
  },
  app: {
    dir: join(ROOT, "app/src"),
    ext: /\.tsx?$/,
    key: "appDuplicateDefs",
    // `Route` is TanStack Router's per-file route export (src/routes/*), required by name.
    ignore: new Set(["Route"]),
  },
};
const defRe = /^(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm;

/** Duplicated symbols within one scope, most-copied first. Debt = Σ (copies − 1). */
function scan({ dir, ext, ignore }) {
  const defs = new Map(); // name → Set(file)
  for (const f of walk(dir, ext)) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(defRe)) {
      const name = m[1];
      if (ignore.has(name)) continue;
      if (!defs.has(name)) defs.set(name, new Set());
      defs.get(name).add(rel(f));
    }
  }
  const dupes = [...defs.entries()]
    .filter(([, files]) => files.size > 1)
    .map(([name, files]) => ({ name, files: [...files].sort(), copies: files.size }))
    .sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));
  return { dupes, debt: dupes.reduce((n, d) => n + (d.copies - 1), 0) };
}
const results = { root: scan(SCOPES.root), app: scan(SCOPES.app) };
const { dupes, debt } = results.root;

if (process.argv.includes("--candidate")) {
  // Highest leverage = the symbol pasted across the most files; consolidating it removes the most
  // copies. `candidate`/`runnerUp`/`debt` stay the root scope's — /dedupe and ui-librarian read them.
  const a = results.app;
  const app = { candidate: a.dupes[0] ?? null, runnerUp: a.dupes[1] ?? null, debt: a.debt };
  console.log(
    JSON.stringify({ candidate: dupes[0] ?? null, runnerUp: dupes[1] ?? null, debt, app }, null, 2),
  );
  process.exit(0);
}

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { duplicateDefs: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const next = {};
  for (const [scope, { key }] of Object.entries(SCOPES)) {
    const prev = Number.isFinite(budget[key]) ? budget[key] : results[scope].debt;
    next[key] = Math.min(prev, results[scope].debt); // ratchet down only
  }
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`dupe-budget.json updated — ${JSON.stringify(next)} (only lowers).`);
  process.exit(0);
}

console.log("♊ Duplication scan — symbols defined in more than one file");
let grew = false;
let unknown = false;
for (const [scope, { key }] of Object.entries(SCOPES)) {
  const r = results[scope];
  const label = scope === "app" ? "app/src" : "src";
  console.log(`\n  ── ${label} ──`);
  for (const d of r.dupes.slice(0, 10)) {
    console.log(`  ${String(d.copies).padStart(2)}×  ${d.name}`);
    for (const f of d.files) console.log(`        ${f}`);
  }
  console.log(`\n  ${label} duplication debt (Σ copies−1): ${r.debt}`);
  const cap = budget[key];
  if (scope === "app" && !Number.isFinite(cap)) {
    console.error(
      `\n✗ ${key} missing from dupe-budget.json — ${label} verdict UNKNOWN. ` +
        "Seed it: `node scripts/dupe-scan.mjs --update`.",
    );
    unknown = true;
  } else if (r.debt > cap) {
    console.error(`\n✗ ${label} duplication grew: ${r.debt} > budget ${cap} (${key}).`);
    grew = true;
  } else {
    console.log(`  ✓ ${label} within budget (${r.debt} ≤ ${cap}).`);
  }
}
if (unknown) process.exit(2);
if (grew) {
  console.error(
    "Fix: promote the shared symbol into src/ui (or its natural home) and import it everywhere —\n" +
      "run /dedupe. Then `node scripts/dupe-scan.mjs --update` to ratchet the budget down.",
  );
  process.exit(1);
}
console.log("\n✓ duplication within budget.");
