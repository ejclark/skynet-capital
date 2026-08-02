import { execFileSync } from "node:child_process";

// Duplication fitness gate — runs the real scanner (harness-dupe-scan, from the central harness) so pasted helpers/token
// blocks can't multiply (audit finding C2: escapeHtml ×3, copied design-token blocks). Enforced on
// every PR through the existing test job. To consolidate a copy run /dedupe; the budget only ever
// ratchets DOWN (`npm run dupe:scan -- --update` after consolidating).
describe("duplication budget", () => {
  it("duplicate top-level definitions stay within the committed budget", () => {
    expect(() =>
      execFileSync("./node_modules/.bin/harness-dupe-scan", [], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
