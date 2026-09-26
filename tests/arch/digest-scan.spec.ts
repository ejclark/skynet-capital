import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

// Honest degradation (docs/grind/honest-degradation.instructions.md): an absent docs/digests/ is
// optional — "no digest yet" is still a true answer — but it is named, never a bare pass.
describe("digest-scan — an absent digests directory is a named state", () => {
  const SCRIPT = join(process.cwd(), "scripts/digest-scan.mjs");
  const inEmptyDir = (args: string[]) => {
    const dir = mkdtempSync(join(tmpdir(), "digest-scan-empty-"));
    try {
      const r = spawnSync("node", [SCRIPT, ...args], { cwd: dir, encoding: "utf8" });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("--validate still passes but names the absent directory", () => {
    const { code, stdout } = inEmptyDir(["--validate"]);
    expect(code).toBe(0);
    expect(stdout).toContain("· docs/digests/ absent — no digest yet");
  });

  it("--due keeps stdout pure JSON (no-digest) and names the absent directory on stderr", () => {
    const { code, stdout, stderr } = inEmptyDir(["--due"]);
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ due: true, reason: "no-digest" });
    expect(stderr).toContain("· docs/digests/ absent — no digest yet");
  });
});
