import { execFileSync } from "node:child_process";

// Architecture fitness gate — runs the real scanner (scripts/arch-scan.mjs) so god files can't grow
// and new ones can't appear. This is the EXECUTABLE version of the audit's god-file finding: enforced
// on every PR through the existing test job, not a prose note that drifts. To adjust a budget, edit
// arch-budget.json in the same PR (a deliberate, reviewed act) or run `npm run arch:scan -- --update`.
describe("architecture budget", () => {
  it("no source file exceeds its committed line budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/arch-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
