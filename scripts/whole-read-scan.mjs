#!/usr/bin/env node
// Whole-read scan — fails the build when a request or boot path of the dashboard server gains a
// whole read of a growing ledger (#4612 criterion 6, the whole-read half; #4619 counts the list).
//
// Why a gate, and why blocking when the debt scans are advisory (tests/support/advisory-scan.ts):
// this is the class that crashed production twice. Pulse re-read every equity sample on each
// click and OOM-killed the 512 MB machine (#4612's audit, 2026-10-04), and the cost only showed
// at production-shaped data — offline runs swap every ledger for an empty in-memory store, so no
// test ever saw it. #4612's settled fork chose "a measurement gate plus two mechanical scans, not
// a review rule"; this is one of the two scans. #4619 then bounded the reads one route at a time
// (folds that read only appended lines), and this scan keeps what it bounded bounded.
//
// What counts as a whole read — two shapes, both read from source text (TypeScript 7 ships no JS
// compiler API, so this cannot ask the type checker):
//   1. A call to a named read seam (SEAMS below): the server-config and deps functions that the
//      composition root binds to a whole `list()` of a growing ledger. A route that calls
//      `config.readTradeActivity?.(id)` reads that participant's entire trade ledger.
//   2. `<x>.list(` where `x` holds a growing store: one of the composition root's own store names,
//      an identifier this file types as a growing store interface, or a `const` alias of either.
// A binding in the composition root (`readHistory: (id) => history.list(id)`) is not a site: the
// read is counted where its seam is called. A binding under any other key IS a site, so a new
// seam can't slip in under a name this list doesn't know.
//
// What doesn't count, on purpose:
//   - Human-paced logs (feedback filings, companion messages, ladder milestones, play milestones).
//     They grow at the rate a member types, not the rate a sampler ticks or a bot trades.
//   - `readDecisions`: the decision store pages in SQL (DEFAULT_PAGE/MAX_PAGE in decision-db.ts).
//   - A fold's fallback for a store with no append-aware read (`if (!since)` / `if (since) … else`):
//     that is the in-memory store tests use; the JSONL stores production runs always have `since`.
//
// Known blind spot: a store reached through a name none of the three rules know — a parameter
// typed inline, a destructured field — is not seen. The budget run (`npm run stability:budget`)
// measures what this cannot read.
//
// The ledger is whole-read-grandfather.json: per file, per read, a count and a one-line reason.
// It only shrinks. A site over its count fails as new; a count higher than the code fails as
// stale, so the list never claims reads that are gone and the total is an honest number.
//
//   node scripts/whole-read-scan.mjs          # report + enforce (exit 1 on a new or stale entry)
//   node scripts/whole-read-scan.mjs --list   # also print every site with its line
//
// Exit codes: 0 every site grandfathered · 1 a new site, or a stale grandfather entry · 2 could not
// do its job (the grandfather file is missing or unreadable, or a scoped tree is absent).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const GRANDFATHER_FILE = "whole-read-grandfather.json";

/** The read seams, each bound in `src/scripts/serve-dashboard.ts` to a whole `list()`. */
const SEAMS = new Map([
  ["readHistory", "one participant's every equity sample (HistoryStore.list)"],
  ["readTradeActivity", "one participant's whole trade ledger (ActivityStore.list)"],
  ["readFills", "one participant's whole trade ledger (ActivityStore.list)"],
  ["readOrderAudit", "one participant's whole order audit (OrderAuditLog.list)"],
  ["readTags", "one participant's whole order audit (OrderAuditLog.list)"],
  ["readAllActivityEvents", "every participant's event log (ActivityEventBus.list)"],
  ["readAllTradeActivity", "every participant's trade ledger (ActivityStore.list)"],
  ["readAllOrderAudit", "the order audit of every id it is handed (OrderAuditLog.list)"],
]);
/** The composition root's names for the growing stores, and the config field that carries the bus. */
const STORE_NAMES = ["history", "activity", "orderAudit", "activityEventBus", "activityLog"];
const GROWING_TYPES = "HistoryStore|ActivityStore|ActivityEventBus|OrderAuditLog";

/** The dashboard server's request and boot paths. */
const SCOPE = [
  { dir: "src/server", recurse: true, take: () => true },
  {
    dir: "src/scripts",
    recurse: false,
    take: (name) => name === "serve-dashboard.ts" || name.startsWith("dashboard-"),
  },
  {
    dir: "src/observatory",
    recurse: false,
    take: (name) => name === "history-boot.ts" || name.endsWith("-cache.ts"),
  },
];

const fail = (code, msg) => {
  console.error(msg);
  process.exit(code);
};

function walk(dir, recurse, take, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (recurse) walk(p, recurse, take, acc);
    } else if (/\.ts$/.test(e.name) && !/\.(spec|d)\.ts$/.test(e.name) && take(e.name)) acc.push(p);
  }
  return acc;
}

/** Blank comments out, keeping every line and column where it was. */
function stripComments(text) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

const indentOf = (line) => line.match(/^\s*/)[0].length;
const KEY = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/;

