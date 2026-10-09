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
// Problems name the file and item number only ("rewrite task 3"), so fixing a packet never teaches
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

/**
 * Lint one packet. Returns { problems: [{file, item, kind}], primes } — `kind` is one of
 * `sealed-word` · `interface-label` · `overlap`; never the word itself.
 */
export function lintPacket({ file, raw, kind, keywords, labels = [], keyShingles, allow = [] }) {
  const words = keywords.filter((k) => !allow.includes(k));
  const problems = [];
  let primes = 0;
  itemsOf(file, raw).forEach((text, i) => {
    const item = i + 1;
    if (overlapsKey(text, keyShingles)) problems.push({ file, item, kind: "overlap" });
    const kw = countHits(text, words);
    const lb = kind === "role" ? 0 : countHits(text, labels);
    if (kind === "card") primes += kw + lb;
    else {
      if (kw) problems.push({ file, item, kind: "sealed-word" });
      if (kind === "task" && lb) problems.push({ file, item, kind: "interface-label" });
    }
  });
  return { problems, primes };
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
    for (const p of problems) console.log(`rewrite ${p.file} item ${p.item} (${p.kind})`);
    if (kind === "card") console.log(`${basename(f)}: ${primes} priming hit(s) logged`);
    failed += problems.length;
  }
  console.log(failed ? `lint: ${failed} problem(s) — packets refused` : "lint: clean");
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
