import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { BANNED, guardVerdict } from "../../scripts/hooks/guard-bash.mjs";

// The Bash guard (scripts/hooks/guard-bash.mjs) turns a ledger-only lesson into a rank-1 gate:
// a banned command is refused before it runs, with the doctrine line as the reason. The pure
// verdict is specced directly; the CLI cases pin the exit codes the hook contract depends on
// (2 blocks, 0 allows) and the fail-open rule for unreadable input.
const SCRIPT = join(process.cwd(), "scripts/hooks/guard-bash.mjs");

const run = (stdin: string): { status: number; stderr: string } => {
  const r = spawnSync("node", [SCRIPT], { input: stdin, encoding: "utf8" });
  return { status: r.status ?? -1, stderr: r.stderr ?? "" };
};

const bash = (command: string) => ({ tool_name: "Bash", tool_input: { command } });

describe("guard-bash — the verdict", () => {
  it("refuses git stash in every state-moving form, with the doctrine line", () => {
    for (const cmd of [
      "git stash",
      "git stash push -u -m wip",
      "cd /x && git stash pop",
      "git add -A; git stash; npm test",
      "git stash drop stash@{0}",
    ]) {
      const v = guardVerdict(bash(cmd));
      expect(v.allow, cmd).toBe(false);
      expect(v.reason).toContain("CLAUDE.md");
    }
  });

  it("allows the read-only stash subcommands and everything else", () => {
    for (const cmd of [
      "git stash list",
      "git stash show -p stash@{0}",
      "git status",
      "echo 'git stash' > notes.md",
      "npm test",
    ]) {
      expect(guardVerdict(bash(cmd)).allow, cmd).toBe(true);
    }
  });

  it("ignores tools other than Bash", () => {
    expect(guardVerdict({ tool_name: "Edit", tool_input: { file_path: "git stash" } }).allow).toBe(
      true,
    );
  });

  it("every rule names its doctrine", () => {
    for (const rule of BANNED) expect(rule.reason).toMatch(/CLAUDE\.md|docs\//);
  });
});

describe("guard-bash — the hook contract", () => {
  it("exits 2 with the reason on stderr for a banned command", () => {
    const { status, stderr } = run(JSON.stringify(bash("git stash")));
    expect(status).toBe(2);
    expect(stderr).toContain("guard-bash refused git stash");
  });

  it("exits 0 for an allowed command", () => {
    expect(run(JSON.stringify(bash("git status"))).status).toBe(0);
  });

  it("fails open on unreadable input, saying so — a broken guard must not block the agent", () => {
    const { status, stderr } = run("not json");
    expect(status).toBe(0);
    expect(stderr).toContain("could not read the hook payload");
  });
});
