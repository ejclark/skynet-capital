#!/usr/bin/env node
// Test-quality scan — advisory check for the implementation-testing smells docs/ENGINEERING.md's
// BDD rule already forbids ("specs assert on observable behavior... never on private fields or
// call counts"). Rides the same path as incident-scan.mjs/digest-scan.mjs/plan-closure-scan.mjs:
// an advisory at PR-open time, never a hard gate.
//
// WHY ADVISORY, NOT GATED (Eric, 2026-08-30, on tests as acceptance criteria): a call-count or
// spy assertion is *usually* implementation-coupling (Fowler's "Mocks Aren't Stubs" — tests that
// assert on calls are tightly coupled to mechanism, fragile under refactor), but a real system
// boundary (an external API, a subprocess) can legitimately need one. A scan can flag the pattern;
// only a human (or `linguist`, for the comprehension half of this) can judge boundary-vs-internal.
// As of 2026-08-30 this repo has ZERO hits — the point is catching regression into a currently
// clean state, not retrofitting.
//
//   node scripts/test-quality-scan.mjs <branch> [--base main]   # advisory report
//
// Exit codes: 0 scanned (hits or not — advisory, never a gate) · 2 UNKNOWN, the diff it rests on
// could not be read, so nothing was scanned. ship.sh runs it `|| true`, so exit 2 stays advisory;
// it exists so "could not look" never reads as "looked and found nothing". A spec file in the diff
// that is not on disk (deleted by the change) is skipped with a `·` note. Pure pattern-matching is
// exported and unit-tested offline (tests/arch/test-quality-scan.spec.ts).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SMELLS = [
  {
    pattern: /\.toHaveBeenCalledTimes\(/,
    reason: "asserts a call COUNT — implementation coupling, not an observable outcome",
  },
  {
    pattern: /\.toHaveBeenCalledWith\(/,
    reason: "asserts HOW a collaborator was called — assert the resulting behavior instead",
  },
  {
    pattern: /\.mock\.calls\b/,
    reason: "reaches into mock call history directly — same coupling as toHaveBeenCalledWith",
  },
  {
    pattern: /\b(?:vi|jest)\.spyOn\(/,
    reason: "spies on a method to verify it ran — prefer asserting the resulting state/output",
  },
];

/** Line-numbered smell hits in one spec file's text. Pure — no filesystem, no git. */
export function findSmells(text) {
  const hits = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, reason } of SMELLS) {
      if (pattern.test(lines[i])) hits.push({ line: i + 1, reason, text: lines[i].trim() });
    }
  }
  return hits;
}

/** The spec files the change touches, or `null` when the diff itself could not be read. */
function changedSpecFiles(branch, base) {
  try {
    return execFileSync("git", ["diff", "--name-only", `origin/${base}...${branch}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .trim()
      .split("\n")
      .filter((f) => /(^|\/)tests\/.*\.spec\.tsx?$/.test(f));
  } catch (err) {
    // Required: the verdict rests on this diff. Without it the scan looked at nothing, which must
    // never print the same silence as a clean pass.
    const why = String(err?.stderr || err?.message || err)
      .trim()
      .split("\n")[0];
    console.log(
      `test-quality-scan: UNKNOWN — could not diff origin/${base}...${branch} (${why}); no spec was scanned.`,
    );
    return null;
  }
}

function main() {
  const [branch] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const baseIdx = process.argv.indexOf("--base");
  const base = baseIdx === -1 ? "main" : process.argv[baseIdx + 1];
  if (!branch) {
    console.log("test-quality-scan: usage: test-quality-scan.mjs <branch> [--base main]");
    return;
  }
  const files = changedSpecFiles(branch, base);
  if (files === null) {
    process.exitCode = 2;
    return;
  }
  let total = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      // Optional: a spec the change deletes has nothing left to smell. Named, so a run from the
      // wrong directory (every read missing) cannot pass as a clean scan.
      console.log(`· test-quality-scan: ${file} not on disk (deleted in this diff?) — skipped`);
      continue;
    }
    for (const hit of findSmells(text)) {
      total++;
      console.log(`test-quality-scan: ${file}:${hit.line} — ${hit.reason}\n  ${hit.text}`);
    }
  }
  if (total > 0) {
    console.log(
      `test-quality-scan: ${total} implementation-testing smell(s) above — docs/ENGINEERING.md's ` +
        "BDD rule (never on private fields or call counts); a real system boundary can be a legitimate exception, judge case by case.",
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
