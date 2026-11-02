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

// #6668: on 2026-11-01 the queue ran three verifies in a row on the 10-core laptop, on battery with a
// game in front, and the third froze it until a hard reboot. The same night a closed lid slept
// another verify for 13 minutes, and it went red on 5 s timeouts its specs then passed in seconds.
// WHEN verify-locked.sh runs a verify on macOS, THEN it SHALL run it at low priority with fewer test
// workers, and say so. WHEN the lid is closed, THEN it SHALL exit 75 before running anything. WHEN a
// verify fails and the machine slept after it started, THEN it SHALL say so and exit 75. WHERE those
// tools are absent (Linux, CI), nothing SHALL change.
//
// No Mac runs these, so taskpolicy, ioreg and sysctl are stubs on PATH that print what the real ones
// print (the issue's brief), and each can fail its spec when the script's real path breaks:
// - taskpolicy hands its clamp to the program it runs, as the real one does by exec'ing it, so a
//   verify run beside it rather than under it carries no clamp, and `-b` reads as a different one;
// - ioreg prints `"AppleClamshellCausesSleep" = Yes` beside the lid's own line, the line a loose
//   match would take for a closed lid;
// - sysctl's waketime moves only when the verify itself "sleeps", so a script that reads it once,
//   or only after the run, sees no change.

const HELPER = resolve("scripts/verify-locked.sh");
const SLOW_BOX_MS = 60_000;

/** The fixture's verify: it records what it ran under, can "sleep" the machine, and exits as told. */
const VERIFY = [
  `echo "ran clamp=\${STUB_QOS_CLAMP:-none} workers=\${SKYNET_TEST_WORKERS:-unset}" >> "$MARKER"`,
  `if [ -n "\${VERIFY_SLEEPS:-}" ]; then echo 1793628420 > "$STUB_DIR/waketime"; fi`,
  `exit "\${VERIFY_EXIT:-0}"`,
].join("; ");

const STUBS: Record<string, string> = {
  taskpolicy: `#!/bin/sh
echo "taskpolicy $*" >> "$STUB_DIR/calls"
clamp=""
while [ $# -gt 0 ]; do
  case "$1" in
    -c) case "$2" in
          utility|background|maintenance) clamp="$2" ;;
          *) echo "taskpolicy: invalid clamp $2" >&2; exit 64 ;;
        esac
        shift 2 ;;
    -b) clamp="darwinbg"; shift ;;
    -*) echo "taskpolicy: unknown option $1" >&2; exit 64 ;;
    *) break ;;
  esac
done
[ $# -gt 0 ] || { echo "usage: taskpolicy [-c clamp] [-b] program" >&2; exit 64; }
STUB_QOS_CLAMP="$clamp" exec "$@"
`,
  ioreg: `#!/bin/sh
echo "ioreg $*" >> "$STUB_DIR/calls"
case " $* " in *" -k AppleClamshellState "*) ;; *) exit 0 ;; esac
lid=$(cat "$STUB_DIR/lid")
cat <<EOF
+-o IOPMrootDomain  <class IOPMrootDomain, id 0x100000213, registered, matched, active, busy 0 (0 ms), retain 213>
  | {
  |   "AppleClamshellCausesSleep" = Yes
  |   "AppleClamshellState" = $lid
  |   "SleepDisabled" = No
  | }
  |
EOF
# The rest of the tree, well past a pipe's buffer: a reader that stops at the lid's line kills this
# writer with SIGPIPE, and under pipefail that death must not read as "no lid line".
i=0
while [ $i -lt 4000 ]; do
  echo "  +-o IOPMPowerSource  <class IOPMPowerSource, id 0x1000002$i, registered, matched, active>"
  i=$((i + 1))
done
`,
  sysctl: `#!/bin/sh
echo "sysctl $*" >> "$STUB_DIR/calls"
n=""; [ "$1" = "-n" ] && { n=1; shift; }
case "$1" in
  kern.waketime)
    line="{ sec = $(cat "$STUB_DIR/waketime"), usec = 179693 } Mon Nov  2 07:55:58 2026"
    if [ -n "$n" ]; then echo "$line"; else echo "kern.waketime: $line"; fi ;;
  *) echo "sysctl: unknown oid '$1'" >&2; exit 1 ;;
esac
`,
};

/** A bin folder holding the three Mac tools as stubs, with the lid open and no sleep yet. */
function macTools(stubDir: string) {
  const bin = join(stubDir, "bin");
  mkdirSync(bin, { recursive: true });
  for (const [name, body] of Object.entries(STUBS)) {
    writeFileSync(join(bin, name), body, { mode: 0o755 });
  }
  writeFileSync(join(stubDir, "lid"), "No\n");
  writeFileSync(join(stubDir, "waketime"), "1793627758\n");
  writeFileSync(join(stubDir, "calls"), "");
  return bin;
}

