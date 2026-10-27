import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #5548: parallel worktree agents each ran a full verify, saturating a 4-core session until specs
// timed out. WHEN two full verifies start in one checkout, THEN they SHALL run one after the other.
// WHEN the pre-push hook sees only commits whose tree a green verify already passed in this
// worktree, THEN it SHALL skip the second verify; any other tree SHALL be verified.

const HELPER = resolve("scripts/verify-locked.sh");
const HOOK = resolve(".husky/pre-push");

// #6278: a box with no flock (stock macOS) runs unlocked on purpose, so the lock specs only mean
// something where flock exists — without this guard they failed there and turned verify red.
const HAVE_FLOCK = spawnSync("sh", ["-c", "command -v flock"]).status === 0;

/** A PATH holding only the binaries verify-locked.sh needs — no flock, whatever this host has. */
function pathWithoutFlock() {
  const bin = mkdtempSync(join(tmpdir(), "verify-locked-bin-"));
  for (const name of ["bash", "sh", "git", "cat", "true"]) {
    const found = spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
    symlinkSync(found, join(bin, name));
  }
  return bin;
}

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "verify-locked-"));
  // hermetic: under a git hook GIT_DIR outranks cwd, and the fixture would act on this repo
  const base = hermeticGitEnv();
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", env: base }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  mkdirSync(join(dir, "scripts"));
  copyFileSync(HELPER, join(dir, "scripts", "verify-locked.sh"));
  // `npm run verify` here appends one line to a file OUTSIDE the repo, so a run leaves the tree clean.
  const marker = join(dir, "..", `${dir.split("/").pop()}.runs`);
  writeFileSync(marker, "");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ scripts: { verify: 'echo ran >> "$MARKER" && exit "$VERIFY_EXIT"' } }),
  );
  writeFileSync(join(dir, ".gitignore"), "");
  git("add", "-A");
  git("commit", "-qm", "init");
  const env = { ...base, MARKER: marker, VERIFY_EXIT: "0", SKYNET_VERIFY_LOCKED: "" };
  const run = (args: string[] = [], extra: Record<string, string> = {}, input?: string) =>
    spawnSync("bash", ["scripts/verify-locked.sh", ...args], {
      cwd: dir,
      encoding: "utf8",
      env: { ...env, ...extra },
      input,
    });
  const runs = () => readFileSync(marker, "utf8").split("\n").filter(Boolean).length;
  return { dir, git, env, run, runs };
}

function startLocked(dir: string, env: NodeJS.ProcessEnv, script: string) {
  const child = spawn("bash", ["scripts/verify-locked.sh", "--", "sh", "-c", script], {
    cwd: dir,
    env,
  });
  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d;
  });
  return new Promise<{ code: number | null; stderr: string }>((done) =>
    child.on("close", (code) => done({ code, stderr })),
  );
}

describe("verify-locked — a machine with no flock", () => {
  it("runs the verify unlocked and says so, instead of failing", () => {
    const { run } = repo();
    const r = run(["--", "true"], { PATH: pathWithoutFlock() });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("no flock on this machine");
  });
});

describe.skipIf(!HAVE_FLOCK)("verify-locked — one full verify at a time per checkout", () => {
  it("runs two verifies started together one after the other, and says the second is queued", async () => {
    const { dir, env } = repo();
    const log = join(dir, "..", `${dir.split("/").pop()}.order`);
    const body = (n: number) => `echo start${n} >> "${log}"; sleep 0.6; echo end${n} >> "${log}"`;
    const results = await Promise.all([
      startLocked(dir, env, body(1)),
      startLocked(dir, env, body(2)),
    ]);
    expect(results.map((r) => r.code)).toEqual([0, 0]);
    // Serial means each run's start is followed by its own end: start1 end1 start2 end2 (or 2 then 1).
    const order = readFileSync(log, "utf8").split("\n").filter(Boolean);
    const first = order[0]?.slice(-1);
    const second = first === "1" ? "2" : "1";
    expect(order).toEqual([`start${first}`, `end${first}`, `start${second}`, `end${second}`]);
    expect(results.some((r) => r.stderr.includes("verify: queued"))).toBe(true);
  });

  it("gives up with exit 75 and a clear line when the wait runs out", async () => {
    const { dir, env, run } = repo();
    const holder = startLocked(dir, env, "sleep 2");
    await new Promise((r) => setTimeout(r, 300));
    const r = run(["--", "true"], { VERIFY_LOCK_WAIT: "1" });
    expect(r.status).toBe(75);
    expect(r.stderr).toContain("gave up after 1s");
    await holder;
  });

  it("never waits on its own parent: a run already inside the lock goes straight through", async () => {
    const { dir, env, run } = repo();
    const holder = startLocked(dir, env, "sleep 2");
    await new Promise((r) => setTimeout(r, 300));
    const r = run(["--", "true"], { SKYNET_VERIFY_LOCKED: "1", VERIFY_LOCK_WAIT: "1" });
    expect(r.status).toBe(0);
    await holder;
  });
});

