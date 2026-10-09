#!/usr/bin/env node
// Member cards for a member study — built by script, never by hand, so a blind role only ever sees
// what this file lets through (docs/members/study/README.md → "Rules that keep a study honest").
//
// A card is §1 Who, §3 What they are trying to do, §4 How they decide of `docs/members/<member>.md`.
// §2 (the fixture they own) is replaced per session by the world; §5–7 (known problems, journeys,
// feature seeds) never enter — they name the very things a study is trying to rediscover.
// Stripped mechanically: `_hypothesis_` bullets (guesses about the member, not the member), repo
// references (code spans, paths, issue numbers, CLAUDE.md pointers), link targets, and any sentence
// whose date is on or after the study's cutoff (a quote from after the answer key was written).
//
// Usage: node scripts/study/packets.mjs cards --cutoff 2026-10-08 --out <dir> [member …]

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const KEEP = new Set(["1", "3", "4"]);
const REPO_REF =
  /(CLAUDE\.md|README|→|\b(?:docs|src|app|scripts|e2e|tests|fixtures)\/|\.(?:md|tsx?|mjs|json)\b|#\d{2,})/;

/** Split a member file into its numbered sections: { "1": body, "2": body, … }. */
export function sections(markdown) {
  const out = {};
  let key = null;
  for (const line of markdown.split("\n")) {
    const head = /^## (\d+)\./.exec(line);
    if (head) {
      key = head[1];
      out[key] = [];
    } else if (key) out[key].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join("\n").trim()]));
}

/** Drop `- _hypothesis …_` bullets, which may run over several lines until the next bullet or blank. */
export function dropHypotheses(text) {
  const kept = [];
  let skipping = false;
  for (const line of text.split("\n")) {
    if (/^\s*- _hypothesis/.test(line)) skipping = true;
    else if (skipping && (/^\s*- /.test(line) || line.trim() === "")) skipping = false;
    if (!skipping) kept.push(line);
  }
  return kept.join("\n");
}

/** Remove repo references: parentheticals that cite the repo, code spans, link targets, issue refs. */
export function stripRefs(text) {
  let t = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  let prev;
  do {
    prev = t;
    t = t.replace(/\(([^()]*)\)/g, (m, inner) =>
      REPO_REF.test(inner) || /`/.test(inner) ? "" : m,
    );
  } while (t !== prev);
  return t
    .replace(/`[^`]*`/g, "")
    .replace(/#\d{2,}/g, "")
    .replace(/[ \t]+([,.;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

/** Drop any sentence carrying a date on or after the cutoff (ISO dates compare as strings). */
export function dropLateSentences(text, cutoff) {
  return text
    .split(/(?<=[.!?]["”*]?)\s+(?=[A-Z*_"“(])/)
    .filter((s) => !(s.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []).some((d) => d >= cutoff))
    .join(" ");
}

/** One member's card as plain text, and the sha256 of exactly what a blind role will read. */
export function memberCard(markdown, { cutoff, name }) {
  const secs = sections(markdown);
  const titles = { 1: "Who you are", 3: "What you are trying to do", 4: "How you decide" };
  const body = Object.keys(titles)
    .filter((k) => KEEP.has(k) && secs[k])
    .map(
      (k) =>
        `## ${titles[k]}\n\n${dropLateSentences(stripRefs(dropHypotheses(secs[k])), cutoff).trim()}`,
    )
    .join("\n\n");
  const text = `# Member card: ${name}\n\n${body}\n`;
  return { text, sha256: createHash("sha256").update(text).digest("hex") };
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd !== "cards")
    throw new Error("usage: packets.mjs cards --cutoff YYYY-MM-DD --out <dir> [member …]");
  const flag = (f) => rest[rest.indexOf(f) + 1];
  const cutoff = flag("--cutoff");
  const out = flag("--out");
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(cutoff ?? "") && out))
    throw new Error("--cutoff and --out are required");
  const named = rest.filter((a, i) => !(a.startsWith("--") || rest[i - 1]?.startsWith("--")));
  const members = named.length
    ? named
    : readdirSync("docs/members")
        .filter(
          (f) =>
            f.endsWith(".md") &&
            !["README.md", "coverage.md", "friction-ledger.md", "maps.md"].includes(f),
        )
        .map((f) => basename(f, ".md"));
  mkdirSync(out, { recursive: true });
  const hashes = {};
  for (const m of members) {
    const card = memberCard(readFileSync(join("docs/members", `${m}.md`), "utf8"), {
      cutoff,
      name: m,
    });
    writeFileSync(join(out, `${m}.md`), card.text);
    hashes[m] = card.sha256;
  }
  writeFileSync(join(out, "hashes.json"), `${JSON.stringify(hashes, null, 2)}\n`);
  console.log(`packets: ${members.length} cards → ${out}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
