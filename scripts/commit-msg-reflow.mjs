#!/usr/bin/env node
// commit-msg reflow — wrap a commit BODY to commitlint's 100-column rule before commitlint runs,
// so the rule stops being a red gate and becomes a no-op fix (Eric, 2026-09-06: "wouldn't
// scripting a rule to codify validation on a pre-commit automatically prevent this problem 100%
// of the time?"). The rule itself stays (a commit's format is an interface — docs/COACHES.md);
// this only removes the author's chance to trip it by hand.
//
//   node scripts/commit-msg-reflow.mjs <path-to-COMMIT_EDITMSG>   # rewrites the file in place
//   node scripts/commit-msg-reflow.mjs --stdin                    # stdin → stdout (specs)
//
// What it touches: prose paragraphs in the body whose lines exceed the limit — re-wrapped at
// word boundaries, keeping a list item's or block-quote's hanging indent. What it never touches:
// the header (line 1 — a long subject is a real error, never silently rewritten), fenced code
// blocks, lines inside a table (`|`), trailers (`Key: value` in the final block —
// `Co-Authored-By:`, `Claude-Session:`), markdown headings, and any single token longer than the
// limit (a URL: it stays on its own line, and commitlint will still say so — the one residual).
// Dependency-free, like every hook-time script here.
import { readFileSync, writeFileSync } from "node:fs";

export const LIMIT = 100;
const TRAILER_RE = /^[A-Za-z][A-Za-z-]*: \S/;
const HEADING_RE = /^#{1,6}\s/;
const LIST_RE = /^(\s*(?:[-*+]|\d+[.)])\s+)/;
const QUOTE_RE = /^(\s*>\s?)/;

function wrapParagraph(lines) {
  const first = lines[0];
  const m = first.match(LIST_RE) ?? first.match(QUOTE_RE);
  const head = m ? m[1] : first.match(/^\s*/)[0];
  const hang = m ? " ".repeat(m[1].length) : head;
  const words = lines
    .map((l, i) => (i === 0 ? l.slice(head.length) : l.trim()))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  let cur = head;
  let curHasWord = false;
  for (const w of words) {
    const candidate = curHasWord ? `${cur} ${w}` : `${cur}${w}`;
    if (candidate.length <= LIMIT || !curHasWord) {
      cur = candidate;
      curHasWord = true;
    } else {
      out.push(cur);
      cur = `${hang}${w}`;
    }
  }
  if (curHasWord) out.push(cur);
  return out;
}

/** The same message with every over-long prose paragraph in its body re-wrapped. */
export function reflow(message) {
  const lines = message.split("\n");
  if (lines.length < 2) return message;
  const [header, ...body] = lines;
  const out = [header];
  let fenced = false;
  let para = [];
  const flush = () => {
    if (para.length === 0) return;
    const over = para.some((l) => l.length > LIMIT);
    out.push(...(over ? wrapParagraph(para) : para));
    para = [];
  };
  for (const line of body) {
    const fence = /^\s*(```|~~~)/.test(line);
    if (fence) {
      flush();
      fenced = !fenced;
      out.push(line);
      continue;
    }
    const verbatim =
      fenced ||
      line.trim() === "" ||
      line.startsWith("#") ||
      HEADING_RE.test(line) ||
      line.trimStart().startsWith("|") ||
      TRAILER_RE.test(line);
    if (verbatim) {
      flush();
      out.push(line);
      continue;
    }
    // A new list item or quote starts a new paragraph even without a blank line between.
    if (para.length > 0 && (LIST_RE.test(line) || QUOTE_RE.test(line))) flush();
    para.push(line);
  }
  flush();
  return out.join("\n");
}

const arg = process.argv[2];
if (arg === "--stdin") {
  process.stdout.write(reflow(readFileSync(0, "utf8")));
} else if (arg && !arg.startsWith("--")) {
  writeFileSync(arg, reflow(readFileSync(arg, "utf8")));
} else if (process.argv[1]?.endsWith("commit-msg-reflow.mjs")) {
  console.error("usage: commit-msg-reflow.mjs <COMMIT_EDITMSG> | --stdin");
  process.exit(1);
}