/** A PATH holding only these binaries, so a Mac running this spec cannot lend it its real tools. */
function bareBin(...names: string[]) {
  const bin = mkdtempSync(join(tmpdir(), "verify-laptop-bare-"));
  for (const name of ["bash", "sh", "git", "cat", "true", ...names]) {
    const found = spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
    if (found) symlinkSync(found, join(bin, name));
  }
  return bin;
}

function laptop({ mac = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "verify-laptop-"));
  const stubDir = `${dir}.stubs`;
  mkdirSync(stubDir);
  const bin = mac ? macTools(stubDir) : bareBin("flock", "perl", "sleep");
  const env: NodeJS.ProcessEnv = hermeticGitEnv({
    MARKER: `${dir}.runs`,
    STUB_DIR: stubDir,
    SKYNET_VERIFY_LOCKED: "",
    VERIFY_LOCK_WAIT: "30",
    PATH: mac ? `${bin}:${process.env.PATH ?? ""}` : bin,
  });
  // A verify on the laptop runs this spec with its own cap set; the fixture starts from none.
  delete env.SKYNET_TEST_WORKERS;
  delete env.STUB_QOS_CLAMP;
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, env, stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  mkdirSync(join(dir, "scripts"));
  copyFileSync(HELPER, join(dir, "scripts", "verify-locked.sh"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { verify: VERIFY } }));
  writeFileSync(env.MARKER as string, "");
  git("add", "-A");
  git("commit", "-qm", "init");

  const args = (cmd: "npm" | "sh") => (cmd === "npm" ? [] : ["--", "sh", "-c", VERIFY]);
  const run = (extra: Record<string, string> = {}, cmd: "npm" | "sh" = "sh") =>
    spawnSync("bash", ["scripts/verify-locked.sh", ...args(cmd)], {
      cwd: dir,
      encoding: "utf8",
      env: { ...env, ...extra },
    });
  const start = (extra: Record<string, string> = {}) => {
    const child = spawn("bash", ["scripts/verify-locked.sh", ...args("sh")], {
      cwd: dir,
      env: { ...env, ...extra },
    });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    const done = new Promise<{ code: number | null; stderr: string }>((ok) =>
      child.on("close", (code) => ok({ code, stderr })),
    );
    return { done, stderr: () => stderr };
  };
  const runs = () =>
    readFileSync(env.MARKER as string, "utf8")
      .split("\n")
      .filter(Boolean);
  const calls = () => readFileSync(join(stubDir, "calls"), "utf8");
  const lid = (state: "Yes" | "No") => writeFileSync(join(stubDir, "lid"), `${state}\n`);
  return { dir, env, run, start, runs, calls, lid };
}

/** Holds the queue until killed, and returns only once it is inside the lock. */
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
  return () => {
    try {
      process.kill(-(child.pid as number), "SIGKILL");
    } catch {
      // already gone
    }
  };
}

