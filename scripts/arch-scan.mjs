#!/usr/bin/env node
// Architecture scan — the god-file gate, enforced directly (not delegated to Biome).
//
// 2026-08-26, two revisions in one day:
//
// First: replaced a per-file numbered ratchet-budget (arch-budget.json, one committed ceiling per
// file, hand-raised on legitimate growth) with Biome's own noExcessiveLinesPerFile/
// noExcessiveClassesPerFile rules, meaning to retire this script's enforcement entirely. That
// ledger had grown ~150 lines as god files were decomposed into more, smaller files — one entry
// per file means more files (even smaller ones) means more lines, the wrong direction for a
// mechanism meant to shrink debt.
//
// Then, verifying that swap, found Biome's rule silently does NOT fire on this repo's largest
// files — src/server/auth/authenticator.ts (2779 lines) among them — because its line-counting
// doesn't count physical lines the same way inside a large template literal, and this app's
// cinematic HTML views (the /login page, the dashboard shell, several observatory views) are
// written as exactly that: one big inline-HTML template literal per file. Confirmed empirically
// (bisecting the file, isolating biome.json down to a single rule in a scratch directory) before
// concluding it wasn't a config mistake here. Biome stays enabled for the many files it DOES
// read correctly — genuine, free IDE/CI signal — but it cannot be the sole authority for this
// codebase's dominant file shape, so this script's own reliable `readFileSync(...).split("\n")`
// count is the actual gate again.
//
// What's different from the old ratchet: no numbered budget, no per-file ceiling to hand-raise.
// A file either fits under one flat cap (300 lines, matching Biome's own default) or it's in
// arch-grandfather.json with a one-line reason — a short, flat list of known legacy files still
// needing decompose work, not a table that grows as files are split. Removing a file from that
// list (because it got fixed) is the only way it changes; nothing here silently drifts up.
//
// 2026-09-06 (#1713): this became the codebase's ONLY size cap, and it counts CODE lines.
// Biome's noExcessiveLinesPerFile is now "off" — it was the only *blocking* counter, and it
// counted the wrong thing in both directions: `//` lines and blanks at full price, any multi-line
// token (a block comment, a template literal) collapsed to one. So it forced five splits in a
// month on files that merely explained themselves, missed the 2,779-line authenticator entirely
// (docs/LESSONS.md), and taught sessions to write WHY as a docstring instead of an inline `//`.
// This scan therefore takes over the trees that rule used to lint, on code lines (scripts/
// code-lines.mjs), and stays advisory — reporting debt, never blocking (tests/support/
// advisory-scan.ts, Eric 2026-08-29).
//
//   node scripts/arch-scan.mjs             # report + enforce (exit 1 on any new over-cap file)
//   node scripts/arch-scan.mjs --candidate # emit the next decompose target as JSON
//   node scripts/arch-scan.mjs --update    # rewrite scripts-grouping-budget.json (ratchet: only lower)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { codeLineCount } from "./code-lines.mjs";

const ROOT = process.cwd();
const CAP = 300;
// The trees this cap covers, with the file kinds Biome's rule used to lint in each and the ceilings
// it used (300; 500 for tests, where a spec file's arrange/act/assert repetition is the point). An
// src-only walk would report zero over-cap files on code lines today — a green gate that feeds the
// decomposer nothing — so the cap follows the code Biome stopped watching.
const TREES = [
  { dir: "src", exts: [".ts"], cap: CAP },
  { dir: "app/src", exts: [".ts", ".tsx", ".css"], cap: CAP },
  { dir: "scripts", exts: [".mjs", ".js"], cap: CAP },
  { dir: "tests", exts: [".ts"], cap: 500 },
];
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage"]);
const GENERATED = /(?:\.d\.ts|\.gen\.ts)$/; // routeTree.gen.ts and friends: nobody hand-edits these
const GRANDFATHER_FILE = join(ROOT, "arch-grandfather.json");
const grandfather = existsSync(GRANDFATHER_FILE)
  ? JSON.parse(readFileSync(GRANDFATHER_FILE, "utf8"))
  : {};

function walk(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, exts, acc);
    } else if (exts.some((x) => e.name.endsWith(x)) && !GENERATED.test(e.name)) acc.push(p);
  }
  return acc;
}
const rel = (f) => relative(ROOT, f).split("\\").join("/");

const files = TREES.flatMap(({ dir, exts, cap }) =>
  walk(join(ROOT, dir), exts).map((f) => {
    const source = readFileSync(f, "utf8");
    return { file: rel(f), lines: codeLineCount(source), physical: source.split("\n").length, cap };
  }),
).sort((a, b) => b.lines - b.cap - (a.lines - a.cap)); // ranked by overage, not size: the caps differ

// --candidate: the decomposer agent's next target — the largest file that's over cap AND not
// already grandfathered with a documented reason (those need a deliberate decision, not a bot).
if (process.argv.includes("--candidate")) {
  const eligible = files
    .filter((x) => x.lines > x.cap && !(x.file in grandfather))
    .map((x) => ({ ...x, over: x.lines - x.cap }));
  console.log(
    JSON.stringify({ candidate: eligible[0] ?? null, runnerUp: eligible[1] ?? null }, null, 2),
  );
  process.exit(0);
}

