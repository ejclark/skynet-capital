import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { classifyConflicts, parseArgs } from "../../scripts/stack-sync.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// A stacked child PR still carries its parent's original commits after the parent squash-merges,
// so merging main conflicts on every file both touched (12 files on #7492, 2026-11-12). These specs
// run the real script against real temp repos: a bare origin, a parent PR kept at refs/pull/1/head,
// its squash on main, and `gh` stubbed to answer the PR read.
const SCRIPT = resolve("scripts/stack-sync.mjs");

describe("what each conflicting path resolves to", () => {
  const blobs = (m: Record<string, string | null>) => (p: string) => m[p] ?? null;

  it("keeps ours where main equals the parent, and names the paths that differ", () => {
    const r = classifyConflicts(
      ["a", "b", "gone"],
      blobs({ a: "1", b: "2" }),
      blobs({ a: "1", b: "3" }),
    );
    expect(r.resolve).toEqual([
      { path: "a", how: "ours" },
      { path: "gone", how: "ours" },
    ]);
    expect(r.differ).toEqual([{ path: "b", main: "2", parent: "3" }]);
  });

  it("keeps the child's deletion when the child no longer has the path", () => {
    const r = classifyConflicts(["a"], blobs({ a: "1" }), blobs({ a: "1" }), () => false);
    expect(r.resolve).toEqual([{ path: "a", how: "rm" }]);
  });

  it("parses the parent number and refuses mixed flags", () => {
    expect(parseArgs(["#12", "--push"])).toEqual({ parent: 12, push: true, dryRun: false });
    expect(parseArgs([]).error).toBeTruthy();
    expect(parseArgs(["1", "--push", "--dry-run"]).error).toBeTruthy();
  });
});

function git(cwd: string, ...args: string[]) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: hermeticGitEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

type Edit = Record<string, string | null>; // null deletes the file

/**
 * Base main → parent PR #1 (its own commits) → child branch on top. Main then gets the parent's
 * squash (the parent's final tree as one commit), plus `mainAfter` if given. The clone sits on the
 * child branch, and the gh stub answers #1 as merged (or not).
 */
function fixture(o: {
  parent: Edit;
  child: Edit;
  mainAfter?: Edit;
  merged?: boolean;
  rename?: [string, string];
}) {
  const root = mkdtempSync(join(tmpdir(), "stack-sync-"));
  const origin = join(root, "origin.git");
  const seed = join(root, "seed");
  const clone = join(root, "clone");
  mkdirSync(seed);
  git(root, "init", "-q", "--bare", "-b", "main", origin);
  git(seed, "init", "-q", "-b", "main");
  git(seed, "config", "user.email", "t@example.test");
  git(seed, "config", "user.name", "t");
  git(seed, "remote", "add", "origin", origin);
  const apply = (edit: Edit, msg: string) => {
    for (const [f, v] of Object.entries(edit)) {
      if (v === null) git(seed, "rm", "-q", f);
      else writeFileSync(join(seed, f), `${v}\n`);
    }
    git(seed, "add", "-A");
    git(seed, "commit", "-q", "-m", msg);
  };
  apply({ "a.txt": "a0", "b.txt": "b0", "c.txt": "c0" }, "base");
  const base = git(seed, "rev-parse", "HEAD");
  git(seed, "checkout", "-q", "-b", "parent");
  apply(o.parent, "parent work");
  const parentHead = git(seed, "rev-parse", "HEAD");
  git(seed, "checkout", "-q", "-b", "child");
  if (o.rename) git(seed, "mv", o.rename[0], o.rename[1]);
  apply(o.child, "child work");
  // The squash: main gets the parent's final tree as one commit on top of base.
  git(seed, "checkout", "-q", "main");
  git(seed, "read-tree", "-u", "--reset", parentHead);
  git(seed, "commit", "-q", "-m", "parent (#1)");
  const squash = git(seed, "rev-parse", "HEAD");
  if (o.mainAfter) apply(o.mainAfter, "another PR on main");
  git(seed, "push", "-q", "origin", "main", "child", `${parentHead}:refs/pull/1/head`);
  git(root, "clone", "-q", "-b", "child", origin, clone);
  git(clone, "config", "user.email", "t@example.test");
  git(clone, "config", "user.name", "t");
  const stub = join(root, "bin");
  mkdirSync(stub);
  writeFileSync(
    join(root, "pr.json"),
    JSON.stringify({
      merged: o.merged ?? true,
      merge_commit_sha: squash,
      head: { sha: parentHead },
    }),
  );
  writeFileSync(
    join(stub, "gh"),
    `#!/usr/bin/env bash\necho "$*" >> "${root}/gh-calls"\ncat "${root}/pr.json"\n`,
  );
  chmodSync(join(stub, "gh"), 0o755);
  return { root, clone, origin, stub, base };
}

