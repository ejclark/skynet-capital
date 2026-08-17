import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Handoff contract gate — every committed handoff (docs/handoffs/<slug>/) must satisfy the contract
// in docs/handoffs/TEMPLATE.md before anything can build from it. A malformed handoff is worse than
// no handoff: an unattended session would build the wrong thing from it and look green doing so.
// Static analysis — no network, no session, no test recursion.
describe("handoff contract", () => {
  it("every committed handoff satisfies the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/handoff-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // The importer's exit status is the CONTRACT verdict, and handoff-ship stops the chain on it —
  // no ready flip, no PR. The push path used to exit 0 unconditionally while `--no-push` reported
  // honestly, so a dirty contract read as success and shipped a PR claiming it validated clean
  // (2026-08-16, docs/LESSONS.md). Both paths must carry the verdict, so both are asserted here.
  it("the importer reports the contract verdict through its exit status, on both paths", () => {
    const src = readFileSync("scripts/handoff-import.mjs", "utf8");
    // Every terminal exit AFTER the contract scan is the verdict; a bare `exit(0)` there is the bug.
    const afterScan = src.slice(src.indexOf("let clean"));
    const verdicts = [...afterScan.matchAll(/process\.exit\(([^)]*)\)/g)].map((m) => m[1]?.trim());
    expect(verdicts.length).toBeGreaterThanOrEqual(2); // the --no-push path and the push path
    for (const v of verdicts) expect(v).toBe("clean ? 0 : 1");
  });

  // The watcher workflow and the hourly Routine both read this one output. If its shape drifts,
  // the pickup silently stops working — which is exactly the failure a scheduled job hides best.
  it("--ready emits the JSON shape both pickup layers consume", () => {
    const out = execFileSync("node", ["scripts/handoff-scan.mjs", "--ready"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const ready = JSON.parse(out);
    expect(Array.isArray(ready)).toBe(true);
    for (const handoff of ready) {
      expect(handoff).toEqual(
        expect.objectContaining({
          slug: expect.any(String),
          title: expect.any(String),
          path: expect.any(String),
          readme: expect.any(String),
          files: expect.any(Array),
        }),
      );
    }
  });
});
