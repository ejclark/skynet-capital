import { advisoryScan } from "../support/advisory-scan.js";

// Learning-Coach fitness gate — the OFFLINE half only: the ledger's integrity (every entry in
// docs/LESSONS.md carries its full field set and is closed). The token is scrubbed here because any
// caller that exports GH_TOKEN would otherwise turn this into a live-GitHub call on every push.
// Advisory (both halves) since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("lessons ledger (advisory)", () => {
  it("reports ledger formatting/open-incident issues without blocking CI", () => {
    advisoryScan("scripts/incident-scan.mjs", { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" });
  });
});
