import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// REVERTING ONE ITEM OUT OF A SQUASHED PLATTER (2026-11-01). The platter body asked for a merge
// commit and 20 of 27 landed as squashes anyway; a sentence cannot force a button. What holds either
// way: GitHub keeps `refs/pull/<n>/head` after it deletes the merged branch, and `git revert <sha>`
// needs a commit's parent and tree, never its ancestry in main. `ship platter revert <pr> <sha>`
// is that path. Driven end to end against a bare "origin" built here: an item pushed as a PR head,
// squash-merged into main, then reverted from a fresh clone that never held the item's commit.
const SHIP = resolve("scripts/ship.sh");

describe("ship platter revert — one item out of a squashed platter, from refs/pull/<n>/head", () => {
  let root: string;
  let origin: string;
  let clone: string;
  let itemSha: string;
  let baseSha: string;
  const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
      cwd,
      encoding: "utf8",
      env,
      stdio: "pipe",
    }).trim();
  const ship = (cwd: string, ...args: string[]) => {
    try {
      const stdout = execFileSync("bash", [SHIP, "platter", "revert", ...args], {
        cwd,
        encoding: "utf8",
        env,
        stdio: "pipe",
      });
      return { code: 0, stdout, stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stdout?: Buffer; stderr?: Buffer };
      return {
        code: e.status ?? -1,
        stdout: e.stdout?.toString() ?? "",
        stderr: e.stderr?.toString() ?? "",
      };
    }
  };

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "platter-revert-"));
    origin = join(root, "origin.git");
    const work = join(root, "work");
    git(root, "init", "-q", "--bare", "-b", "main", origin);
    git(root, "clone", "-q", `file://${origin}`, work);
    writeFileSync(join(work, "a.txt"), "base\n");
    writeFileSync(join(work, "b.txt"), "base\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "chore: seed");
    baseSha = git(work, "rev-parse", "HEAD");
    git(work, "push", "-q", "origin", "main");
    // The item, as `ship platter board` commits it, pushed as the platter PR's head.
    git(work, "checkout", "-q", "-b", "platter/2026-11-01");
    writeFileSync(join(work, "a.txt"), "the item\n");
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "fix(ci): the item", "-m", "Platter-Item: fix/item");
    itemSha = git(work, "rev-parse", "HEAD");
    git(work, "push", "-q", "origin", "HEAD:refs/pull/7/head");
    // Eric presses "Squash and merge": main gets one commit, the PR branch is gone.
    git(work, "checkout", "-q", "main");
    git(work, "merge", "-q", "--squash", "platter/2026-11-01");
    git(work, "commit", "-q", "-m", "chore(platter): protected-path changes — 2026-11-01 (#7)");
    git(work, "push", "-q", "origin", "main");
    git(work, "branch", "-q", "-D", "platter/2026-11-01");
    // A fresh clone, as any later session has it: the item's commit is nowhere in it.
    clone = join(root, "clone");
    git(root, "clone", "-q", `file://${origin}`, clone);
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("starts from a clone where the item commit is not in main's history nor the object store", () => {
    expect(() => git(clone, "cat-file", "-e", `${itemSha}^{commit}`)).toThrow();
    expect(readFileSync(join(clone, "a.txt"), "utf8")).toBe("the item\n");
  });

  it("fetches the PR head, reverts the one item onto a fresh branch off origin/main, and says how to ship it", () => {
    const r = ship(clone, "7", itemSha.slice(0, 7));
    expect(r.stderr).toBe("");
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(`revert/platter-7-${itemSha.slice(0, 7)}`);
    expect(r.stdout).toContain("scripts/ship.sh open");
    expect(git(clone, "rev-parse", "--abbrev-ref", "HEAD")).toBe(
      `revert/platter-7-${itemSha.slice(0, 7)}`,
    );
    expect(readFileSync(join(clone, "a.txt"), "utf8")).toBe("base\n");
    expect(readFileSync(join(clone, "b.txt"), "utf8")).toBe("base\n");
    expect(git(clone, "log", "-1", "--format=%s")).toBe('Revert "fix(ci): the item"');
    expect(git(clone, "rev-parse", "HEAD~1")).toBe(git(clone, "rev-parse", "origin/main"));
    expect(git(clone, "rev-parse", "HEAD~1")).not.toBe(baseSha);
  });

  it("refuses a sha that is not one of that PR's commits — the ledger names the platter's own items", () => {
    // The squash commit on main is not reachable from the PR's head; the base commit is.
    const squash = git(clone, "rev-parse", "origin/main");
    expect(squash).not.toBe(baseSha);
    const r = ship(clone, "7", squash);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("is not on #7's head");
    expect(git(clone, "status", "--short")).toBe("");
  });

  it("refuses a PR whose head ref does not exist, naming the ref it tried", () => {
    const r = ship(clone, "99", itemSha);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("refs/pull/99/head could not be fetched");
  });

  it("refuses without a PR number or a sha", () => {
    expect(ship(clone, "seven", itemSha).code).toBe(1);
    expect(ship(clone, "7").code).toBe(1);
  });
});
