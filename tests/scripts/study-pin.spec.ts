import { describe, expect, it } from "@rstest/core";
import { pick } from "../../scripts/study/compat.mjs";
import {
  cloneAttempts,
  installVerdict,
  isHarnessPath,
  overlayManifest,
  pinArgs,
  prepareVerdict,
  removeVerdict,
  strayChanges,
  uncommittedHarness,
  worktreesFrom,
} from "../../scripts/study/pin-plan.mjs";

/**
 * A pinned study run (#4943) happens in a worktree AT an older commit with only today's harness
 * overlaid (scripts/study/pin.mjs). pin.mjs touches git and the disk; every decision it acts on
 * is made by these pure functions — which commit, which directory, what was overlaid, how the
 * install is copied, and whether a directory may be created, reused or removed.
 */

const SHA = "afb76b6f68e6f156b21c234a60d78dafdbb1e55d";
const file = (path: string, sha256 = "a".repeat(64)) => ({ path, sha256 });

describe("pinArgs — the command line", () => {
  it("parses prepare with a commit and an absolute directory, in either order", () => {
    expect(pinArgs(["prepare", "--commit", SHA, "--dir", "/tmp/pin"])).toEqual({
      command: "prepare",
      commit: SHA,
      dir: "/tmp/pin",
    });
    expect(pinArgs(["prepare", "--dir", "/tmp/pin/", "--commit", "AFB76B6F"])).toEqual({
      command: "prepare",
      commit: "afb76b6f",
      dir: "/tmp/pin",
    });
  });

  it("parses remove with a directory only", () => {
    expect(pinArgs(["remove", "--dir", "/tmp/pin"])).toEqual({
      command: "remove",
      dir: "/tmp/pin",
    });
    expect(() => pinArgs(["remove", "--dir", "/tmp/pin", "--commit", SHA])).toThrow(/--dir only/);
  });

  it("refuses a ref where a sha belongs, so a pin cannot move under a run", () => {
    expect(() => pinArgs(["prepare", "--commit", "main", "--dir", "/tmp/pin"])).toThrow(/hex sha/);
    expect(() => pinArgs(["prepare", "--commit", "abc12", "--dir", "/tmp/pin"])).toThrow(/hex sha/);
  });

  it("refuses a relative or root directory, a missing value, an unknown flag or command", () => {
    expect(() => pinArgs(["prepare", "--commit", SHA, "--dir", "pin"])).toThrow(/absolute/);
    expect(() => pinArgs(["remove", "--dir", "/"])).toThrow(/root/);
    expect(() => pinArgs(["prepare", "--commit", "--dir", "/tmp/pin"])).toThrow(/needs a value/);
    expect(() => pinArgs(["prepare", "--commit", SHA])).toThrow(/--dir is required/);
    expect(() => pinArgs(["prepare", "--dir", "/tmp/pin"])).toThrow(/needs --commit/);
    expect(() => pinArgs(["prepare", "--sha", SHA, "--dir", "/tmp/pin"])).toThrow(/unknown flag/);
    expect(() => pinArgs(["run", "--dir", "/tmp/pin"])).toThrow(/usage/);
    expect(() => pinArgs(["remove", "--dir", "/a", "--dir", "/b"])).toThrow(/twice/);
  });
});

describe("isHarnessPath — what the overlay may carry", () => {
  it("takes files under scripts/study/ and nothing else", () => {
    expect(isHarnessPath("scripts/study/parity.mjs")).toBe(true);
    expect(isHarnessPath("scripts/study/worlds/inputs/no-account.json")).toBe(true);
    expect(isHarnessPath("scripts/crawl/steps.mjs")).toBe(false);
    expect(isHarnessPath("src/server/app-shell-routes.ts")).toBe(false);
    expect(isHarnessPath("scripts/study/")).toBe(false);
  });

  it("never a path that climbs out, and never OS litter", () => {
    expect(isHarnessPath("scripts/study/../../src/x.ts")).toBe(false);
    expect(isHarnessPath("scripts/study//x.mjs")).toBe(false);
    expect(isHarnessPath("scripts/study/worlds/.DS_Store")).toBe(false);
  });
});

