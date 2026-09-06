import { advisoryScan } from "../support/advisory-scan.js";

// God-file gate: reports source files over the flat 300 code-line cap (500 for tests) and
// junk-drawer names (utils.ts/helpers.ts/common.ts/misc.ts), via scripts/arch-scan.mjs. Advisory
// since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts. Code lines, not physical, since
// #1713: comments that carry context for the next session are not what the cap is pricing.
describe("architecture — god-file gate (advisory)", () => {
  it("reports file-size debt without blocking CI", () => {
    advisoryScan("scripts/arch-scan.mjs");
  });
});
