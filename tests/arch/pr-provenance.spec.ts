import { advisoryScan } from "../support/advisory-scan.js";

// PR provenance (#4393 criterion 8): a merged PR that names no issue and is no machine lane's is
// invisible to the Orchestration board. Advisory with a ratchet, never red — same as every other
// debt gate since Eric's 2026-08-29 call. The rule itself is specced in
// tests/scripts/moneypenny/pr-issues.spec.ts (`namesNoIssue`); this wires the live count in.
describe("pr provenance (advisory)", () => {
  it("reports merged PRs the board cannot see without blocking CI", () => {
    advisoryScan("scripts/pr-provenance-scan.mjs", {
      ...process.env,
      GH_TOKEN: "",
      GITHUB_TOKEN: "",
    });
  });
});
