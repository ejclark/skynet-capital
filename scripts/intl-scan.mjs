#!/usr/bin/env node
// Intl-in-a-function scan — fails the build when an `Intl.*` formatter is built inside a function
// body (#4612 criterion 6, the formatter half; the whole-read half is scripts/whole-read-scan.mjs).
//
// Why a gate, and why blocking when the debt scans are advisory (tests/support/advisory-scan.ts):
// this is the exact line that OOM-killed production. `GET /api/desk/<id>/pulse` built a new
// `Intl.DateTimeFormat` per stored equity sample, three passes a request: ~27 KB of native ICU
// memory each, outside the JS heap, freed only at a full mark-compact that a tight loop never
// triggers (src/domain/intl-format.ts has the numbers). Heap caps and snapshots saw nothing, and
// offline runs swap the history for an empty store, so no test ever ran it at production size.
// #4612's settled fork chose "a measurement gate plus two mechanical scans, not a review rule";
// this is the second scan, and `npm run stability:budget` measures what this cannot read.
//
// What counts: `Intl.<Constructor>(` — with or without `new` — at a brace depth above zero, so
// inside a function, a method, a class body or an object literal, or in the body of a brace-less
// arrow (`=>` earlier in the same module-level statement). Otherwise it is a module-level
// constant, built once for the life of the process, which is the shape we want. The fix for a
// site is `cachedDateTimeFormat` / `formatDateTime` (src/domain/intl-format.ts) or a module-level
// constant; that file is the one place the constructor may run inside a function.
//
// Scope: `src/` (the server and the code it shares) minus the CLI tools under `src/scripts/`
// (a tool builds one formatter and exits), and `app/src/` (a browser tab). The tab's sites are
// listed in intl-grandfather.json because a formatter per render costs a tab time, not the
// server its life; `src/` has none listed and must stay that way.
//
// Known blind spots, read from source text (TypeScript 7 ships no JS compiler API): a regex
// literal holding a lone brace, or a template literal nested inside a `${}`, can shift the depth
// for the rest of its file. The spec runs the scan over this whole repo, so a shift shows as a
// failure here rather than a silent pass. `toLocale*String(locale, options)` also builds a
// formatter per call; it is a many-site idiom the budget run covers, not this scan.
//
// The ledger is intl-grandfather.json: per file, a count and a one-line reason. It only shrinks —
// a site over its count fails as new; a count higher than the code fails as stale.
//
//   node scripts/intl-scan.mjs          # report + enforce (exit 1 on a new or stale entry)
//   node scripts/intl-scan.mjs --list   # also print every site with its line
//
// Exit codes: 0 every site grandfathered · 1 a new site, or a stale grandfather entry · 2 could not
// do its job (the grandfather file is missing or unreadable, or a scoped tree is absent).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const GRANDFATHER_FILE = "intl-grandfather.json";

/** The constructors that allocate native ICU data. `supportedValuesOf` and the like do not. */
const CONSTRUCTORS =
  "DateTimeFormat|NumberFormat|RelativeTimeFormat|ListFormat|PluralRules|Collator|Segmenter|DisplayNames";
const INTL_CALL = new RegExp(String.raw`\bIntl\.(${CONSTRUCTORS})\s*\(`, "g");

/** The shared home: it builds each shape once, inside a function, on purpose. */
const HOME = "src/domain/intl-format.ts";
const SCOPE = [
  { dir: "src", skip: (rel) => rel === HOME || rel.startsWith("src/scripts/") },
  { dir: "app/src", skip: () => false },
];

