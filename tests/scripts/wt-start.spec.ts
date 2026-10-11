import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// scripts/wt-start.sh (#5192) folds a worktree agent's opening ritual into one call. Driven
// against a throwaway world: a bare repo as `origin`, a primary clone, and a worktree of it. The
// fixture commits stand-ins for scripts/worktree-setup.sh and scripts/issues.mjs, because the
// script runs the copies in the checkout it is standing in — the real ones would clone the real
// node_modules and call GitHub.
const SCRIPT = resolve("scripts/wt-start.sh");
const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });

const SETUP_STUB = `#!/usr/bin/env bash
set -euo pipefail
[ ! -f fail-setup ] || { echo "stub setup: told to fail"; exit 1; }
mkdir -p node_modules/.bin
printf '#!/bin/sh\\n' > node_modules/.bin/biome; chmod +x node_modules/.bin/biome
printf '#!/bin/sh\\n' > node_modules/.bin/rstest; chmod +x node_modules/.bin/rstest
echo "stub setup: ready"
`;
const ISSUES_STUB = `console.log("#" + process.argv[3] + " [Ready] stub issue title");\n`;

describe("wt-start — one call from a fresh worktree to the first edit", () => {
  let root: string;
  let origin: string;
  let primary: string;
  let wtCount = 0;

  const git = (args: string[], cwd: string) => {
    const r = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], {
      cwd,
      env,
      encoding: "utf8",
    });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const commit = (cwd: string, file: string, msg: string) => {
    writeFileSync(join(cwd, file), `${msg}\n`);
    git(["add", "-A"], cwd);
    git(["commit", "-q", "-m", msg], cwd);
  };
  const run = (cwd: string, ...args: string[]) => {
    const r = spawnSync("bash", [SCRIPT, ...args], { cwd, env, encoding: "utf8" });
    return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  };
  /** A fresh worktree of the primary, on its own throwaway branch — as `isolation: worktree` makes. */
  const worktree = () => {
    const dir = join(root, `wt-${++wtCount}`);
    git(["worktree", "add", "-q", "-b", `worktree-${wtCount}`, dir, "origin/main"], primary);
    return dir;
  };

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "wt-start-"));
    origin = join(root, "origin.git");
    const seed = join(root, "seed");
    primary = join(root, "primary");
    git(["init", "-q", "--bare", "-b", "main", origin], root);
    git(["init", "-q", "-b", "main", seed], root);
    git(["config", "user.email", "spec@example.com"], seed);
    git(["config", "user.name", "spec"], seed);
    mkdirSync(join(seed, "scripts"));
    writeFileSync(join(seed, "scripts/worktree-setup.sh"), SETUP_STUB);
    chmodSync(join(seed, "scripts/worktree-setup.sh"), 0o755);
    writeFileSync(join(seed, "scripts/issues.mjs"), ISSUES_STUB);
    writeFileSync(join(seed, ".gitignore"), "node_modules/\nfail-setup\n");
    commit(seed, "seed.txt", "chore: seed");
    git(["remote", "add", "origin", origin], seed);
    git(["push", "-q", "origin", "main"], seed);
    // A branch some earlier session already pushed, one commit past main.
    git(["checkout", "-q", "-b", "feedback/7"], seed);
    commit(seed, "earlier.txt", "feat: earlier work");
    git(["push", "-q", "origin", "feedback/7"], seed);
    git(["checkout", "-q", "main"], seed);
    git(["clone", "-q", origin, primary], root);
    git(["config", "user.email", "spec@example.com"], primary);
    git(["config", "user.name", "spec"], primary);
    // main moves on after the primary cloned, so a stale local ref is what the fetch must fix.
    commit(seed, "later.txt", "feat: later on main");
    git(["push", "-q", "origin", "main"], seed);
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("creates a new branch off the freshly fetched origin/main and ends on one status line", () => {
    const wt = worktree();
    const r = run(wt, "feedback/9");
    expect(r.status, r.stderr).toBe(0);
    expect(git(["symbolic-ref", "--short", "HEAD"], wt)).toBe("feedback/9");
    expect(git(["log", "-1", "--format=%s"], wt)).toBe("feat: later on main");
    const lines = r.stdout.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(
      /^wt-start: feedback\/9 · base [0-9a-f]{8} · 0 ahead, 0 behind origin\/main · node_modules ok · 0 uncommitted$/,
    );
    // No upstream: a bare `git push` must never aim at main.
    const up = spawnSync("git", ["rev-parse", "--abbrev-ref", "@{u}"], { cwd: wt, env });
    expect(up.status).not.toBe(0);
  });

  it("resumes a branch that already exists on origin, keeping its commits", () => {
    const wt = worktree();
    const r = run(wt, "feedback/7");
    expect(r.status, r.stderr).toBe(0);
    expect(git(["log", "-1", "--format=%s"], wt)).toBe("feat: earlier work");
    expect(r.stdout).toMatch(/feedback\/7 · base \w+ · 1 ahead, 1 behind origin\/main/);
  });

  it("prints the issue's line before the status line when --issue is passed", () => {
    const wt = worktree();
    const r = run(wt, "feedback/11", "--issue", "5192");
    expect(r.status, r.stderr).toBe(0);
    const lines = r.stdout.trim().split("\n");
    expect(lines).toEqual(["#5192 [Ready] stub issue title", expect.stringMatching(/^wt-start: /)]);
  });

  it("never discards work: a local branch with unpushed commits and dirty files survives a re-run", () => {
    const wt = worktree();
    expect(run(wt, "feedback/13").status).toBe(0);
    commit(wt, "mine.txt", "feat: unpushed");
    writeFileSync(join(wt, "draft.txt"), "uncommitted\n");
    const r = run(wt, "feedback/13");
    expect(r.status, r.stderr).toBe(0);
    expect(git(["log", "-1", "--format=%s"], wt)).toBe("feat: unpushed");
    expect(existsSync(join(wt, "draft.txt"))).toBe(true);
    expect(r.stdout).toMatch(/1 ahead, 0 behind origin\/main · node_modules ok · 1 uncommitted$/m);
  });

  it("stops with a non-zero exit naming the step that failed", () => {
    const wt = worktree();
    writeFileSync(join(wt, "fail-setup"), "");
    const r = run(wt, "feedback/15");
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("stub setup: told to fail");
    expect(r.stderr).toContain("failed at step 'setup'");
    expect(r.stdout).not.toContain("wt-start: feedback/15");
  });

  it("refuses in the primary checkout — it is for worktrees", () => {
    const head = git(["symbolic-ref", "--short", "HEAD"], primary);
    const r = run(primary, "feedback/17");
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("primary checkout");
    expect(git(["symbolic-ref", "--short", "HEAD"], primary)).toBe(head);
  });

  it("refuses without a branch name", () => {
    const r = run(worktree());
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("usage:");
  });
});
