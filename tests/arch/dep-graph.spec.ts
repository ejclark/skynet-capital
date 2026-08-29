import { advisoryScan } from "../support/advisory-scan.js";

// Dependency-graph fitness gate — runs the real scanner (scripts/dep-graph-scan.mjs, powered by
// dependency-cruiser). Advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("dependency-graph budget (advisory)", () => {
  it("reports cycles/orphans/layering breaches without blocking CI", () => {
    advisoryScan("scripts/dep-graph-scan.mjs");
  });
});
