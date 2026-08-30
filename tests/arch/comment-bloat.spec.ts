import { advisoryScan } from "../support/advisory-scan.js";

// Comment-bloat fitness gate — runs the real scanner (scripts/comment-bloat-scan.mjs). To trim a
// flagged comment, keep it only if it states a non-obvious WHY; delete narration (git blame / the PR
// already carry that history) — see CLAUDE.md, "Doing tasks". Advisory since 2026-08-29 (Eric) —
// see tests/support/advisory-scan.ts.
describe("comment-bloat budget (advisory)", () => {
  it("reports narration-style comments without blocking CI", () => {
    advisoryScan("scripts/comment-bloat-scan.mjs");
  });
});
