import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
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

// flock(1) is util-linux, so stock macOS has none, and macOS is where the fan-outs run. #6278 skipped
// the lock specs there to stop them turning verify red, which also hid that the queue was off on that
// machine: load 85 on 2026-11-01, with all 8 verifies ship.sh logged in two hours failing. perl now takes the same lock there, and
// these specs run for each tool a machine has, so "queued" stays true wherever a fan-out runs.
const HAVE = (tool: string) => spawnSync("sh", ["-c", `command -v ${tool}`]).status === 0;

/** A PATH holding only these binaries, so a spec can hide flock or perl whatever this host has. */
function pathWith(...names: string[]) {
  const bin = mkdtempSync(join(tmpdir(), "verify-locked-bin-"));
  for (const name of ["bash", "sh", "git", "cat", "true", ...names]) {
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

const SLOW_BOX_MS = 60_000;

/** Holds the lock until killed, and returns only once it is inside: a fixed sleep flakes under load. */
async function holdLock(dir: string, env: NodeJS.ProcessEnv) {
  const inside = `${dir}.holding`;
  const child = spawn(
    "bash",
    ["scripts/verify-locked.sh", "--", "sh", "-c", `: > "${inside}"; sleep 60`],
    { cwd: dir, env, detached: true, stdio: "ignore" },
  );
  const deadline = performance.now() + SLOW_BOX_MS / 2;
  while (!existsSync(inside)) {
    if (performance.now() > deadline || child.exitCode !== null) {
      throw new Error(`the holder never got inside the lock (exit ${child.exitCode})`);
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  return {
    killShellOnly: () => child.kill("SIGKILL"),
    killAll: () => {
      try {
        process.kill(-(child.pid as number), "SIGKILL");
      } catch {
        // already gone
      }
    },
  };
}

describe("verify-locked — a machine with no way to lock", () => {
  it("runs the verify unlocked and says so, instead of failing", () => {
    const { run } = repo();
    const r = run(["--", "true"], { PATH: pathWith() });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("no flock or perl on this machine");
  });
});

describe("verify-locked — a lock tool that is there but broken", () => {
  it("still runs the verify and says it ran unlocked, rather than reading as a long wait", () => {
    const { run } = repo();
    const bin = pathWith();
    writeFileSync(join(bin, "perl"), "#!/bin/sh\nexit 2\n", { mode: 0o755 });
    const r = run(["--", "true"], { PATH: bin });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("could not take the lock (exit 2)");
    expect(r.stderr).not.toContain("gave up");
  });
});

describe("verify-locked — this machine, whatever it is", () => {
  // Not skipped anywhere, on purpose: a queue that is off where the fan-outs run protects nothing.
  it("takes the lock rather than running unlocked", () => {
    const { run } = repo();
    const r = run(["--", "true"]);
    expect(r.status).toBe(0);
    expect(r.stderr).not.toContain("running unlocked");
  });
});

const LOCK_TOOLS = [
  { tool: "flock", on: HAVE("flock"), path: () => ({}) },
  {
    tool: "perl, where there is no flock",
    on: HAVE("perl"),
    path: () => ({ PATH: pathWith("perl", "sleep") }),
  },
];

for (const { tool, on, path } of LOCK_TOOLS) {
  describe.skipIf(!on)(`verify-locked — one full verify at a time per checkout, ${tool}`, () => {
    it(
      "runs two verifies started together one after the other, and says the second is queued",
      async () => {
        const { dir, env } = repo();
        const both = { ...env, ...path() };
        const log = join(dir, "..", `${dir.split("/").pop()}.order`);
        const body = (n: number) =>
          `echo start${n} >> "${log}"; sleep 0.6; echo end${n} >> "${log}"`;
        const results = await Promise.all([
          startLocked(dir, both, body(1)),
          startLocked(dir, both, body(2)),
        ]);
        expect(results.map((r) => r.code)).toEqual([0, 0]);
        // Serial means each run's start is followed by its own end: start1 end1 start2 end2 (or 2 then 1).
        const order = readFileSync(log, "utf8").split("\n").filter(Boolean);
        const first = order[0]?.slice(-1);
        const second = first === "1" ? "2" : "1";
        expect(order).toEqual([`start${first}`, `end${first}`, `start${second}`, `end${second}`]);
        const queued = results.find((r) => r.stderr.includes("verify: queued"));
        expect(queued?.stderr).toContain("verify: got the lock after");
      },
      SLOW_BOX_MS,
    );

    it(
      "gives up with exit 75 and a clear line when the wait runs out",
      async () => {
        const { dir, env, run } = repo();
        const holder = await holdLock(dir, { ...env, ...path() });
        const r = run(["--", "true"], { ...path(), VERIFY_LOCK_WAIT: "1" });
        holder.killAll();
        expect(r.status).toBe(75);
        expect(r.stderr).toContain("gave up after 1s");
      },
      SLOW_BOX_MS,
    );

    it(
      "takes a wait of zero as try once, not as no limit",
      async () => {
        const { dir, env, run } = repo();
        const holder = await holdLock(dir, { ...env, ...path() });
        const r = run(["--", "true"], { ...path(), VERIFY_LOCK_WAIT: "0" });
        holder.killAll();
        expect(r.status).toBe(75);
      },
      SLOW_BOX_MS,
    );

    it(
      "never waits on its own parent: a run already inside the lock goes straight through",
      async () => {
        const { dir, env, run } = repo();
        const holder = await holdLock(dir, { ...env, ...path() });
        const r = run(["--", "true"], {
          ...path(),
          SKYNET_VERIFY_LOCKED: "1",
          VERIFY_LOCK_WAIT: "1",
        });
        holder.killAll();
        expect(r.status).toBe(0);
      },
      SLOW_BOX_MS,
    );

    it(
      "frees the lock when its holder dies, even with the holder's child still running",
      async () => {
        const { dir, env, run } = repo();
        const holder = await holdLock(dir, { ...env, ...path() });
        holder.killShellOnly();
        // Long enough for a slow box to see the kill land, far short of the holder's 60 s sleep.
        const r = run(["--", "true"], { ...path(), VERIFY_LOCK_WAIT: "30" });
        holder.killAll();
        expect(r.status).toBe(0);
      },
      SLOW_BOX_MS,
    );
  });
}

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
