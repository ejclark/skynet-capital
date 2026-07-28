import { execFileSync } from "node:child_process";

// Clone fitness gate — runs the real scanner (scripts/clone-scan.mjs) so pasted BLOCKS (copy-paste
// with renamed identifiers, which dupe-scan's same-name eye misses) can't multiply. Enforced on every
// PR through the existing test job. To consolidate a clone run /dedupe; the budget only ever ratchets
// DOWN (`npm run clone:scan -- --update` after extracting the shared block).
describe("clone budget", () => {
  it("copy-paste clone pairs stay within the committed budget", () => {
    expect(() =>
      execFileSync("node", ["scripts/clone-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
