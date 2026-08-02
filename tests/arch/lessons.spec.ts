import { execFileSync } from "node:child_process";

// Learning-Coach fitness gate. The remote half (failed runs on `main` with no lesson) needs a token
// and the network, so it degrades to a no-op here and is enforced by the pipeline; what CI's test
// job enforces offline is the ledger's integrity — every entry in docs/LESSONS.md carries its full
// field set and is closed. An entry with no PREVENTION is a war story, not a lesson.
describe("lessons ledger", () => {
  it("is well-formed and carries no open incidents", () => {
    expect(() =>
      execFileSync("./node_modules/.bin/harness-incident-scan", [], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
