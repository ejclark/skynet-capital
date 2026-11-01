import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { asWrittenInput, BANNED, guardVerdict } from "../../scripts/hooks/guard-bash.mjs";

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
      if (!v.allow) expect(v.reason).toContain("CLAUDE.md");
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

  it("refuses a hand-run moneypenny claim flag — it takes a real lease and writes real labels", () => {
    for (const cmd of [
      "node scripts/moneypenny/index.mjs --claim-feedback",
      "node scripts/moneypenny/index.mjs --claim-feedback-reply --event /tmp/ev.json",
      "GITHUB_OUTPUT=/tmp/o node scripts/moneypenny/index.mjs --claim-plan --event f.json",
      "node scripts/moneypenny/index.mjs --claim-next",
    ]) {
      const v = guardVerdict(bash(cmd));
      expect(v.allow, cmd).toBe(false);
      if (!v.allow) expect(v.reason).toContain("docs/LESSONS.md");
    }
  });

  it("allows the read-only and repair flags on the same script", () => {
    for (const cmd of [
      "node scripts/moneypenny/index.mjs --check-claim feedback-4299",
      "node scripts/moneypenny/index.mjs --peek-next",
      "node scripts/moneypenny/index.mjs --release feedback-4299",
      "node scripts/moneypenny/index.mjs --dry-run --event f.json",
      "node scripts/moneypenny/admission.mjs --check 4299",
    ]) {
      expect(guardVerdict(bash(cmd)).allow, cmd).toBe(true);
    }
  });

  // The rule's first use refused a `cat > body.md` whose text merely NAMED the flag. A gate that
  // fires on prose about a command is a UX defect on our own tooling, not a safety win.
  it("allows a command that only mentions a claim flag as text", () => {
    for (const cmd of [
      'echo "run node scripts/moneypenny/index.mjs --claim-plan" >> notes.md',
      "cat > body.md <<'EOF'\nnew_cli_flag: node scripts/moneypenny/index.mjs --claim-feedback-reply\nEOF",
      "grep -rn -- --claim-feedback scripts/",
    ]) {
      expect(guardVerdict(bash(cmd)).allow, cmd).toBe(true);
    }
  });

  it("refuses a raw issue/PR comment write and points at issues.mjs (#4537)", () => {
    for (const cmd of [
      "gh issue comment 4537 --body hi",
      "gh pr comment 12 -F c.md",
      "GH_TOKEN=x gh issue comment 1 --edit-last -b y",
      "gh api --method PATCH repos/o/r/issues/comments/6074658599 -f body=@b",
      "gh api repos/o/r/issues/4537/comments -f body=hi",
      'curl -s -X POST -H "Authorization: Bearer $T" https://api.github.com/repos/o/r/issues/4537/comments -d @c.json',
      "cd x && curl --request PATCH https://api.github.com/repos/o/r/issues/comments/9 --data @b.json",
      "curl -s https://api.github.com/repos/o/r/issues/4537/comments -d @c.json",
    ]) {
      const v = guardVerdict(bash(cmd));
      expect(v.allow, cmd).toBe(false);
      if (!v.allow) expect(v.reason).toContain("issues -- update");
    }
  });

  it("allows comment reads, other API writes, and text that only names a comment write", () => {
    for (const cmd of [
      "gh api repos/o/r/issues/4537/comments --jq '.[].body'",
      'curl -s -H "Authorization: Bearer $T" https://api.github.com/repos/o/r/issues/4537/comments?per_page=100',
      "gh api --method PATCH repos/o/r/issues/4537 -f state=closed",
      "curl -X POST https://api.github.com/repos/o/r/pulls/12/comments/3/replies -d @r.json",
      "npm run issues -- update 4537 --edit-comment 9 --comment-file c.md",
      "echo 'gh issue comment 1' > notes.md",
      "git commit -m 'never gh pr comment by hand'",
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

describe("guard-bash — removing worktrees", () => {
  // 2026-11-01: an empty filter in a shell loop removed 115 worktrees, most of them other sessions'.
  it("refuses a computed path, however the loop is written", () => {
    for (const command of [
      'git worktree remove "$w"',
      '/usr/bin/git worktree remove "$w"',
      '$G worktree remove "$R/$n"',
      "for w in $(ls); do git worktree remove $w; done",
      "git worktree remove $(pwd)/x",
      "git worktree remove `pwd`/x",
      'git -C "$P" worktree remove x/$n',
      "bash -c 'git worktree remove \"$w\"'",
      "ls | xargs -n1 git worktree remove",
    ]) {
      expect(guardVerdict(bash(command))).toMatchObject({
        allow: false,
        reason: expect.stringContaining("worktree:sweep"),
      });
    }
  });

  it("allows one path typed out, and everything that only reads", () => {
    for (const command of [
      "git worktree remove .claude/worktrees/my-agent",
      "git worktree list",
      "git worktree add .claude/worktrees/x main",
      "npm run worktree:sweep -- --apply",
      // Naming the command is not running it: its first draft refused this PR's own title.
      'scripts/ship.sh open "fix(hooks): refuse git worktree remove on a computed path" --body-file $S/b.md',
      'echo "git worktree remove $w" > notes.md',
    ]) {
      expect(guardVerdict(bash(command)).allow).toBe(true);
    }
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

// The user-level rtk hook rewrites a command before Claude Code runs it. Two rewrites turn a
// working command into a failing one: `git …` becomes `rtk git …`, which the harness's own worktree
// check refuses in an isolated agent, and `npx biome …` / `npm run lint` become `rtk lint …`, which
// looks for ESLint or a package named after the subcommand. The guard hands those commands back as
// written; the harness's worktree check still reads the result, so its protection does not move.
const WORKTREE = "/repo/.claude/worktrees/wf_abc-1";
const agentBash = (command: string, extra: Record<string, unknown> = {}) => ({
  ...bash(command),
  cwd: WORKTREE,
  agent_id: "agent-1",
  agent_type: "general-purpose",
  ...extra,
});

describe("guard-bash — commands rtk would break are handed back as written", () => {
  it("keeps git as written for an agent isolated in a worktree, in every form rtk trips on", () => {
    for (const cmd of [
      "git status",
      "git fetch origin main && git checkout -B fix/x origin/main",
      'grep -n "git fetch" scripts/ship.sh',
    ]) {
      expect(asWrittenInput(agentBash(cmd))?.command, cmd).toBe(cmd);
    }
  });

  it("carries every other tool input field, because the hook's input replaces the whole object", () => {
    const input = {
      ...agentBash("git status"),
      tool_input: { command: "git status", timeout: 5000, description: "show status" },
    };
    expect(asWrittenInput(input)).toEqual(input.tool_input);
  });

  // A wider rule that also took globs, variables and pipes caught 18 more of 114 refusals but took
  // 85% of agent commands away from rtk, so a pipeline with no git in it must stay rtk's.
  it("leaves rtk's output savings on every command that does not name git", () => {
    for (const cmd of [
      "grep -n foo package.json",
      "ls scripts",
      "npm test",
      "cat README.md",
      "grep -n foo package.json | head -5",
      "ls scripts/*.mjs",
      "ls $HOME",
    ]) {
      expect(asWrittenInput(agentBash(cmd)), cmd).toBeNull();
    }
  });

  it("does not touch git outside an isolated worktree agent, where rtk's rewrite is fine", () => {
    const cases = [
      bash("git status"),
      { ...bash("git status"), cwd: WORKTREE },
      { ...bash("git status"), agent_id: "agent-1", cwd: "/repo" },
      { ...bash("git status"), agent_id: "agent-1" },
      agentBash("git status", { cwd: "/repo/.claude/worktrees-old/x" }),
    ];
    for (const input of cases) expect(asWrittenInput(input), JSON.stringify(input)).toBeNull();
  });

  it("keeps biome and the lint script as written in every session, since rtk runs neither", () => {
    for (const cmd of [
      "npx biome check .",
      "npx biome format --write a.ts",
      "cd app && npx biome check src",
      "FOO=1 npx biome check .",
      "npm run lint",
      "npm run typecheck && npm run lint",
      "time npm run lint",
    ]) {
      expect(asWrittenInput(bash(cmd))?.command, cmd).toBe(cmd);
    }
  });

  it("does not match biome or lint named as text, or a longer script name", () => {
    for (const cmd of ["echo 'npx biome check'", "npm run lint:fix", "grep -n 'npm run lint' a"]) {
      expect(asWrittenInput(bash(cmd)), cmd).toBeNull();
    }
  });

  it("ignores another tool and an empty command", () => {
    expect(asWrittenInput({ tool_name: "Edit", tool_input: { command: "git status" } })).toBeNull();
    expect(asWrittenInput({ tool_name: "Bash", tool_input: {} })).toBeNull();
  });
});

describe("guard-bash — the as-written hook output", () => {
  const cli = (stdin: unknown) => {
    const r = spawnSync("node", [SCRIPT], { input: JSON.stringify(stdin), encoding: "utf8" });
    return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  };

  it("prints the input back as updatedInput on PreToolUse, and exits 0", () => {
    const { status, stdout } = cli(agentBash("git status"));
    expect(status).toBe(0);
    const out = JSON.parse(stdout).hookSpecificOutput;
    expect(out.hookEventName).toBe("PreToolUse");
    expect(out.updatedInput).toEqual({ command: "git status" });
  });

  // `allow` would skip the permission prompt. This hook only undoes a rewrite; whether the command
  // may run stays with the permission rules and the harness's worktree check.
  it("never carries a permission decision", () => {
    const out = JSON.parse(cli(agentBash("git status")).stdout).hookSpecificOutput;
    expect(out.permissionDecision).toBeUndefined();
  });

  it("prints nothing when rtk's rewrite is fine, so its output savings stay", () => {
    expect(cli(agentBash("grep -n foo package.json")).stdout).toBe("");
    expect(cli(bash("git status")).stdout).toBe("");
  });

  it("still refuses a banned command in an isolated agent, and hands nothing back", () => {
    const { status, stdout, stderr } = cli(agentBash("git stash"));
    expect(status).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain("guard-bash refused git stash");
  });

  // The hook only reaches an agent if settings wire it to Bash, and only a synchronous hook's output
  // can set the input, so the wiring is part of the fix.
  it("stays wired to Bash in the project settings, and synchronous", () => {
    const settings = JSON.parse(readFileSync(join(process.cwd(), ".claude/settings.json"), "utf8"));
    const bashHooks = settings.hooks.PreToolUse.filter((h: { matcher: string }) =>
      h.matcher.split("|").includes("Bash"),
    ).flatMap((h: { hooks: { command: string; async?: boolean }[] }) => h.hooks);
    const guard = bashHooks.find((h: { command: string }) => h.command.includes("guard-bash.mjs"));
    expect(guard).toBeDefined();
    expect(guard.async).toBeUndefined();
  });
});
