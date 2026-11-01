import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { decide } from "../../scripts/hooks/fresh-checkout.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The main checkout froze on a merged branch on 2026-10-10, 1,077 commits behind, and all 7 local
// sessions in the two weeks before 2026-11-01 started there on old rules (#6470's study). These
// specs run the real hook against real temp repos, with `gh` stubbed.
const SCRIPT = resolve("scripts/hooks/fresh-checkout.mjs");

describe("what the hook decides", () => {
  const clean = {
    isPrimary: true,
    behind: 5,
    ahead: 0,
    hasTrackedChanges: false,
    branch: null,
    head: "aaa",
    mergedPrHead: null,
  };

  it("does nothing when current, or in a worktree whose branch is someone's work", () => {
    expect(decide({ ...clean, behind: 0 }).act).toBe("none");
    expect(decide({ ...clean, isPrimary: false }).act).toBe("none");
  });

  it("moves a clean checkout on main or on a detached old commit", () => {
    expect(decide({ ...clean, branch: "main" }).act).toBe("move");
    expect(decide(clean).act).toBe("move");
  });

  it("moves off a branch whose merged PR is exactly this commit, the 10-10 freeze", () => {
    const merged = { ...clean, branch: "feat/x", ahead: 3, mergedPrHead: "aaa" };
    expect(decide(merged).act).toBe("move");
  });

  it("warns, and moves nothing, wherever work could be lost", () => {
    expect(decide({ ...clean, hasTrackedChanges: true }).act).toBe("warn");
    expect(decide({ ...clean, branch: "feat/x", ahead: 3 }).act).toBe("warn");
    expect(decide({ ...clean, branch: "feat/x", mergedPrHead: "bbb" }).act).toBe("warn");
    expect(decide({ ...clean, branch: "main", ahead: 1 }).act).toBe("warn");
    expect(decide({ ...clean, ahead: 2 }).act).toBe("warn");
  });
});

function git(cwd: string, ...args: string[]) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: hermeticGitEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

/** A bare origin with a main branch, and a clone sitting `behind` commits back on it. */
function fixture(behind = 2) {
  const root = mkdtempSync(join(tmpdir(), "fresh-checkout-"));
  const origin = join(root, "origin.git");
  const seed = join(root, "seed");
  const clone = join(root, "clone");
  mkdirSync(seed);
  git(root, "init", "-q", "--bare", "-b", "main", origin);
  git(seed, "init", "-q", "-b", "main");
  git(seed, "config", "user.email", "t@example.test");
  git(seed, "config", "user.name", "t");
  git(seed, "remote", "add", "origin", origin);
  const commit = (name: string) => {
    writeFileSync(join(seed, name), name);
    git(seed, "add", "-A");
    git(seed, "commit", "-q", "-m", name);
    git(seed, "push", "-q", "origin", "main");
  };
  commit("first");
  git(root, "clone", "-q", origin, clone);
  git(clone, "config", "user.email", "t@example.test");
  git(clone, "config", "user.name", "t");
  for (let i = 0; i < behind; i++) commit(`later-${i}`);
  const stub = join(root, "bin");
  mkdirSync(stub);
  writeFileSync(
    join(stub, "gh"),
    `#!/usr/bin/env bash\necho "$*" >> "${root}/gh-calls"\ncat "${root}/merged-head" 2>/dev/null\nexit 0\n`,
  );
  chmodSync(join(stub, "gh"), 0o755);
  return { root, clone, stub };
}

function run(cwd: string, stub: string, stdin = '{"source":"startup"}') {
  return spawnSync("node", [SCRIPT], {
    cwd,
    encoding: "utf8",
    input: stdin,
    env: hermeticGitEnv({ PATH: `${stub}:${process.env.PATH}` }),
  });
}

