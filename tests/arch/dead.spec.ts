import { execFileSync } from "node:child_process";

// Dead-code fitness gate — runs the real scanner (scripts/dead-scan.mjs, powered by knip) so unused
// files/exports/types can't accumulate. Adopted detector, crafted ratchet: the committed budget
// (dead-budget.json) only ever goes DOWN (`npm run dead:scan -- --update` after a cleanup lands).
// False positives (e.g. scripts invoked by hooks, outside the module graph) are judged into
// knip.json's ignore list with justification — that's a legitimate outcome, not a bypass.
describe("dead-code budget", () => {
  it("unused files/exports/types stay within the committed budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/dead-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
