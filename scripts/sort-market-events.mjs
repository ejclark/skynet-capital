#!/usr/bin/env node
// Re-sort src/domain/market-events-data.ts's MARKET_EVENTS entries into (date, id) order.
//
// This is the FIX for what `node scripts/event-scan.mjs --validate` flags, not the enforcement —
// the rule and the reason both live in scripts/event-scan-validation.mjs's compareEventOrder
// (short version: file order is the only lever that makes GitHub's own server-side merge stop
// calling two independent research appends a conflict, #1341).
//
//   node scripts/sort-market-events.mjs                  # rewrite the file in place
//   node scripts/sort-market-events.mjs --file=<path>    # override the target (tests)
//
// The safety property that matters here is that a sort MOVES entries and changes nothing else:
// 141 reordered entries is a diff nobody can read, so the guard cannot be review. This script
// therefore verifies its own output — the multiset of entry texts must be byte-identical before
// and after, checked against what it actually wrote back to disk — and refuses loudly otherwise.
// Dependency-free, matching event-scan.mjs: it must run without `npm ci`.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareEventOrder } from "./event-scan-validation.mjs";
import { parseFile, serializeFile } from "./market-events-file.mjs";

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const FILE = arg("file") ?? join(process.cwd(), "src", "domain", "market-events-data.ts");

/** Same entries, any order — the invariant a pure reordering must hold. */
function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const text of a) counts.set(text, (counts.get(text) ?? 0) + 1);
  for (const text of b) {
    const n = counts.get(text);
    if (!n) return false;
    counts.set(text, n - 1);
  }
  return true;
}

function main() {
  const parsed = parseFile(FILE);
  const before = parsed.entries.map((e) => e.text);
  // Array#sort is stable, and ids are unique (event-scan --validate enforces that), so the result
  // is a single deterministic order rather than one of several equally-valid ones.
  const sorted = [...parsed.entries].sort(compareEventOrder);
  const sortedTexts = sorted.map((e) => e.text);

  if (!sameMultiset(before, sortedTexts))
    throw new Error("sort-market-events: sorting changed the entry set — refusing to write.");

  const moved = sorted.filter((e, i) => e.id !== parsed.entries[i].id).length;
  if (moved === 0) {
    console.log(`✓ ${before.length} event(s) already in (date, id) order — nothing to do.`);
    return;
  }

  writeFileSync(FILE, serializeFile({ ...parsed, entries: sorted }));

  // Re-read what landed on disk. The write is the step that could corrupt the literal (a bad
  // join, a lost trailing comma), so the check has to be against the file, not the in-memory array.
  const after = parseFile(FILE);
  const afterTexts = after.entries.map((e) => e.text);
  if (!sameMultiset(before, afterTexts))
    throw new Error(`sort-market-events: ${FILE} lost or altered entries on write.`);
  if (after.prefix !== parsed.prefix || after.suffix !== parsed.suffix)
    throw new Error(`sort-market-events: ${FILE}'s surrounding source changed on write.`);

  console.log(
    `✓ sorted ${before.length} event(s) by (date, id); ${moved} moved, content byte-identical.`,
  );
}

main();
