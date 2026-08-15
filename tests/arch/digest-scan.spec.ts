import { execFileSync } from "node:child_process";

// Digest contract gate — the secretary's scan (scripts/digest-scan.mjs) and every committed
// digest (docs/digests/) must satisfy the template contract, because the daily digest Routine
// no-ops or acts on the scan's word. Static analysis — no network, no session.
describe("digest-scan contract", () => {
  it("every committed digest satisfies the template contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/digest-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  it("--due emits the JSON shape the Routine consumes", () => {
    const out = execFileSync("node", ["scripts/digest-scan.mjs", "--due"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const s = JSON.parse(out);
    expect(typeof s.due).toBe("boolean");
    expect([null, "no-digest", "threshold", "heartbeat"]).toContain(s.reason);
    // With docs/digests/ seeded, the volume fields are real numbers keyed to the newest digest.
    expect(s.lastDigest).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof s.commitsSinceLast).toBe("number");
    expect(typeof s.daysSinceLast).toBe("number");
  });
});
