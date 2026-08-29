import { advisoryScan } from "../support/advisory-scan.js";

// Dead-code fitness gate — runs the real scanner (scripts/dead-scan.mjs, powered by knip). Advisory
// since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("dead-code budget (advisory)", () => {
  it("reports unused files/exports/types without blocking CI", () => {
    advisoryScan("scripts/dead-scan.mjs");
  });
});