function run(f: { clone: string; stub: string }, ...args: string[]) {
  return spawnSync("node", [SCRIPT, "1", ...args], {
    cwd: f.clone,
    encoding: "utf8",
    env: hermeticGitEnv({ GH_BIN: join(f.stub, "gh") }),
  });
}

const read = (clone: string, f: string) => readFileSync(join(clone, f), "utf8").trim();
const mergeInProgress = (clone: string) => existsSync(join(clone, ".git", "MERGE_HEAD"));

describe("syncing a stacked child after its parent squash-merged", () => {
  it("merges cleanly when the child never touched the parent's files", () => {
    const f = fixture({
      parent: { "a.txt": "a1" },
      child: { "c.txt": "c2" },
      mainAfter: { "d.txt": "d" },
    });
    const r = run(f);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("cleanly");
    expect(read(f.clone, "a.txt")).toBe("a1");
    expect(read(f.clone, "c.txt")).toBe("c2");
    expect(read(f.clone, "d.txt")).toBe("d");
    expect(git(f.clone, "rev-list", "--count", "HEAD..origin/main")).toBe("0");
    expect(readFileSync(join(f.root, "gh-calls"), "utf8")).toContain(
      "repos/ejclark/skynet-capital/pulls/1",
    );
  });

  it("resolves every conflict to the child when main's copy is the parent's final copy", () => {
    const f = fixture({
      parent: { "a.txt": "a1", "b.txt": "b1" },
      child: { "a.txt": "a2", "b.txt": "b2" },
    });
    const r = run(f);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("2 conflict(s)");
    expect(read(f.clone, "a.txt")).toBe("a2");
    expect(read(f.clone, "b.txt")).toBe("b2");
    expect(git(f.clone, "status", "--porcelain")).toBe("");
    expect(git(f.clone, "rev-list", "--count", "HEAD..origin/main")).toBe("0");
    expect(mergeInProgress(f.clone)).toBe(false);
  });

  it("aborts and names the path main changed after the parent's head", () => {
    const f = fixture({
      parent: { "a.txt": "a1", "b.txt": "b1" },
      child: { "a.txt": "a2", "b.txt": "b2" },
      mainAfter: { "b.txt": "b-other" },
    });
    const before = git(f.clone, "rev-parse", "HEAD");
    const r = run(f);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("NOT mechanical");
    expect(r.stdout).toContain("b.txt");
    expect(r.stdout).not.toMatch(/^\s+a\.txt:/m);
    expect(git(f.clone, "rev-parse", "HEAD")).toBe(before);
    expect(mergeInProgress(f.clone)).toBe(false);
    expect(git(f.clone, "status", "--porcelain")).toBe("");
  });

  it("keeps the child's rename when main modified the old path to the parent's copy", () => {
    const f = fixture({
      parent: { "a.txt": "a1" },
      rename: ["a.txt", "renamed.txt"],
      child: { "renamed.txt": "something else entirely, rewritten by the child" },
    });
    const r = run(f);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("keep deletion: a.txt");
    expect(existsSync(join(f.clone, "a.txt"))).toBe(false);
    expect(read(f.clone, "renamed.txt")).toContain("rewritten by the child");
    expect(git(f.clone, "status", "--porcelain")).toBe("");
  });

  it("refuses a dirty working tree before touching anything", () => {
    const f = fixture({ parent: { "a.txt": "a1" }, child: { "a.txt": "a2" } });
    writeFileSync(join(f.clone, "c.txt"), "uncommitted\n");
    const r = run(f);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("uncommitted changes");
    expect(existsSync(join(f.root, "gh-calls"))).toBe(false);
  });

  it("refuses when the parent has not merged", () => {
    const f = fixture({ parent: { "a.txt": "a1" }, child: { "a.txt": "a2" }, merged: false });
    const before = git(f.clone, "rev-parse", "HEAD");
    const r = run(f);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("not merged");
    expect(git(f.clone, "rev-parse", "HEAD")).toBe(before);
  });

  it("dry run reports the plan and commits nothing", () => {
    const f = fixture({ parent: { "a.txt": "a1" }, child: { "a.txt": "a2" } });
    const before = git(f.clone, "rev-parse", "HEAD");
    const r = run(f, "--dry-run");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("dry run");
    expect(r.stdout).toContain("keep ours: a.txt");
    expect(git(f.clone, "rev-parse", "HEAD")).toBe(before);
    expect(mergeInProgress(f.clone)).toBe(false);
  });

  it("pushes the synced branch with --push, and says the local verify was skipped", () => {
    const f = fixture({ parent: { "a.txt": "a1" }, child: { "a.txt": "a2" } });
    const r = run(f, "--push");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--no-verify");
    expect(git(f.origin, "rev-parse", "child")).toBe(git(f.clone, "rev-parse", "HEAD"));
  });

  it("refuses on main", () => {
    const f = fixture({ parent: { "a.txt": "a1" }, child: { "a.txt": "a2" } });
    git(f.clone, "checkout", "-q", "main");
    const r = run(f);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("on main");
  });
});
