#!/usr/bin/env node
// Architecture fitness scan — the executable version of the audit's god-file finding.
//
// A prose audit drifts; this doesn't. It measures every source file and enforces a committed
// per-file line BUDGET so god files can't grow and new ones can't appear — and every time a file
// shrinks, `--update` ratchets its budget DOWN (never up), so decomposition permanently tightens the
// limit. Grandfathers today's god files (frozen, not blocked) so there's no flag-day cleanup.
//
//   node scripts/arch-scan.mjs            # report + enforce (exit 1 on any over-budget file)
//   node scripts/arch-scan.mjs --update   # rewrite arch-budget.json (ratchet: budgets only lower)
//
// Enforced in CI via tests/arch/budget.spec.ts, so it runs on every PR with no extra workflow.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const BUDGET_FILE = join(ROOT, "arch-budget.json");
const DEFAULT_CAP = 500; // a NEW file may not exceed this without an explicit budget entry
const WARN_AT = 300; // files above this are worth watching even if within budget

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) acc.push(p);
  }
  return acc;
}
const lineCount = (f) => readFileSync(f, "utf8").split("\n").length;
const rel = (f) => relative(ROOT, f).split("\\").join("/");
const sortKeys = (o) =>
  Object.fromEntries(
    Object.keys(o)
      .sort()
      .map((k) => [k, o[k]]),
  );

const files = walk(SRC)
  .map((f) => ({ file: rel(f), lines: lineCount(f) }))
  .sort((a, b) => b.lines - a.lines);
const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};

if (process.argv.includes("--update")) {
  const next = {};
  for (const { file, lines } of files) {
    const prev = budget[file];
    next[file] = prev !== undefined ? Math.min(prev, lines) : lines; // ratchet down only
  }
  writeFileSync(BUDGET_FILE, `${JSON.stringify(sortKeys(next), null, 2)}\n`);
  console.log(`arch-budget.json updated — ${Object.keys(next).length} files (budgets only lower).`);
  process.exit(0);
}

const violations = [];
for (const { file, lines } of files) {
  const cap = budget[file] ?? DEFAULT_CAP;
  if (lines > cap) violations.push({ file, lines, cap });
}

console.log("架 Architecture scan — largest source files");
for (const { file, lines } of files.slice(0, 8)) {
  const cap = budget[file] ?? DEFAULT_CAP;
  const mark = lines > cap ? "✗ OVER" : lines > WARN_AT ? "▲ watch" : "· ok";
  console.log(
    `  ${String(lines).padStart(5)}  (budget ${String(cap).padStart(5)})  ${mark}  ${file}`,
  );
}

if (violations.length) {
  console.error(`\n✗ ${violations.length} file(s) exceed their budget:`);
  for (const v of violations) console.error(`  ${v.file}: ${v.lines} > ${v.cap}`);
  console.error(
    "\nFix: decompose the file, or (only if the growth is justified) raise its arch-budget.json entry\n" +
      "in the same PR — a deliberate, reviewable act, never silent drift.",
  );
  process.exit(1);
}
console.log(`\n✓ all ${files.length} source files within budget.`);
