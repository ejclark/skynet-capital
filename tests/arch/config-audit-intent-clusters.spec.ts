import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Check ③ of scripts/config-audit.mjs (scripts/config-audit-intent-clusters.mjs) mines the local,
// git-ignored duel-log. Its absence and its torn lines are optional inputs, but named ones (docs/
// grind/honest-degradation.instructions.md): "none above threshold" must mean it looked.
const SCRIPT = join(process.cwd(), "scripts/config-audit.mjs");

/** Run the real audit in a seeded git fixture, optionally with a duel-log; return its stdout. */
function audit(duelLog?: string[]): string {
  const root = mkdtempSync(join(tmpdir(), "intent-clusters-fixture-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root, env: hermeticGitEnv() });
    if (duelLog) {
      mkdirSync(join(root, "data"), { recursive: true });
      writeFileSync(join(root, "data", "duel-log.jsonl"), `${duelLog.join("\n")}\n`);
    }
    return execFileSync("node", [SCRIPT], { cwd: root, encoding: "utf8", env: hermeticGitEnv() });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const intent = (prompt: string) => JSON.stringify({ kind: "intent", prompt });

describe("config-audit check ③ — the duel-log is optional, never silently", () => {
  it("names the absent log as a skipped check instead of 'none above threshold'", () => {
    const out = audit();
    expect(out).toContain("· data/duel-log.jsonl absent — check ③ skipped");
    expect(out).not.toContain("none above threshold");
  });

  it("counts torn lines as skipped and still clusters the rest", () => {
    const out = audit([
      intent("rebuild the leaderboard animation timing please"),
      '{"kind":"intent","prompt":"torn mid-app',
      intent("rebuild the leaderboard animation timing again"),
    ]);
    expect(out).toContain("· 1 malformed duel-log line(s) skipped.");
    expect(out).toContain("2 similar prompts");
  });
});
