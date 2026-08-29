import { advisoryScan } from "../support/advisory-scan.js";

// Spec-gap fitness gate — src files no spec imports. Advisory since 2026-08-29 (Eric) — see
// tests/support/advisory-scan.ts.
describe("spec-gap budget (advisory)", () => {
  it("reports untested src files without blocking CI", () => {
    advisoryScan("scripts/spec-gap-scan.mjs");
  });
});