// Junk-drawer smell (docs/COACHES.md): a file named for what it ISN'T — utils/helpers/common/misc —
// has no cohesion story and becomes a dumping ground. Name modules for the job they do.
const JUNK = /(?:^|\/)(?:utils?|helpers?|common|misc|shared|stuff)\.(?:ts|tsx|mjs|js|css)$/i;
const junk = files.filter((x) => JUNK.test(x.file));
if (junk.length) {
  console.error("\n✗ junk-drawer file name(s) — name modules for the job they do:");
  for (const j of junk) console.error(`  ${j.file}`);
  process.exit(1);
}

const violations = files.filter((x) => x.lines > x.cap && !(x.file in grandfather));

console.log(
  `架 Architecture scan — cap ${CAP} code lines (tests ${TREES.at(-1).cap}), ` +
    `${Object.keys(grandfather).length} grandfathered`,
);
for (const { file, lines, physical, cap } of files.slice(0, 8)) {
  const mark =
    !(file in grandfather) && lines > cap ? "✗ OVER" : lines > cap ? "◌ grandfathered" : "· ok";
  console.log(
    `  ${String(lines).padStart(5)} code /${String(physical).padStart(6)}  ${mark}  ${file}`,
  );
}

if (violations.length) {
  console.error(
    `\n✗ ${violations.length} file(s) exceed the code-line cap and aren't grandfathered:`,
  );
  for (const v of violations) console.error(`  ${v.file}: ${v.lines} code lines (cap ${v.cap})`);
  console.error(
    "\nFix: decompose the file, or (only if you mean it) add it to arch-grandfather.json with a\n" +
      "one-line reason — a deliberate, reviewable act, never silent drift.",
  );
  process.exit(1);
}
console.log(`\n✓ all ${files.length} source files within the cap or grandfathered.`);

// ---- ungrouped scripts/ smell: a flat root that should be a subfolder ----------------------------
//
// scripts/ has one established subfolder (scripts/research/) but had, until #931's move, 14 files
// (moneypenny.mjs + 13 moneypenny-*.mjs siblings) dumped flat at its root sharing one prefix — the
// exact shape src/ never allows (30+ domain subfolders, nothing loose). Same smell as a god file:
// nobody decided it, it just accreted one sibling script at a time. Flags root-level scripts/ files
// (not already grouped into a subfolder) that share a filename prefix before the first hyphen with
// 2+ siblings — 3 or more total is the signal a subfolder is overdue.
const PREFIX_MIN_SIBLINGS = 3;
const GROUPING_BUDGET_FILE = join(ROOT, "scripts-grouping-budget.json");

function rootScriptGroups() {
  const scriptsDir = join(ROOT, "scripts");
  const names = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
  const byPrefix = new Map();
  for (const name of names) {
    const hyphen = name.indexOf("-");
    if (hyphen <= 0) continue; // no prefix to share (dupe-scan.mjs alone doesn't smell)
    const prefix = name.slice(0, hyphen);
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), name]);
  }
  return [...byPrefix.entries()]
    .filter(([, siblings]) => siblings.length >= PREFIX_MIN_SIBLINGS)
    .map(([prefix, siblings]) => ({ prefix, siblings: siblings.sort() }));
}

const groups = rootScriptGroups();
const groupingDebt = groups.length;

const groupingBudget = existsSync(GROUPING_BUDGET_FILE)
  ? JSON.parse(readFileSync(GROUPING_BUDGET_FILE, "utf8"))
  : { groups: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const prev = Number.isFinite(groupingBudget.groups) ? groupingBudget.groups : groupingDebt;
  const next = { groups: Math.min(prev, groupingDebt) }; // ratchet down only
  writeFileSync(GROUPING_BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`scripts-grouping-budget.json updated — groups=${next.groups} (only lowers).`);
  process.exit(0);
}

if (groupingDebt) {
  console.log(`\n📂 scripts/ root grouping smell — ${groupingDebt} prefix group(s):`);
  for (const g of groups)
    console.log(`  ${g.prefix}-* (${g.siblings.length}): ${g.siblings.join(", ")}`);
}
const groupingCap = groupingBudget.groups;
if (groupingDebt > groupingCap) {
  console.error(`\n✗ scripts/ root grouping smell grew: ${groupingDebt} > budget ${groupingCap}.`);
  console.error(
    "Fix: move the shared-prefix siblings into scripts/<prefix>/ (dropping the prefix from each\n" +
      "filename, matching src/'s subfolder convention), then\n" +
      "`node scripts/arch-scan.mjs --update`. This is advisory (docs/COACHES.md) — it will not\n" +
      "block CI, but it is the signal a subfolder is overdue.",
  );
  process.exit(1);
}
console.log(`✓ scripts/ root grouping within budget (${groupingDebt} ≤ ${groupingCap}).`);
