import { advisoryScan } from "../support/advisory-scan.js";

// Clone fitness gate — runs the real scanner (scripts/clone-scan.mjs). To consolidate a clone run
// /dedupe. Advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("clone budget (advisory)", () => {
  it("reports copy-paste clone pairs without blocking CI", () => {
    advisoryScan("scripts/clone-scan.mjs");
  });
});
