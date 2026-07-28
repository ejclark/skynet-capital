import { execFileSync } from "node:child_process";

// Duplication fitness gate — runs the real scanner (scripts/dupe-scan.mjs) so pasted helpers/token
// blocks can't multiply (audit finding C2: escapeHtml ×3, copied design-token blocks). Enforced on
// every PR through the existing test job. To consolidate a copy run /dedupe; the budget only ever
// ratchets DOWN (`npm run dupe:scan -- --update` after consolidating).
describe("duplication budget", () => {
  it("duplicate top-level definitions stay within the committed budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/dupe-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