describe("overlayManifest — the record of what was overlaid", () => {
  it("sorts by path and hashes the tree, independent of the order files were found in", () => {
    const a = overlayManifest([
      file("scripts/study/b.mjs", "1".repeat(64)),
      file("scripts/study/a.mjs"),
    ]);
    const b = overlayManifest([
      file("scripts/study/a.mjs"),
      file("scripts/study/b.mjs", "1".repeat(64)),
    ]);
    expect(a.files.map((f) => f.path)).toEqual(["scripts/study/a.mjs", "scripts/study/b.mjs"]);
    expect(a.tree).toBe(b.tree);
    expect(a.tree).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes the tree hash when any file's bytes change", () => {
    const before = overlayManifest([file("scripts/study/a.mjs", "1".repeat(64))]);
    const after = overlayManifest([file("scripts/study/a.mjs", "2".repeat(64))]);
    expect(after.tree).not.toBe(before.tree);
  });

  it("refuses anything outside the harness, a duplicate, or nothing at all", () => {
    expect(() => overlayManifest([file("src/server/x.ts")])).toThrow(/not harness files: src/);
    expect(() =>
      overlayManifest([file("scripts/study/a.mjs"), file("scripts/study/a.mjs")]),
    ).toThrow(/twice/);
    expect(() => overlayManifest([])).toThrow(/empty/);
  });
});

describe("cloneAttempts — the pin's own install", () => {
  it("tries an APFS clone, then a reflink, then a plain copy — never a symlink", () => {
    const tries = cloneAttempts("/repo/node_modules", "/pin/node_modules");
    expect(tries).toEqual([
      ["cp", "-cR", "/repo/node_modules", "/pin/node_modules"],
      ["cp", "-R", "--reflink=auto", "/repo/node_modules", "/pin/node_modules"],
      ["cp", "-R", "/repo/node_modules", "/pin/node_modules"],
    ]);
    expect(tries.flat().some((arg) => arg === "ln" || arg === "-s")).toBe(false);
  });
});

describe("installVerdict — may the pin get this install?", () => {
  const real = { exists: true, link: false };
  const link = { exists: true, link: true };
  const none = { exists: false, link: false };

  it("clones a real install into a pin that has none, and keeps one already there", () => {
    expect(installVerdict(real, none)).toEqual({ action: "clone" });
    expect(installVerdict(real, real)).toEqual({ action: "keep" });
  });

  it("never clones FROM a symlink — cp -R would copy the link, sharing the install it points at", () => {
    expect(installVerdict(link, none)).toMatchObject({ action: "refuse", why: /symlink/ });
  });

  it("refuses a pin whose install is a link, and a checkout with nothing to clone", () => {
    expect(installVerdict(real, link)).toMatchObject({ action: "refuse", why: /rm, not rm -r/ });
    expect(installVerdict(none, none)).toMatchObject({ action: "refuse", why: /none to clone/ });
  });
});

describe("prepareVerdict — may prepare use this directory?", () => {
  it("creates a missing directory", () => {
    expect(prepareVerdict({ exists: false }, SHA)).toEqual({ action: "create" });
  });

  const madePin = { exists: true, worktreeHead: SHA, hasPinRecord: true, stray: [] };

  it("reuses a pin it made that is still exactly the commit, so a re-run is cheap", () => {
    expect(prepareVerdict({ ...madePin, worktreeHead: SHA.toUpperCase() }, SHA)).toEqual({
      action: "reuse",
    });
  });

  it("refuses a worktree at another commit, or a directory that is not a worktree", () => {
    const other = prepareVerdict({ ...madePin, worktreeHead: "c1818d0e1f1e24bb" }, SHA);
    expect(other).toEqual({ action: "refuse", why: "it is a worktree at c1818d0e1f1e" });
    expect(prepareVerdict({ exists: true }, SHA)).toMatchObject({ action: "refuse" });
  });

  it("never overlays the main or the running checkout, even at the pin's commit", () => {
    expect(prepareVerdict({ ...madePin, isMain: true }, SHA)).toEqual({
      action: "refuse",
      why: "it is the repo's main checkout",
    });
    expect(prepareVerdict({ ...madePin, isSelf: true }, SHA)).toEqual({
      action: "refuse",
      why: "it is the checkout running this command",
    });
  });

  it("refuses a worktree at the commit that pin.mjs did not make", () => {
    expect(prepareVerdict({ ...madePin, hasPinRecord: false }, SHA)).toMatchObject({
      action: "refuse",
      why: /no \.study-pin\.json/,
    });
  });

  it("refuses a pin whose code was changed outside the harness — it is no longer the commit", () => {
    expect(prepareVerdict({ ...madePin, stray: ["src/server/x.ts"] }, SHA)).toMatchObject({
      action: "refuse",
      why: /no longer the commit: src\/server\/x\.ts/,
    });
  });
});