/** The object key a line's value sits under, climbing out through shallower lines; undefined at a
 *  statement's top. */
function enclosingKey(lines, at, column) {
  const own = lines[at].slice(0, column).match(KEY);
  if (own) return own[1];
  let indent = indentOf(lines[at]);
  for (let i = at - 1; i >= 0 && indent > 0; i--) {
    if (lines[i].trim() === "" || indentOf(lines[i]) >= indent) continue;
    indent = indentOf(lines[i]);
    const key = lines[i].match(KEY);
    if (key) return key[1];
  }
  return undefined;
}

/** True when the line sits in a fold's fallback for a store without an append-aware read. */
function inNoSinceFallback(lines, at) {
  for (let i = at; i >= Math.max(0, at - 12); i--) {
    if (/\bif\s*\(\s*!\s*since\b/.test(lines[i])) return true;
    if (/\bif\s*\(\s*since\s*\)/.test(lines[i])) {
      return lines.slice(i, at + 1).some((l) => /\belse\b/.test(l));
    }
  }
  return false;
}

function growingNames(code) {
  const names = new Set(STORE_NAMES);
  const typed = new RegExp(
    String.raw`\b([A-Za-z_$][\w$]*)\??\s*:\s*(?:(?:Pick|Readonly)<\s*)?(?:${GROWING_TYPES})\b`,
    "g",
  );
  for (const m of code.matchAll(typed)) names.add(m[1]);
  // A `const` alias of a known name (`const log = config.activityLog;`), one hop.
  for (const m of code.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([\w$.]+)\s*;/g)) {
    if (names.has(m[2].split(".").at(-1))) names.add(m[1]);
  }
  return names;
}

/** Every whole-read site in one file: `{ read, line }`. */
export function sitesIn(text) {
  const code = stripComments(text);
  const lines = code.split("\n");
  const names = growingNames(code);
  const sites = [];
  const seamCall = new RegExp(String.raw`\.(${[...SEAMS.keys()].join("|")})\s*(?:\?\.)?\s*\(`, "g");
  const listCall = /\b([A-Za-z_$][\w$]*)\s*\.list\s*\(/g;
  lines.forEach((line, i) => {
    for (const m of line.matchAll(seamCall)) sites.push({ read: `${m[1]}()`, line: i + 1 });
    for (const m of line.matchAll(listCall)) {
      if (!names.has(m[1]) || inNoSinceFallback(lines, i)) continue;
      if (SEAMS.has(enclosingKey(lines, i, m.index) ?? "")) continue; // a binding, counted at its call
      sites.push({ read: `${m[1]}.list()`, line: i + 1 });
    }
  });
  return sites;
}

function loadGrandfather() {
  if (!existsSync(join(ROOT, GRANDFATHER_FILE))) {
    fail(
      2,
      `✗ ${GRANDFATHER_FILE} missing — whole-read verdict UNKNOWN (an absent list is not zero)`,
    );
  }
  try {
    return JSON.parse(readFileSync(join(ROOT, GRANDFATHER_FILE), "utf8"));
  } catch (e) {
    fail(2, `✗ ${GRANDFATHER_FILE} unreadable — whole-read verdict UNKNOWN: ${e.message}`);
  }
}

/** Every site in scope, as file → read → lines. */
function collect() {
  const found = new Map();
  for (const { dir, recurse, take } of SCOPE) {
    if (!existsSync(join(ROOT, dir))) fail(2, `✗ ${dir}/ absent — whole-read verdict UNKNOWN`);
    for (const path of walk(join(ROOT, dir), recurse, take)) {
      const file = relative(ROOT, path).split("\\").join("/");
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
  console.error("\n✗ new whole read(s) on a request or boot path:");
  for (const { file, read, lines, allowed } of fresh) {
    const what = SEAMS.get(read.slice(0, -2)) ?? "a growing store's every line";
    console.error(`  ${file}:${lines.join(",")}  ${read} — ${what} (grandfathered: ${allowed})`);
  }
  console.error(
    "\nFix: read only what the response needs — a bounded read (`latest`, a paged query) or a\n" +
      "fold that advances by appended lines (`since`, as `pulse-history-cache.ts` does). A ledger\n" +
      "that grows with time costs every click more each day; the budget run measures it\n" +
      "(`npm run stability:budget`). Grandfathering a new site is never the fix.",
  );
}

function reportStale(stale) {
  console.error(
    `\n✗ stale entr(ies) in ${GRANDFATHER_FILE} — the code reads less now; lower them:`,
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
  console.log(`Whole-read scan — ${total} whole read(s) of a growing ledger on request/boot paths`);
  if (process.argv.includes("--list")) {
    for (const { file, read, lines } of all) console.log(`  ${file}:${lines.join(",")}  ${read}`);
  }
  const { fresh, stale } = compare(found, grandfather);
  if (fresh.length) reportFresh(fresh);
  if (stale.length) reportStale(stale);
  if (fresh.length || stale.length) process.exit(1);
  console.log(`✓ every site is grandfathered in ${GRANDFATHER_FILE} (#4619's bar: ≤ 3)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