describe("the hook on a real checkout", () => {
  it("fast-forwards a clean main and says so once", () => {
    const { clone, stub } = fixture();
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(git(clone, "rev-list", "--count", "HEAD..origin/main")).toBe("0");
    expect(r.stdout).toContain("2 commits");
    expect(r.stdout.trim().split("\n")).toHaveLength(1);
  });

  it("is silent when already current", () => {
    const { clone, stub } = fixture(0);
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("moves off a merged branch and keeps untracked files", () => {
    const { root, clone, stub } = fixture();
    git(clone, "checkout", "-q", "-b", "feat/x");
    writeFileSync(join(clone, "work"), "w");
    git(clone, "add", "-A");
    git(clone, "commit", "-q", "-m", "work");
    writeFileSync(join(clone, "shot.png"), "untracked");
    writeFileSync(join(root, "merged-head"), git(clone, "rev-parse", "HEAD"));
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(git(clone, "rev-list", "--count", "HEAD..origin/main")).toBe("0");
    expect(readFileSync(join(clone, "shot.png"), "utf8")).toBe("untracked");
    expect(git(clone, "rev-parse", "--verify", "feat/x")).not.toBe("");
  });

  it("leaves an unmerged branch alone and warns", () => {
    const { clone, stub } = fixture();
    git(clone, "checkout", "-q", "-b", "feat/x");
    const head = git(clone, "rev-parse", "HEAD");
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(git(clone, "rev-parse", "HEAD")).toBe(head);
    expect(r.stdout).toContain("2 commits behind");
    expect(r.stdout).toContain("feat/x");
  });

  it("leaves uncommitted work alone and warns", () => {
    const { clone, stub } = fixture();
    writeFileSync(join(clone, "first"), "edited");
    const head = git(clone, "rev-parse", "HEAD");
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(git(clone, "rev-parse", "HEAD")).toBe(head);
    expect(readFileSync(join(clone, "first"), "utf8")).toBe("edited");
    expect(r.stdout).toContain("uncommitted");
  });

  it("does nothing on a compaction or a resume, only on a new session", () => {
    const { clone, stub } = fixture();
    const head = git(clone, "rev-parse", "HEAD");
    expect(run(clone, stub, '{"source":"compact"}').stdout).toBe("");
    expect(run(clone, stub, '{"source":"resume"}').stdout).toBe("");
    expect(git(clone, "rev-parse", "HEAD")).toBe(head);
  });

  it("leaves a worktree alone", () => {
    const { root, clone, stub } = fixture();
    const wt = join(root, "wt");
    git(clone, "worktree", "add", "-q", "--detach", wt);
    const head = git(wt, "rev-parse", "HEAD");
    const r = run(wt, stub);
    expect(r.stdout).toBe("");
    expect(git(wt, "rev-parse", "HEAD")).toBe(head);
  });

  it("runs from the real session-start hook on a laptop, and only there", () => {
    const { clone, stub } = fixture();
    mkdirSync(join(clone, "scripts", "hooks"), { recursive: true });
    copyFileSync(SCRIPT, join(clone, "scripts", "hooks", "fresh-checkout.mjs"));
    const start = (extra: Record<string, string>) =>
      spawnSync("bash", [resolve(".claude/hooks/session-start.sh")], {
        cwd: clone,
        encoding: "utf8",
        input: '{"source":"startup"}',
        env: hermeticGitEnv({
          PATH: `${stub}:${process.env.PATH}`,
          CLAUDE_PROJECT_DIR: clone,
          CLAUDE_CODE_REMOTE: "",
          ...extra,
        }),
      });
    const r = start({});
    expect(r.status).toBe(0);
    expect(git(clone, "rev-list", "--count", "HEAD..origin/main")).toBe("0");
    expect(r.stdout).toContain("2 commits newer");
  });

  it("never fails the session, even outside a repo", () => {
    const { root, stub } = fixture(0);
    const r = run(root, stub);
    expect(r.status).toBe(0);
  });

  it("still warns from what it knows when the network is down", () => {
    const { root, clone, stub } = fixture();
    git(clone, "fetch", "-q", "origin", "main");
    git(clone, "remote", "set-url", "origin", join(root, "gone.git"));
    writeFileSync(join(clone, "first"), "edited");
    const r = run(clone, stub);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("2 commits behind");
  });
});