describe("strayChanges / uncommittedHarness — reading `git status --porcelain -z`", () => {
  const z = (...entries: string[]) => `${entries.join("\0")}\0`;

  it("ignores the harness and prepare's own output, and names anything else", () => {
    const status = z(
      " M scripts/study/parity.mjs",
      "?? scripts/study/new.mjs",
      "?? .study-pin.json",
      "?? .study-run/parity.txt",
      " M src/server/app-shell-routes.ts",
      "?? app/src/scratch.ts",
    );
    expect(strayChanges(status)).toEqual(["src/server/app-shell-routes.ts", "app/src/scratch.ts"]);
    expect(strayChanges("")).toEqual([]);
  });

  it("names a rename by its new path and skips the source field -z puts after it", () => {
    expect(strayChanges(z("R  src/new.ts", "src/old.ts"))).toEqual(["src/new.ts"]);
  });

  it("counts every harness file that differs from the commit — edited, untracked or ignored", () => {
    const status = z(
      " M scripts/study/parity.mjs",
      "?? scripts/study/new.mjs",
      "!! scripts/study/local.json",
      "!! scripts/study/.DS_Store",
    );
    expect(uncommittedHarness(status)).toBe(3);
    expect(uncommittedHarness("")).toBe(0);
  });
});

describe("removeVerdict — may remove delete this directory?", () => {
  const pinned = { registered: true, isMain: false, isSelf: false, hasPinRecord: true };

  it("removes a worktree pin.mjs made", () => {
    expect(removeVerdict(pinned)).toEqual({ ok: true });
  });

  it("refuses the main checkout, the running checkout, a stranger, and an unrecorded worktree", () => {
    expect(removeVerdict({ ...pinned, isMain: true })).toMatchObject({ ok: false });
    expect(removeVerdict({ ...pinned, isSelf: true })).toMatchObject({ ok: false });
    expect(removeVerdict({ ...pinned, registered: false })).toMatchObject({ ok: false });
    expect(removeVerdict({ ...pinned, hasPinRecord: false })).toEqual({
      ok: false,
      why: "it has no .study-pin.json — pin.mjs did not make it",
    });
  });
});

describe("worktreesFrom — `git worktree list --porcelain`", () => {
  it("maps each worktree to its HEAD and marks the first as the main checkout", () => {
    const porcelain = [
      "worktree /repo\nHEAD 1111111111111111111111111111111111111111\nbranch refs/heads/main\n",
      `worktree /private/tmp/pin\nHEAD ${SHA}\ndetached\n`,
      "worktree /repo/.claude/worktrees/x\nHEAD 2222222222222222222222222222222222222222\nbranch refs/heads/x\n",
    ].join("\n");
    const trees = worktreesFrom(porcelain);
    expect(trees.get("/repo")).toEqual({ head: "1".repeat(40), main: true });
    expect(trees.get("/private/tmp/pin")).toEqual({ head: SHA, main: false });
    expect(trees.get("/repo/.claude/worktrees/x")?.main).toBe(false);
    expect(trees.has("/tmp/pin")).toBe(false);
  });
});

describe("compat pick — the harness's fallback for a helper the pin lacks", () => {
  const ours = () => "harness";
  const theirs = () => "pin";

  it("uses the pin's own export and records no fallback when it has one", () => {
    const into: string[] = [];
    expect(pick({ settle: theirs }, "settle", ours, "why", into)).toBe(theirs);
    expect(into).toEqual([]);
  });

  it("uses the harness's copy and names it when the pin lacks the export or it is not a function", () => {
    const into: string[] = [];
    expect(pick({}, "settle", ours, "not exported here", into)).toBe(ours);
    expect(pick({ settle: 1 }, "settle", ours, "not a function", into)).toBe(ours);
    expect(into).toEqual(["settle: not exported here", "settle: not a function"]);
  });
});