async function until(check: () => boolean, what: string) {
  const deadline = performance.now() + SLOW_BOX_MS / 2;
  while (!check()) {
    if (performance.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

describe("verify-locked on a Mac — low priority and fewer test workers", () => {
  it("runs the verify under the utility clamp, which keeps the performance cores, and says so", () => {
    const { run, runs, calls } = laptop();
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("low priority");
    // Not `-b`: background work runs on the efficiency cores only, too slow for an idle machine.
    expect(runs()).toEqual([expect.stringContaining("ran clamp=utility ")]);
    expect(calls()).toContain("taskpolicy -c utility ");
  });

  it("caps each test runner below what a 10-core laptop starts on its own", () => {
    const { run, runs } = laptop();
    expect(run().status).toBe(0);
    const workers = Number(/workers=(\S+)/.exec(runs()[0] ?? "")?.[1]);
    // Each runner starts one worker per core but one by default: 9 on the 10-core laptop.
    expect(Number.isInteger(workers) && workers >= 1 && workers < 9).toBe(true);
  });

  it("keeps a cap someone set by hand, so the number can be tried without an edit", () => {
    const { run, runs } = laptop();
    expect(run({ SKYNET_TEST_WORKERS: "5" }).status).toBe(0);
    expect(runs()).toEqual([expect.stringContaining("workers=5")]);
  });

  it("does the same for the default npm run verify, and keeps the verify's own exit code", () => {
    const { run, runs } = laptop();
    expect(run({ VERIFY_EXIT: "3" }, "npm").status).toBe(3);
    expect(runs()).toEqual([expect.stringMatching(/clamp=utility workers=\d+$/)]);
  });
});

describe("verify-locked on a Mac — a closed lid", () => {
  it(
    "refuses at once with exit 75 and says why, even while another verify holds the queue",
    async () => {
      const { dir, env, run, runs, lid } = laptop();
      const release = await holdLock(dir, env);
      lid("Yes");
      const began = performance.now();
      const r = run();
      release();
      expect(r.status).toBe(75);
      expect(r.stderr).toContain("lid is closed");
      expect(r.stderr).not.toContain("verify: queued");
      expect(performance.now() - began).toBeLessThan(15_000);
      expect(runs()).toEqual([]);
    },
    SLOW_BOX_MS,
  );

  it(
    "checks again once its turn comes, so a lid closed during the wait still runs nothing",
    async () => {
      const { dir, env, start, runs, lid } = laptop();
      const release = await holdLock(dir, env);
      const second = start();
      await until(() => second.stderr().includes("verify: queued"), "the second verify to queue");
      lid("Yes");
      release();
      const r = await second.done;
      expect(r.code).toBe(75);
      expect(r.stderr).toContain("lid is closed");
      expect(runs()).toEqual([]);
    },
    SLOW_BOX_MS,
  );

  it("reads an open lid as open, though the line beside it says a closed lid causes sleep", () => {
    const { run, runs, calls } = laptop();
    expect(run().status).toBe(0);
    expect(runs()).toHaveLength(1);
    expect(calls()).toContain("ioreg -r -k AppleClamshellState");
  });
});

describe("verify-locked on a Mac — a sleep during the run", () => {
  it("calls a failed verify the machine slept through no result: exit 75, and it says so", () => {
    const { run, runs } = laptop();
    const r = run({ VERIFY_SLEEPS: "1", VERIFY_EXIT: "1" });
    expect(r.status).toBe(75);
    expect(r.stderr).toContain("slept");
    expect(runs()).toHaveLength(1);
  });

  it("keeps a failure's own exit code when the machine stayed awake", () => {
    const { run } = laptop();
    const r = run({ VERIFY_EXIT: "1" });
    expect(r.status).toBe(1);
    expect(r.stderr).not.toContain("slept");
  });

  it("keeps a pass a pass, sleep or not", () => {
    const { run } = laptop();
    expect(run({ VERIFY_SLEEPS: "1" }).status).toBe(0);
  });
});

describe("verify-locked without the Mac tools — Linux and CI", () => {
  it("runs exactly as before: no clamp, no cap, no lid or sleep check, the verify's own exit code", () => {
    const { run, runs } = laptop({ mac: false });
    const r = run({ VERIFY_SLEEPS: "1", VERIFY_EXIT: "1" });
    expect(r.status).toBe(1);
    expect(runs()).toEqual(["ran clamp=none workers=unset"]);
    expect(r.stderr).not.toMatch(/low priority|lid|slept/);
  });

  it("reads a sysctl with no waketime, as Linux has, as no sleep", () => {
    const { run, env } = laptop({ mac: false });
    const bin = (env.PATH as string).split(":")[0] as string;
    writeFileSync(
      join(bin, "sysctl"),
      '#!/bin/sh\necho "sysctl: cannot stat /proc/sys/kern/waketime: No such file or directory" >&2\nexit 1\n',
      { mode: 0o755 },
    );
    const r = run({ VERIFY_SLEEPS: "1", VERIFY_EXIT: "1" });
    expect(r.status).toBe(1);
    expect(r.stderr).not.toContain("slept");
  });
});

describe("verify-locked on a Mac — the queue (#5548) still holds", () => {
  it(
    "runs two verifies started together one after the other",
    async () => {
      const { start, runs } = laptop();
      const both = [start(), start()];
      const results = await Promise.all(both.map((v) => v.done));
      expect(results.map((r) => r.code)).toEqual([0, 0]);
      expect(results.some((r) => r.stderr.includes("verify: queued"))).toBe(true);
      expect(runs()).toHaveLength(2);
    },
    SLOW_BOX_MS,
  );
});

describe("the test runners read the cap", () => {
  // Each runner's config turns SKYNET_TEST_WORKERS into its pool's worker limit, and no cap into
  // rstest's own default; a config that dropped the line would let the laptop start 9 again. The
  // app's suite is about a third of the root's, so it takes half the cap, and never none.
  const pool = (config: string, extra: Record<string, string>) => {
    const env = { ...process.env };
    delete env.SKYNET_TEST_WORKERS;
    Object.assign(env, extra);
    const out = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const m = await import(${JSON.stringify(resolve(config))}); console.log(JSON.stringify(m.default.pool ?? null));`,
      ],
      { encoding: "utf8", env, cwd: resolve(config, ".."), stdio: "pipe" },
    );
    return JSON.parse(out.trim().split("\n").pop() as string);
  };

  const cases = [
    { config: "rstest.config.ts", three: 3, one: 1 },
    { config: "app/rstest.config.ts", three: 1, one: 1 },
  ];
  for (const { config, three, one } of cases) {
    it(
      `${config} takes its worker limit from the cap, and leaves rstest's default without one`,
      () => {
        expect(pool(config, { SKYNET_TEST_WORKERS: "3" })).toMatchObject({ maxWorkers: three });
        expect(pool(config, { SKYNET_TEST_WORKERS: "1" })).toMatchObject({ maxWorkers: one });
        expect(pool(config, {})?.maxWorkers).toBeUndefined();
        expect(pool(config, { SKYNET_TEST_WORKERS: "lots" })?.maxWorkers).toBeUndefined();
      },
      SLOW_BOX_MS,
    );
  }
});