const fail = (code, msg) => {
  console.error(msg);
  process.exit(code);
};

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name) && !/\.(spec|d)\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** Blank comments and string contents, keeping every line and column where it was. */
function stripNoise(text) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)))
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\[\s\S])*`/g, blank);
}

/** The `Intl.<Constructor>(` call that starts exactly at `at`, if any. */
function intlCallAt(code, at) {
  INTL_CALL.lastIndex = at;
  const m = INTL_CALL.exec(code);
  return m?.index === at ? m[1] : undefined;
}

/** Every `Intl.*(` construction above module level in one file: `{ read, line }`. */
export function sitesIn(text) {
  const code = stripNoise(text);
  const sites = [];
  let depth = 0;
  let line = 1;
  let statement = 0; // where the current module-level statement began
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === "\n") line++;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) statement = i + 1;
    } else if (ch === ";" && depth === 0) statement = i + 1;
    else if (ch === "I") {
      const ctor = intlCallAt(code, i);
      // Above module level, or the body of a brace-less arrow (`const f = (x) => new Intl…`).
      if (ctor && (depth > 0 || code.slice(statement, i).includes("=>"))) {
        sites.push({ read: `Intl.${ctor}()`, line });
      }
    }
  }
  return sites;
}

function loadGrandfather() {
  if (!existsSync(join(ROOT, GRANDFATHER_FILE))) {
    fail(2, `✗ ${GRANDFATHER_FILE} missing — Intl verdict UNKNOWN (an absent list is not zero)`);
  }
  try {
    return JSON.parse(readFileSync(join(ROOT, GRANDFATHER_FILE), "utf8"));
  } catch (e) {
    fail(2, `✗ ${GRANDFATHER_FILE} unreadable — Intl verdict UNKNOWN: ${e.message}`);
  }
}

/** Every site in scope, as file → read → lines. */
function collect() {
  const found = new Map();
  for (const { dir, skip } of SCOPE) {
    if (!existsSync(join(ROOT, dir))) fail(2, `✗ ${dir}/ absent — Intl verdict UNKNOWN`);
    for (const path of walk(join(ROOT, dir))) {
      const file = relative(ROOT, path).split("\\").join("/");
      if (skip(file)) continue;
      const reads = new Map();
      for (const { read, line } of sitesIn(readFileSync(path, "utf8"))) {
        reads.set(read, [...(reads.get(read) ?? []), line]);
      }
      if (reads.size) found.set(file, reads);
    }
  }
  return found;
}

/** Sites past their listed count, and listed counts the code no longer reaches. */
function compare(found, grandfather) {
  const fresh = [];
  const stale = [];
  for (const [file, reads] of found) {
    for (const [read, lines] of reads) {
      const allowed = grandfather[file]?.[read]?.count ?? 0;
      if (lines.length > allowed) fresh.push({ file, read, lines, allowed });
    }
  }
  for (const [file, reads] of Object.entries(grandfather)) {
    if (file.startsWith("$")) continue; // "$comment"
    for (const [read, { count }] of Object.entries(reads)) {
      const actual = found.get(file)?.get(read)?.length ?? 0;
      if (actual < count) stale.push({ file, read, count, actual });
    }
  }
  return { fresh, stale };
}

function reportFresh(fresh) {
  console.error("\n✗ Intl formatter built inside a function body:");
  for (const { file, read, lines, allowed } of fresh) {
    console.error(`  ${file}:${lines.join(",")}  ${read} (grandfathered: ${allowed})`);
  }
  console.error(
    "\nFix: build the formatter once. Use `cachedDateTimeFormat` / `formatDateTime` from\n" +
      "src/domain/intl-format.ts, or hoist it to a module-level constant. Each one holds ~27 KB of\n" +
      "native memory the JS heap never counts; in a loop that is what OOM-killed production\n" +
      "(#4612). Grandfathering a new site is never the fix.",
  );
}

function reportStale(stale) {
  console.error(
    `\n✗ stale entr(ies) in ${GRANDFATHER_FILE} — the code builds fewer now; lower them:`,
  );
  for (const { file, read, count, actual } of stale) {
    console.error(`  ${file}  ${read}: listed ${count}, found ${actual}`);
  }
}

function main() {
  const grandfather = loadGrandfather();
  const found = collect();
  const all = [...found].flatMap(([file, reads]) =>
    [...reads].map(([read, lines]) => ({ file, read, lines })),
  );
  const total = all.reduce((n, s) => n + s.lines.length, 0);
  console.log(`Intl scan — ${total} formatter(s) built inside a function body`);
  if (process.argv.includes("--list")) {
    for (const { file, read, lines } of all) console.log(`  ${file}:${lines.join(",")}  ${read}`);
  }
  const { fresh, stale } = compare(found, grandfather);
  if (fresh.length) reportFresh(fresh);
  if (stale.length) reportStale(stale);
  if (fresh.length || stale.length) process.exit(1);
  console.log(`✓ every site is grandfathered in ${GRANDFATHER_FILE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
