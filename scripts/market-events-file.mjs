// Whole-entry parse/serialize for the MARKET_EVENTS literal in src/domain/market-events-data.ts.
//
// Extracted from scripts/merge-market-events.mjs (#1341) the moment a second caller needed exactly
// the same reading — scripts/sort-market-events.mjs. Both must treat the array as WHOLE,
// bracket-balanced object entries rather than as lines: the merge driver because line-merging two
// entries interleaves them into one malformed, duplicate-keyed object (proven wrong live, see that
// script's header), the sorter because moving an entry means moving every one of its lines
// together. One definition of "an entry" keeps the two from drifting apart.
//
// Dependency-free on purpose, like scripts/event-scan.mjs: both callers run without `npm ci`
// (the merge driver runs inside a git merge, which has no install step at all).
import { readFileSync } from "node:fs";

const MARKER = "export const MARKET_EVENTS: readonly MarketEvent[] = [";

/** Split the array's inner text into top-level, bracket-balanced object-literal substrings. */
function splitEntries(inner) {
  const texts = [];
  let i = 0;
  while (i < inner.length) {
    const brace = inner.indexOf("{", i);
    if (brace === -1) break;
    let depth = 0;
    let j = brace;
    for (; j < inner.length; j++) {
      if (inner[j] === "{") depth++;
      else if (inner[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) throw new Error("unbalanced object literal");
    texts.push(inner.slice(brace, j + 1));
    i = j + 1;
  }
  return texts;
}

/** {prefix, entries: [{id, date, text}], suffix} for one file. Throws if the marker or a balanced
 *  array close isn't found (same contract as event-scan.mjs's extractArray).
 *
 *  A missing/non-string `date` degrades to "" rather than throwing: a merge is the wrong place to
 *  invent a new refusal, and `node scripts/event-scan.mjs --validate` already fails a dateless
 *  entry on the committed file. */
export function parseFile(path) {
  const source = readFileSync(path, "utf8");
  const at = source.indexOf(MARKER);
  if (at === -1) throw new Error(`marker not found in ${path}`);
  const open = at + MARKER.length - 1;

  let depth = 0;
  let close = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "[" || source[i] === "{") depth++;
    else if (source[i] === "]" || source[i] === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) throw new Error(`unbalanced brackets in ${path}`);

  const entries = splitEntries(source.slice(open + 1, close)).map((text) => {
    // new Function is contained to checked-in, reviewed table literals — never remote input.
    const entry = new Function(`return (${text});`)();
    if (typeof entry?.id !== "string") throw new Error(`entry with no string id in ${path}`);
    return { id: entry.id, date: typeof entry.date === "string" ? entry.date : "", text };
  });

  return { prefix: source.slice(0, open + 1), entries, suffix: source.slice(close) };
}

/** The inverse of parseFile: entry texts back into the array literal, at the file's own indent. */
export function serializeFile({ prefix, entries, suffix }) {
  const texts = entries.map((e) => (typeof e === "string" ? e : e.text));
  const inner = texts.length ? `\n  ${texts.join(",\n  ")},\n` : "\n";
  return prefix + inner + suffix;
}
