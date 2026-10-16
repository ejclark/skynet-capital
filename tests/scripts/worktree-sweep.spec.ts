import { describe, expect, it } from "@rstest/core";
import { decide, lockPid, parseWorktrees } from "../../scripts/worktree-sweep.mjs";

// #5548: WHEN a session sweeps `.claude/worktrees/`, the system SHALL remove a worktree only if its
// HEAD is safe on a remote, it has no uncommitted work, and no live process holds its lock —
// and SHALL say why it kept every other one.

/** A finished worktree: clean, old, HEAD in origin/main, no lock. Each case breaks one thing. */
const finished = (over: Record<string, unknown> = {}) => ({
  primary: false,
  current: false,
  lock: null,
  released: false,
  dirty: 0,
  ageMinutes: 600,
  inMain: true,
  onRemote: true,
  patchApplied: false,
  mergedPr: false,
  ...over,
});

describe("decide — merged and clean", () => {
  it("removes a worktree whose HEAD is in origin/main", () => {
    expect(decide(finished())).toMatchObject({
      remove: true,
      reason: "merged",
      via: "in origin/main",
    });
  });

  it("removes one whose HEAD is only on a remote branch (the commits are safe there)", () => {
    const v = decide(finished({ inMain: false }));
    expect(v).toMatchObject({ remove: true, reason: "pushed", via: "on a remote branch" });
  });

  it("removes a squash-merged one when every commit has a patch-equivalent in main", () => {
    const v = decide(finished({ inMain: false, onRemote: false, patchApplied: true }));
    expect(v).toMatchObject({ remove: true, reason: "merged", via: "applied to origin/main" });
  });

  it("removes one whose PR merged at exactly this head (--gh)", () => {
    const v = decide(finished({ inMain: false, onRemote: false, mergedPr: true }));
    expect(v).toMatchObject({ remove: true, reason: "merged", via: "PR merged at this head" });
  });
});

describe("decide — unpushed", () => {
  it("keeps a worktree whose HEAD is in no remote branch", () => {
    const v = decide(finished({ inMain: false, onRemote: false }));
    expect(v.remove).toBe(false);
    expect(v.reason).toMatch(/^unpushed/);
  });

  it("keeps one that is ahead of main even though a stale remote ref exists elsewhere", () => {
    // onRemote is the only signal here and it is false: nothing contains this HEAD.
    expect(decide(finished({ inMain: false, onRemote: false, patchApplied: false })).remove).toBe(
      false,
    );
  });
});

describe("decide — dirty", () => {
  it("keeps a merged worktree that has uncommitted changes", () => {
    const v = decide(finished({ dirty: 3 }));
    expect(v.remove).toBe(false);
    expect(v.reason).toBe("dirty (3 uncommitted paths)");
  });

  it("names a single dirty path in the singular", () => {
    expect(decide(finished({ dirty: 1 })).reason).toBe("dirty (1 uncommitted path)");
  });

  it("dirty beats merged, pushed and a released lock", () => {
    const v = decide(finished({ dirty: 1, released: true, lock: { pid: 4242, alive: true } }));
    expect(v.remove).toBe(false);
  });
});

describe("decide — locks", () => {
  it("keeps a worktree whose lock names a live process", () => {
    const v = decide(finished({ lock: { pid: 4242, alive: true } }));
    expect(v).toMatchObject({ remove: false, reason: "live lock (pid 4242)" });
  });

  it("keeps a locked worktree whose reason names no pid — it cannot be checked, so it is live", () => {
    const v = decide(finished({ lock: { pid: null, alive: false } }));
    expect(v.remove).toBe(false);
    expect(v.reason).toMatch(/^locked/);
  });

  it("removes a merged, clean worktree whose lock names a dead process, unlocking it first", () => {
    const v = decide(finished({ lock: { pid: 4242, alive: false } }));
    expect(v).toMatchObject({ remove: true, unlock: true, reason: "merged" });
  });

  it("does not unlock a worktree it is not removing", () => {
    const v = decide(
      finished({ lock: { pid: 4242, alive: false }, inMain: false, onRemote: false }),
    );
    expect(v).toMatchObject({ remove: false, unlock: false });
  });

  it("lets --only waive a live lock for a finished agent only", () => {
    const live = { pid: 4242, alive: true };
    expect(decide(finished({ lock: live, released: true }))).toMatchObject({
      remove: true,
      unlock: true,
    });
    expect(
      decide(finished({ lock: live, released: true, inMain: false, onRemote: false })).remove,
    ).toBe(false);
  });
});

describe("decide — never the wrong worktree", () => {
  it("never removes the primary checkout", () => {
    expect(decide(finished({ primary: true })).remove).toBe(false);
  });

  it("never removes the worktree the command runs in", () => {
    expect(decide(finished({ current: true })).reason).toBe("the worktree this runs in");
  });

  it("keeps a worktree younger than the grace period — a workflow worktree starts clean at main", () => {
    const v = decide(finished({ ageMinutes: 5 }));
    expect(v.remove).toBe(false);
    expect(v.reason).toMatch(/^fresh/);
    expect(decide(finished({ ageMinutes: 5 }), { minAgeMinutes: 0 }).remove).toBe(true);
  });

  it("keeps a worktree whose age cannot be read", () => {
    expect(decide(finished({ ageMinutes: null })).remove).toBe(false);
  });
});

describe("lockPid", () => {
  it.each([
    ["claude agent agent-a0a2 (pid 96 start 278)", 96],
    ["claude agent x (pid 4242)", 4242],
    ["pid=77 held by the harness", 77],
    ["held by someone", null],
    ["", null],
  ])("%s -> %s", (reason, pid) => {
    expect(lockPid(reason)).toBe(pid);
  });
});

describe("parseWorktrees", () => {
  const PORCELAIN = [
    "worktree /repo",
    "HEAD aaaa",
    "branch refs/heads/main",
    "",
    "worktree /repo/.claude/worktrees/agent-1",
    "HEAD bbbb",
    "branch refs/heads/feat/x",
    "locked claude agent agent-1 (pid 96 start 278)",
    "",
    "worktree /repo/.claude/worktrees/wf-2",
    "HEAD cccc",
    "detached",
    "locked",
    "",
    "worktree /repo/.claude/worktrees/gone",
    "HEAD dddd",
    "branch refs/heads/old",
    "prunable gitdir file points to non-existent location",
    "",
  ].join("\n");

  it("reads path, head, branch, detached, lock reason and prunable", () => {
    const [primary, agent, wf, gone] = parseWorktrees(PORCELAIN);
    expect(primary).toMatchObject({ path: "/repo", branch: "main", locked: null });
    expect(agent).toMatchObject({
      branch: "feat/x",
      locked: "claude agent agent-1 (pid 96 start 278)",
    });
    expect(wf).toMatchObject({ detached: true, branch: null, locked: "" });
    expect(gone.prunable).toBe(true);
  });
});
