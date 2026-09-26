import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Config audit (scripts/config-audit.mjs) — a read-only, proposals-only report for the secretary
// digest. These fixture cases pin its honest degradation (docs/grind/honest-degradation.
// instructions.md): a check that could not run says UNKNOWN and exits 2, never a finding the
// missing input manufactured.
const SCRIPT = join(process.cwd(), "scripts/config-audit.mjs");

/** Run the real audit in a seeded fixture holding one agent; return {status, out}. */
function auditFixture(seed?: (root: string) => void): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "config-audit-fixture-"));
  // The ceiling stops git discovering a repo above the fixture, so "not a repo" means exactly that.
  const env = { ...hermeticGitEnv(), GIT_CEILING_DIRECTORIES: dirname(root) }; // after the scrub
  try {
    mkdirSync(join(root, ".claude", "agents"), { recursive: true });
    writeFileSync(join(root, ".claude", "agents", "scout.md"), "---\nname: scout\n---\n");
    seed?.(root);
    try {
      const out = execFileSync("node", [SCRIPT], { cwd: root, encoding: "utf8", env });
      return { status: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("config-audit — missing inputs are named, never a manufactured finding", () => {
  it("reports zero references as possibly-orphaned when git grep answers (control case)", () => {
    const { status, out } = auditFixture((root) => {
      execFileSync("git", ["init", "-q"], { cwd: root, env: hermeticGitEnv() });
    });
    expect(status).toBe(0);
    expect(out).toContain('agent "scout" — no config-surface references');
  });

  it("exits 2 with UNKNOWN when git grep cannot run, instead of calling everything orphaned", () => {
    const { status, out } = auditFixture();
    expect(status).toBe(2);
    expect(out).toContain("UNKNOWN — `git grep` failed");
    expect(out).not.toContain("Possibly orphaned");
  });
});
