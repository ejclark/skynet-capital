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
//   node scripts/test-quality-scan.mjs <branch> [--base main]   # advisory report (exit 0 always)
//
// Degrades to a clean no-op with no network — never a flaky gate. Pure pattern-matching is
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

function changedSpecFiles(branch, base) {
  try {
    return execFileSync("git", ["diff", "--name-only", `origin/${base}...${branch}`], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((f) => /(^|\/)tests\/.*\.spec\.tsx?$/.test(f));
  } catch {
    return [];
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
  let total = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue; // deleted in this diff — nothing to scan
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
