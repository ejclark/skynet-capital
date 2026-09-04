import { advisoryScan } from "../support/advisory-scan.js";

// Resource-cost fitness gate (docs/COACHES.md: "Resource cost is a fitness dimension") — the
// dimension named in doctrine but, until 2026-09-04, never mechanized: CI wall-clock. Advisory,
// same as every other debt gate since Eric's 2026-08-29 call.
describe("ci install duration (advisory)", () => {
  it("reports verify-job install-time regressions without blocking CI", () => {
    advisoryScan("scripts/ci-install-duration-scan.mjs", {
      ...process.env,
      GH_TOKEN: "",
      GITHUB_TOKEN: "",
    });
  });
});
