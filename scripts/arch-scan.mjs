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
//   node scripts/arch-scan.mjs             # report + enforce (exit 1 on any new over-cap file)
//   node scripts/arch-scan.mjs --candidate # emit the next decompose target as JSON
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const CAP = 300;
const GRANDFATHER_FILE = join(ROOT, "arch-grandfather.json");
const grandfather = existsSync(GRANDFATHER_FILE)
  ? JSON.parse(readFileSync(GRANDFATHER_FILE, "utf8"))
  : {};

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

const files = walk(SRC)
  .map((f) => ({ file: rel(f), lines: lineCount(f) }))
  .sort((a, b) => b.lines - a.lines);

// --candidate: the decomposer agent's next target — the largest file that's over cap AND not
// already grandfathered with a documented reason (those need a deliberate decision, not a bot).
if (process.argv.includes("--candidate")) {
  const eligible = files
    .filter((x) => x.lines > CAP && !(x.file in grandfather))
    .map((x) => ({ ...x, cap: CAP, over: x.lines - CAP }));
  console.log(
    JSON.stringify({ candidate: eligible[0] ?? null, runnerUp: eligible[1] ?? null }, null, 2),
  );
  process.exit(0);
}

// Junk-drawer smell (docs/COACHES.md): a file named for what it ISN'T — utils/helpers/common/misc —
// has no cohesion story and becomes a dumping ground. Name modules for the job they do.
const JUNK = /(?:^|\/)(?:utils?|helpers?|common|misc|shared|stuff)\.ts$/i;
const junk = files.filter((x) => JUNK.test(x.file));
if (junk.length) {
  console.error("\n✗ junk-drawer file name(s) — name modules for the job they do:");
  for (const j of junk) console.error(`  ${j.file}`);
  process.exit(1);
}

const violations = files.filter((x) => x.lines > CAP && !(x.file in grandfather));

console.log(
  `架 Architecture scan — cap ${CAP} lines, ${Object.keys(grandfather).length} grandfathered`,
);
for (const { file, lines } of files.slice(0, 8)) {
  const mark =
    !(file in grandfather) && lines > CAP ? "✗ OVER" : lines > CAP ? "◌ grandfathered" : "· ok";
  console.log(`  ${String(lines).padStart(5)}  ${mark}  ${file}`);
}

if (violations.length) {
  console.error(
    `\n✗ ${violations.length} file(s) exceed the ${CAP}-line cap and aren't grandfathered:`,
  );
  for (const v of violations) console.error(`  ${v.file}: ${v.lines} lines`);
  console.error(
    "\nFix: decompose the file, or (only if you mean it) add it to arch-grandfather.json with a\n" +
      "one-line reason — a deliberate, reviewable act, never silent drift.",
  );
  process.exit(1);
}
console.log(`\n✓ all ${files.length} source files within the cap or grandfathered.`);
