#!/usr/bin/env node
// The leak check for a member study — fails closed, and never says which word tripped it.
//
// A blind role must not be handed the answer key in disguise. Three checks, by packet kind:
//   task / role — any word from the sealed keyword list (minus an explicit allow list, e.g. the
//                 action name `scroll` in the member's prompt) fails; a task also fails on any of
//                 the app's own interface labels (harvested from the pinned build), so tasks stay
//                 in the member's words, never the screen's.
//   card        — a member card is the member's own pre-dated words: keyword and label hits are
//                 COUNTED as priming (reported primed vs. unprimed later), never masked or failed.
//   every kind  — any five-word run shared with the sealed key fails.
// A sealed-word or overlap problem names the file and item number only ("rewrite task 3"), so
// fixing a packet never teaches the fixer the key. An interface-label problem ALSO names the label
// (first real run, 2026-10-09: an author guessed blind four times at which everyday word — "trade",
// "options" — was also a button). A screen label says nothing about the key, and only what the
// member reads (a task's scenario, never its answer, which the oracle needs verbatim) is checked
// for labels. Originally:
// the fixer the key (docs/members/study/README.md → "Rules that keep a study honest").
//
// Usage: node scripts/study/lint.mjs --sealed <dir> --kind task|role|card [--labels <file>]
//          [--allow word,word] <file…>      (a task file is a JSON array; others are markdown)

import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Terms (single words or phrases) from a newline list, lower-cased, blanks and #comments dropped. */
export function termList(text) {
  return text
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#"));
}

/** How many of `terms` occur in `text` as whole words or phrases (case-insensitive). */
export function countHits(text, terms) {
  const t = ` ${norm(text)} `;
  return terms.filter((term) => new RegExp(`(^|\\s)${escapeRe(norm(term))}(\\s|$)`).test(t)).length;
}

/** The set of five-word runs in a text, normalised. */
export function shingles(text, n = 5) {
  const w = norm(text).split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** True when `text` shares any five-word run with the sealed key. */
export function overlapsKey(text, keyShingles) {
  for (const s of shingles(text)) if (keyShingles.has(s)) return true;
  return false;
}

/** Items of a packet: a task file's array entries, or a markdown file's paragraphs. */
export function itemsOf(name, raw) {
  if (name.endsWith(".json"))
    return JSON.parse(raw).map((t) => [t.scenario, t.answer].filter(Boolean).join(" "));
  return raw.split(/\n\s*\n/).filter((p) => p.trim());
}

/** Which of `terms` occur in `text` as whole words or phrases — sorted, de-duplicated. */
export function matchedTerms(text, terms) {
  const t = ` ${norm(text)} `;
  return [
    ...new Set(terms.filter((term) => new RegExp(`(^|\\s)${escapeRe(norm(term))}(\\s|$)`).test(t))),
  ].sort();
}

/** What a member actually reads of each item: a task's scenario only; any other packet, all of it. */
export function shownOf(name, raw) {
  if (name.endsWith(".json")) return JSON.parse(raw).map((t) => String(t.scenario ?? ""));
  return itemsOf(name, raw);
}

/**
 * Lint one packet. Returns { problems: [{file, item, kind, words?}], primes } — `kind` is one of
 * `sealed-word` · `interface-label` · `overlap`. Only an interface-label problem carries `words`
 * (the labels hit); a sealed-word or overlap problem never names anything.
 */
export function lintPacket({ file, raw, kind, keywords, labels = [], keyShingles, allow = [] }) {
  const words = keywords.filter((k) => !allow.includes(k));
  const problems = [];
  let primes = 0;
  const shown = shownOf(file, raw);
  itemsOf(file, raw).forEach((text, i) => {
    const item = i + 1;
    if (overlapsKey(text, keyShingles)) problems.push({ file, item, kind: "overlap" });
    const kw = countHits(text, words);
    if (kind === "card") {
      primes += kw + countHits(text, labels);
      return;
    }
    if (kw) problems.push({ file, item, kind: "sealed-word" });
    const hit = kind === "task" ? matchedTerms(shown[i] ?? "", labels) : [];
    if (hit.length) problems.push({ file, item, kind: "interface-label", words: hit });
  });
  return { problems, primes };
}

/** One problem as the line an author is handed back. */
export function rewriteLine(p) {
  const named = p.kind === "interface-label" && p.words?.length;
  return `rewrite ${p.file} item ${p.item} (${p.kind}${named ? `: ${p.words.map((w) => `"${w}"`).join(", ")}` : ""})`;
}

function main(argv) {
  const flag = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const sealed = flag("--sealed");
  const kind = flag("--kind");
  if (!(sealed && ["task", "role", "card"].includes(kind ?? "")))
    throw new Error("--sealed <dir> and --kind task|role|card are required");
  const keywords = termList(readFileSync(join(sealed, "keywords.txt"), "utf8"));
  const keyShingles = shingles(readFileSync(join(sealed, "gold.md"), "utf8"));
  const labels = flag("--labels") ? termList(readFileSync(flag("--labels"), "utf8")) : [];
  const allow = (flag("--allow") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const files = argv.filter((a, i) => !(a.startsWith("--") || argv[i - 1]?.startsWith("--")));
  let failed = 0;
  for (const f of files) {
    const { problems, primes } = lintPacket({
      file: basename(f),
      raw: readFileSync(f, "utf8"),
      kind,
      keywords,
      labels,
      keyShingles,
      allow,
    });
    for (const p of problems) console.log(rewriteLine(p));
    if (kind === "card") console.log(`${basename(f)}: ${primes} priming hit(s) logged`);
    failed += problems.length;
  }
  console.log(failed ? `lint: ${failed} problem(s) — packets refused` : "lint: clean");
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
