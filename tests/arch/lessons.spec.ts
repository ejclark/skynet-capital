import { execFileSync } from "node:child_process";

// Learning-Coach fitness gate — the OFFLINE half only: the ledger's integrity (every entry in
// docs/LESSONS.md carries its full field set and is closed; an entry with no PREVENTION is a war
// story, not a lesson). The remote half (failed runs on `main` with no lesson) is advisory and
// belongs to ship.sh, which calls the script directly. The token is scrubbed here because any
// caller that exports GH_TOKEN (ship.sh's own `npm run verify`, the pre-push hook under a live
// shell) would otherwise turn that advisory scan into a hard gate on every unrelated push.
describe("lessons ledger", () => {
  it("is well-formed and carries no open incidents", () => {
    expect(() =>
      execFileSync("node", ["scripts/incident-scan.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe",
        env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" },
      }),
    ).not.toThrow();
  });
});
