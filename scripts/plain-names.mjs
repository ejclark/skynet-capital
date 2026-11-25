#!/usr/bin/env node
// Plain names — fail when a name Eric already rejected comes back in prose (#8290).
//
//   node scripts/plain-names.mjs body.md            # every hit in a file, exit 1 on any
//   node scripts/plain-names.mjs --above-fold pr.md # only the text before the first <details>
//
// WHY: docs/BRAND.md's plain-name rule was prose, and prose did not hold across sessions. The #8161
// redesign named its apps Desk, Cast, Garage and Film Room, and Eric, 2026-11-24: "'desk' verbiage
// still gives 'wtf is that' vibes.. which I've articulated multiple times over in multiple session
// feedback". A fresh session cannot remember a rejection; it can fail a lint that reads one.
//
// WHAT FAILS: a spelling from docs/plain-names.json's `match`, case-sensitive, whole word, plural
// allowed. WHAT NEVER FAILS: code. A code span or fence, a quoted span (Eric's own words, or the name
// being discussed as a name), a URL or path, and any identifier — `DeskTiles`, `desk.ts`,
// `/api/desk/:id`, `desk-rail` — are skipped, so code keeps its names and only copy is held to them.
//
// Read by scripts/issue-lint.mjs (issue titles and above-the-fold text), scripts/ship.sh checkbody
// (PR bodies), scripts/redesign/lint-rules.mjs (round pages) and tests/ui/plain-names-copy.spec.ts
// (member strings in app/src). Dependency-free.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./is-main.mjs";

const LIST = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "plain-names.json");

/** The rejected names, read once. */
export const PLAIN_NAMES = JSON.parse(readFileSync(LIST, "utf8")).names;

/** Characters that make a neighbouring word part of code, not prose. */
const CODE_EDGE = "A-Za-z0-9_\\-/@#$\\\\";

/** Text with everything that is not prose blanked out, offsets kept. */
export function proseOnly(text) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  return String(text)
    .replace(/```[\s\S]*?(?:```|$)/g, blank) // fenced blocks
    .replace(/`[^`\n]*`/g, blank) // code spans
    .replace(/<!--[\s\S]*?-->/g, blank) // html comments
    .replace(/\bhttps?:\/\/\S+/g, blank) // urls
    .replace(/"[^"\n]*"|“[^”\n]*”|‘[^’\n]*’/g, blank) // quoted spans
    .replace(/(?<=^|[\s(:—-])'[^'\n]+?'(?=$|[\s).,;:!?—])/gm, blank);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One regex per spelling: whole word, optional plural, never glued to code. */
const MATCHERS = PLAIN_NAMES.flatMap((entry) =>
  (entry.match ?? [entry.term]).map((spelling) => ({
    entry,
    re: new RegExp(
      `(?<![${CODE_EDGE}.])${escapeRe(spelling).replace(/ /g, "\\s+")}s?(?![${CODE_EDGE}]|\\.[A-Za-z0-9])`,
      "g",
    ),
  })),
);

/** Every rejected name in a piece of prose: `{ term, plain, date, found, index }`, in order. */
export function plainNameHits(text) {
  const prose = proseOnly(text);
  const hits = [];
  const taken = new Set();
  for (const { entry, re } of MATCHERS) {
    for (const m of prose.matchAll(re)) {
      if (taken.has(m.index)) continue;
      taken.add(m.index);
      hits.push({
        term: entry.term,
        plain: entry.plain,
        date: entry.date,
        found: m[0],
        index: m.index,
      });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

/** The failure line, naming the fix. */
export const plainNameMessage = (hit, where = "") =>
  `${where ? `${where}: ` : ""}“${hit.found}” is a name Eric rejected (${hit.date}) — say “${hit.plain}” (docs/plain-names.json)`;

/** One problem per distinct rejected name in `text`. */
export function plainNameProblems(text, where = "") {
  const seen = new Set();
  const out = [];
  for (const hit of plainNameHits(text)) {
    if (seen.has(hit.term)) continue;
    seen.add(hit.term);
    out.push(plainNameMessage(hit, where));
  }
  return out;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: node scripts/plain-names.mjs [--above-fold] <file>");
    process.exit(2);
  }
  let text = readFileSync(file, "utf8");
  if (args.includes("--above-fold")) {
    const at = text.indexOf("<details");
    if (at !== -1) text = text.slice(0, at);
  }
  const problems = plainNameProblems(text);
  for (const p of problems) console.error(p);
  process.exit(problems.length ? 1 : 0);
}
