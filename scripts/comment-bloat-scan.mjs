#!/usr/bin/env node
// Comment-bloat scan: counts the comments `docs/ENGINEERING.md` → *WHY earns its place* rules out.
// That rule names narration by its ONLY content: "A comment whose only content is a bare issue/PR
// number, 'used by X', or 'added for the Y flow' is narration." A comment that states an invariant
// and cites where it was decided ("a production boot with no sign-in must fail (#4621)") is WHY
// with a source, and this repo cites its sources on purpose.
//
// Why it reads whole comments, not lines (#7950): until 2026-11-25 this flagged any comment LINE
// holding a ticket citation or the bare words added/removed/used by. A 170-line sample across the
// five worst files found nearly every flag was WHY carrying a citation ("removed when `null`", "used
// by tests") and the count had drifted to 2065 against a budget of 44, so the number said nothing.
// Now a comment (a run of own-line comment lines, or one trailing `// …`) is narration when it
// carries a history signal AND, once every signal and filler word is taken out, at most one word
// is left. "// issue #885", "// see #12", "// added in PR #40", "// used by `foo.ts`" are flagged.
// A history paragraph with real words in it ("#666 asked the panel to show…") is not: whether that
// prose earns its place is review's call (`/code-review`, `reviewer`), not a regex's.
//
//   node scripts/comment-bloat-scan.mjs            # report + enforce (exit 1 if debt grew past budget)
//   node scripts/comment-bloat-scan.mjs --update    # rewrite comment-bloat-budget.json (ratchet: only lower)
//   node scripts/comment-bloat-scan.mjs --candidate # emit the worst-offending file as JSON
//
// Advisory in CI (tests/arch/comment-bloat.spec.ts, per the 2026-08-29 debt-gate policy — see
// tests/support/advisory-scan.ts): visibility, not a blocker, for a friends-and-family group.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { isMain } from "./is-main.mjs";

// A history signal: a ticket citation, a caller reference, or a "this was added/removed" phrase.
// Each is removed before the remaining words are counted, so it can never be the reason to keep.
const SIGNALS = [
  /\([^()]*(#\d|\bPR\b)[^()]*\)/gi, // "(#588)", "(#738 phase 2c)", "(PR 6, issue #2287)"
  /\b(PR|issue)s?\s*#?\d+\w*/gi, // "PR #40", "issue 885"
  /#\d+\w*/g, // "#588"
  /\bused by\s+(`[^`]*`|[\w./-]+)/gi, // "used by `desk-json-view.ts`"
  /\b(added|introduced|removed|fixed|changed)\s+(for|in|by|with|to support)\s+(the\s+)?[\w`./-]+(\s+(flow|feature|fix|screen|page|work|change|task))?/gi,
  /\b(this|it)\s+(was|is|has been)\s+(added|removed|introduced|changed)\b/gi,
  /\bhandles?\s+the\s+case\s+(from|of)\b/gi,
];
const FILLER = new Set(
  "see per from cf in for via and the a an of also slice slices phase step shape part follow-up followup"
    .split(" ")
    .concat(["added", "removed", "fixed", "introduced", "changed", "was", "is"]),
);

/** True when a comment's text is narration under ENGINEERING.md's "only content" rule. */
export function isNarration(text) {
  let rest = text;
  let signalled = false;
  for (const re of SIGNALS) {
    const stripped = rest.replace(re, " ");
    if (stripped !== rest) signalled = true;
    rest = stripped;
  }
  if (!signalled) return false;
  const words = (rest.match(/[A-Za-z][A-Za-z'-]+/g) ?? []).filter(
    (w) => !FILLER.has(w.toLowerCase()),
  );
  return words.length <= 1;
}

const OWN_LINE = /^\s*(\/\/|\*|\/\*\*?)/;
const MARKERS = /^\s*(\/\*\*?|\*\/?|\/\/+)\s?|\s*\*\/\s*$/g;
// A trailing comment needs a space before `//`, so a URL ("https://…") inside a string never counts.
const TRAILING = /\s\/\/\s?(.*)$/;

/** Every narration comment in one file's source, as {line, text} at the comment's first line. */
export function scanSource(source) {
  const lines = source.split("\n");
  const found = [];
  let block = null; // {line, parts}
  const close = () => {
    if (block && isNarration(block.parts.join(" "))) {
      found.push({ line: block.line, text: lines[block.line - 1].trim() });
    }
    block = null;
  };
  lines.forEach((raw, i) => {
    if (OWN_LINE.test(raw)) {
      block ??= { line: i + 1, parts: [] };
      block.parts.push(raw.replace(MARKERS, ""));
      return;
    }
    close();
    const trailing = TRAILING.exec(raw);
    if (trailing && isNarration(trailing[1])) found.push({ line: i + 1, text: raw.trim() });
  });
  close();
  return found;
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts")) acc.push(p);
  }
  return acc;
}

function main() {
  const ROOT = process.cwd();
  const BUDGET_FILE = join(ROOT, "comment-bloat-budget.json");
  const rel = (f) => relative(ROOT, f).split("\\").join("/");

  const findings = []; // {file, line, text}
  for (const f of walk(join(ROOT, "src"))) {
    for (const hit of scanSource(readFileSync(f, "utf8"))) findings.push({ file: rel(f), ...hit });
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
    return;
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
    return;
  }

  console.log(
    "💬 Comment-bloat scan — comments whose only content is history (a bare #N, PR, caller)",
  );
  for (const [file, count] of worst.slice(0, 10)) {
    console.log(`  ${String(count).padStart(2)}×  ${file}`);
  }
  for (const f of findings.slice(0, 50)) console.log(`    ${f.file}:${f.line}  ${f.text}`);
  console.log(`\n  narration comments: ${debt}`);

  const cap = budget.narrationComments;
  if (debt > cap) {
    console.error(`\n✗ narration-comment count grew: ${debt} > budget ${cap}.`);
    console.error(
      "Fix: say the WHY the citation stands for, or delete the comment — the history lives in git\n" +
        "blame / the PR, not the file. Then `node scripts/comment-bloat-scan.mjs --update`.",
    );
    process.exit(1);
  }
  console.log(`\n✓ narration comments within budget (${debt} ≤ ${cap}).`);
}

if (isMain(import.meta.url)) main();