describe("verify-locked — the green-tree stamp", () => {
  it("stamps a clean tree that passed, and a stamped tree skips the next verify", () => {
    const { dir, git, run, runs } = repo();
    expect(run().status).toBe(0);
    expect(readFileSync(join(dir, ".git", "verify-ok"), "utf8").trim()).toBe(
      git("rev-parse", "HEAD^{tree}"),
    );
    const skipped = run(["--skip-if-stamped"]);
    expect(skipped.status).toBe(0);
    expect(skipped.stderr).toContain("verify: skipped");
    expect(runs()).toBe(1);
  });

  it("verifies a tree the stamp does not match — a new commit, or a pushed sha that differs", () => {
    const { dir, git, run, runs } = repo();
    run();
    const first = git("rev-parse", "HEAD");
    writeFileSync(join(dir, "a.txt"), "edit");
    git("add", "a.txt");
    git("commit", "-qm", "edit");
    expect(run(["--skip-if-stamped", first]).stderr).toContain("verify: skipped");
    expect(runs()).toBe(1);
    expect(run(["--skip-if-stamped"]).stderr).not.toContain("skipped");
    expect(runs()).toBe(2);
    git("commit", "-q", "--allow-empty", "-m", "same tree");
    expect(run(["--skip-if-stamped", first, git("rev-parse", "HEAD")]).stderr).not.toContain(
      "skipped",
    );
    expect(runs()).toBe(3);
  });

  it("writes no stamp for a failed verify, a dirty tree, or a command other than npm run verify", () => {
    const { dir, run } = repo();
    const stamp = join(dir, ".git", "verify-ok");
    expect(run([], { VERIFY_EXIT: "1" }).status).toBe(1);
    expect(() => readFileSync(stamp)).toThrow();
    expect(run(["--", "true"]).status).toBe(0);
    expect(() => readFileSync(stamp)).toThrow();
    writeFileSync(join(dir, "untracked.ts"), "export {};");
    expect(run().status).toBe(0);
    expect(() => readFileSync(stamp)).toThrow();
  });
});

describe("the pre-push hook", () => {
  it("skips when every pushed commit has the stamped tree, ignores deletions, and verifies otherwise", () => {
    const { dir, git, env, run, runs } = repo();
    mkdirSync(join(dir, ".husky"));
    copyFileSync(HOOK, join(dir, ".husky", "pre-push"));
    git("add", "-A");
    git("commit", "-qm", "hook");
    run();
    const head = git("rev-parse", "HEAD");
    const zero = "0".repeat(40);
    const hook = (input: string) =>
      spawnSync("sh", [".husky/pre-push"], { cwd: dir, encoding: "utf8", env, input });

    const pushed = hook(`refs/heads/main ${head} refs/heads/main ${zero}\n`);
    expect(pushed.status).toBe(0);
    expect(pushed.stderr).toContain("verify: skipped");
    expect(hook(`(delete) ${zero} refs/heads/old ${head}\n`).stderr).toContain("verify: skipped");
    expect(runs()).toBe(1);

    const parent = git("rev-parse", "HEAD~1");
    expect(hook(`refs/heads/x ${parent} refs/heads/x ${zero}\n`).stderr).not.toContain("skipped");
    expect(runs()).toBe(2);
  });
});
