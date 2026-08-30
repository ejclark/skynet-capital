#!/usr/bin/env node
// Comment-bloat scan — the eye for a dimension CLAUDE.md already legislates but nothing measured:
// "Default to writing no comments... never reference the current task, fix, or callers... since
// those belong in the PR description and rot as the codebase evolves." (CLAUDE.md, "Doing tasks")
//
// This flags comments whose only content is historical narration — a bare issue/PR number, "used by
// X", "added for the Y flow", "this was removed/handles the case from #N" — the kind git blame /
// GitHub already answer better and that rots the moment the number stops being resolvable in context.
// It does NOT try to fully separate WHY (keep) from WHAT/narration (cut): that's a judgment call the
// house style reserves for code-review. Like config-audit.mjs, this PROPOSES candidates for a human
// (or /code-review) to sort — a comment citing an issue number for a non-obvious invariant (e.g.
// "lifecycle statuses (#468 criterion 6) that must never enter the matcher") is exactly the kind of
// false positive a human catches in one glance; the scanner's job is recall, not final judgment.
//
//   node scripts/comment-bloat-scan.mjs            # report + enforce (exit 1 if debt grew past budget)
//   node scripts/comment-bloat-scan.mjs --update    # rewrite comment-bloat-budget.json (ratchet: only lower)
//   node scripts/comment-bloat-scan.mjs --candidate # emit the worst-offending file as JSON
//
// Advisory in CI (tests/arch/comment-bloat.spec.ts, per the 2026-08-29 debt-gate policy — see
// tests/support/advisory-scan.ts): visibility, not a blocker, for a friends-and-family group.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const BUDGET_FILE = join(ROOT, "comment-bloat-budget.json");

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts")) acc.push(p);
  }
  return acc;
}
const rel = (f) => relative(ROOT, f).split("\\").join("/");

// Narration signals: a comment whose apparent justification is "this happened" rather than "this is
// true and non-obvious." Issue/PR numbers are the strongest tell — they're only meaningful as history.
const NARRATION_PATTERNS = [
  /\(#\d{2,}[^)]*\)/, // "(#588)", "(#738 phase 2c)" — a bare ticket citation
  /\bPR #\d+/i,
  /\bissue #?\d{2,}\b/i,
  /\b(added|removed|used by|handles? the case (from|of)|this (was|is) (added|removed))\b/i,
];

const findings = []; // {file, line, text}
for (const f of walk(SRC)) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((text, i) => {
    if (!/^\s*(\/\/|\*|\/\*\*?)/.test(text)) return; // comment lines only
    if (NARRATION_PATTERNS.some((re) => re.test(text))) {
      findings.push({ file: rel(f), line: i + 1, text: text.trim() });
    }
  });
}

const byFile = new Map();
for (const finding of findings) {
  byFile.set(finding.file, (byFile.get(finding.file) ?? 0) + 1);
}
const worst = [...byFile.entries()].sort((a, b) => b[1] - a[1]);
const debt = findings.length;

if (process.argv.includes("--candidate")) {
  console.log(
    JSON.stringify(
      { candidate: worst[0] ? { file: worst[0][0], count: worst[0][1] } : null, debt },
      null,
      2,
    ),
  );
  process.exit(0);
}

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { narrationComments: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const prev = Number.isFinite(budget.narrationComments) ? budget.narrationComments : debt;
  const next = { narrationComments: Math.min(prev, debt) }; // ratchet down only
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `comment-bloat-budget.json updated — narrationComments=${next.narrationComments} (only lowers).`,
  );
  process.exit(0);
}

console.log(
  "💬 Comment-bloat scan — comments narrating history instead of stating a non-obvious WHY",
);
for (const [file, count] of worst.slice(0, 10)) {
  console.log(`  ${String(count).padStart(2)}×  ${file}`);
}
console.log(
  `\n  candidates flagged: ${debt} (review each — some are legitimate WHY, per the header note)`,
);

const cap = budget.narrationComments;
if (debt > cap) {
  console.error(`\n✗ narration-comment count grew: ${debt} > budget ${cap}.`);
  console.error(
    "Fix: for each flagged line, keep it only if it states a non-obvious invariant; otherwise delete\n" +
      "— the history lives in git blame / the PR, not the file. Then `node scripts/comment-bloat-scan.mjs --update`.",
  );
  process.exit(1);
}
console.log(`\n✓ narration comments within budget (${debt} ≤ ${cap}).`);
