import { advisoryScan } from "../support/advisory-scan.js";

// Duplication fitness gate — runs the real scanner (scripts/dupe-scan.mjs). To consolidate a copy
// run /dedupe. Advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("duplication budget (advisory)", () => {
  it("reports duplicate top-level definitions without blocking CI", () => {
    advisoryScan("scripts/dupe-scan.mjs");
  });
});
