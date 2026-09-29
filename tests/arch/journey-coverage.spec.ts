import { execFileSync } from "node:child_process";
import { advisoryScan } from "../support/advisory-scan.js";

// Journey coverage (scripts/crawl/coverage.mjs) over the REAL route tree, triage and journeys —
// the parsers are pinned over fixtures in tests/scripts/crawl-coverage.spec.ts; this is the gate.
// Two halves, two classes (docs/COACHES.md → "A gate is a momentum breaker unless it protects a
// constraint"):
//   - BLOCKING: every screen the code has is judged in docs/members/triage.json. Other lanes read
//     triage as the contract for which screens get phone work, so a new screen cannot slip in
//     unjudged.
//   - ADVISORY: the gap count (a living screen no phone journey step visits) may not rise above
//     journey-coverage-budget.json — debt, so a ratchet, never a red mid-flow.

interface Row {
  key: string;
  status: string;
}

/** `coverage.mjs --json` exits 1 on an unjudged or stale row but still prints the joined rows. */
function coverageJson(): { unjudged: Row[] } {
  try {
    return JSON.parse(
      execFileSync("node", ["scripts/crawl/coverage.mjs", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (err) {
    const stdout = (err as { stdout?: string }).stdout ?? "";
    if (stdout.trim().startsWith("{")) return JSON.parse(stdout);
    throw err;
  }
}

describe("journey coverage", () => {
  it("judges every screen the code has in docs/members/triage.json", () => {
    const unjudged = coverageJson().unjudged.map((r) => r.key);
    expect(
      unjudged,
      "a new screen must be judged — add a row to docs/members/triage.json (keep · fold · retire · redirect-only · undecided)",
    ).toEqual([]);
  });

  it("reports the phone gap count against its budget without blocking CI (advisory)", () => {
    advisoryScan("scripts/crawl/coverage-budget.mjs");
  });
});
