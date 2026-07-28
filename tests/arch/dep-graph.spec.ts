import { execFileSync } from "node:child_process";

// Dependency-graph fitness gate — runs the real scanner (scripts/dep-graph-scan.mjs, powered by
// dependency-cruiser) so import cycles, orphans, and hexagonal layering breaches can't accumulate.
// Adopted detector, crafted ratchet: the committed budget (dep-graph-budget.json) only ever goes
// DOWN (`npm run depgraph:scan -- --update` after a fix lands). A genuinely-wrong rule is a config
// change in .dependency-cruiser.cjs with justification — that's a legitimate outcome, not a bypass.
describe("dependency-graph budget", () => {
  it("cycles/orphans/layering breaches stay within the committed budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/dep-graph-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
