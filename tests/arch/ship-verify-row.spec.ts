import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

/**
 * A FAILED VERIFY ROW SAYS WHY (#6470). ship.sh appends one row per local verify to the meter's
 * log; a row that only said ok=false left the meter unable to name what agents get wrong first.
 * The fields are read from the verify log run-p wrote: the step from its `ERROR: "x" exited with`
 * line, the error from the first compiler or test failure line, both scrubbed to stay JSON.
 */
describe("ship verifyrow — the failed step and first error line of a verify log", () => {
  let dir: string;
  const row = (text: string) => {
    const log = join(dir, `${Math.random().toString(36).slice(2)}.log`);
    writeFileSync(log, text);
    // A placeholder token: ship.sh's guard stops before any subcommand on a runner with no token,
    // and verifyrow only reads the log (tests/support/ship-run.ts does the same).
    const out = execFileSync("bash", ["scripts/ship.sh", "verifyrow", log], {
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: "test-token-never-used" },
    });
    return JSON.parse(`{${out.trim()}}`);
  };
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-verifyrow-"));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("names run-p's failed step and prefers a compiler error over an advisory ✗", () => {
    expect(
      row(
        [
          "> skynet-capital@1.0.0 verify",
          "✗ dependency-graph debt grew: 20 > budget 2.",
          "src/x.ts(3,5): error TS2322: Type \"a\" is not assignable \\ to type 'b'.",
          'ERROR: "typecheck:app" exited with 1.',
        ].join("\n"),
      ),
    ).toEqual({
      step: "typecheck:app",
      error: "src/x.ts(3,5): error TS2322: Type a is not assignable  to type 'b'.",
    });
  });

  // #6677: a passing spec printed this warning on purpose, and the first-`Error:` read named it as
  // the failure of a run whose real failure was tests/arch/architecture-pages.spec.ts.
  const passingWarning = [
    "warn | tests/insights.spec.ts > listener > survives a full disk",
    "Warning: [insights-listener] decisions write failed: Error: disk full",
  ];

  it("names the failing spec from rstest's summary, never a line a passing spec printed", () => {
    expect(
      row(
        [
          "  Rstest v0.12.5",
          " \u001b[31m✗\u001b[0m tests/arch/architecture-pages.spec.ts (1)",
          ...passingWarning,
          " ✓ tests/insights.spec.ts (4)",
          "Summary of all failing tests:",
          // Byte for byte as rstest 0.12 colours it into a log.
          "\u001b[41m\u001b[37m\u001b[1m FAIL \u001b[22m\u001b[39m\u001b[49m \u001b[90mtests/arch/\u001b[39m" +
            "\u001b[36marchitecture-pages.spec.ts\u001b[39m \u001b[2m>\u001b[22m pages > are fresh",
          "AssertionError: expected 'old' to be 'new' // Object.is equality",
          'ERROR: "test" exited with 1.',
        ].join("\n"),
      ),
    ).toEqual({
      step: "test",
      error: "FAIL tests/arch/architecture-pages.spec.ts > pages > are fresh",
    });
  });

  it("reads the report rstest prints under an agent the same way", () => {
    expect(
      row(
        [
          "# Rstest Test Execution Report",
          "## Failures",
          "### [F01] tests/arch/architecture-pages.spec.ts :: pages > are fresh",
          '      "message": "Error: stale",',
          "### [F02] tests/broken.spec.ts",
          'ERROR: "test:app" exited with 1.',
        ].join("\n"),
      ),
    ).toEqual({
      step: "test:app",
      error: "FAIL tests/arch/architecture-pages.spec.ts > pages > are fresh",
    });
  });

  it("names biome's first error diagnostic, skipping a warning, and prefers the failed step's tool", () => {
    expect(
      row(
        [
          "src/a.ts(1,1): error TS2304: Cannot find name 'x'.",
          "src/b.ts:4:7 lint/style/useConst  FIXABLE  ━━━━━━━━━━",
          "",
          "  ! This let declares a variable that is only assigned once.",
          "src/c.ts:2:20 lint/suspicious/noDoubleEquals  FIXABLE  ━━━━━━━━━━",
          "",
          "  × Using == may be unsafe if you are relying on type coercion.",
          'ERROR: "lint" exited with 1.',
        ].join("\n"),
      ),
    ).toEqual({ step: "lint", error: "src/c.ts:2:20 lint/suspicious/noDoubleEquals" });
  });

  it("leaves the error empty rather than guess from a warning, an advisory ✗ or the exit line", () => {
    expect(
      row(
        [
          ...passingWarning,
          "\u001b[31m✗ built from abc\u001b[0m",
          'ERROR: "test" exited with 2.',
        ].join("\n"),
      ),
    ).toEqual({ step: "test", error: "" });
    expect(row("nothing useful")).toEqual({ step: "", error: "" });
  });
});

/**
 * The wiring: a real `ship open` whose stubbed verify fails writes the row with both fields. The
 * fake origin's path carries "skynet-capital" so ship's own-repo check lets the row through, and
 * AGENT_RUNS_DIR points the log at this spec's folder.
 */
describe("ship open — a failed local verify lands in the meter's log with its cause", () => {
  let dir: string;
  let work: string;
  const env = () =>
    hermeticGitEnv({
      GH_TOKEN: "test-token-never-used",
      PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`,
      AGENT_RUNS_DIR: join(dir, "runs"),
    });
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: work, encoding: "utf8", env: env(), stdio: "pipe" }).trim();

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-verify-row-"));
    work = join(dir, "work");
    mkdirSync(join(dir, "bin"));
    writeFileSync(join(dir, "bin", "npx"), "#!/bin/sh\ncat >/dev/null\nexit 0\n");
    writeFileSync(
      join(dir, "bin", "npm"),
      '#!/bin/sh\necho "src/x.ts(3,5): error TS2322: boom"\necho \'ERROR: "typecheck:app" exited with 1.\'\nexit 1\n',
    );
    chmodSync(join(dir, "bin", "npx"), 0o755);
    chmodSync(join(dir, "bin", "npm"), 0o755);
    const origin = join(dir, "skynet-capital-origin.git");
    execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin], {
      env: env(),
      stdio: "pipe",
    });
    mkdirSync(work);
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    git(["config", "commit.gpgsign", "false"]);
    git(["remote", "add", "origin", origin]);
    symlinkSync(resolve("scripts"), join(work, "scripts"));
    writeFileSync(join(work, ".git", "info", "exclude"), "scripts\n");
    writeFileSync(join(work, "seed.txt"), "seed\n");
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "chore: seed"]);
    git(["push", "-q", "origin", "main"]);
    git(["checkout", "-q", "-b", "feature"]);
    writeFileSync(join(work, "feature.txt"), "feature\n");
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "feat: the branch's own work"]);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("writes ok=false with the step and the first error line", () => {
    const body = join(dir, "body.md");
    writeFileSync(body, "## The picture\n\nPicture: waived — spec\n\n## Summary\n\n- spec\n");
    let code = 0;
    try {
      execFileSync(
        "bash",
        [resolve("scripts/ship.sh"), "open", "test: spec", "--body-file", body],
        {
          cwd: work,
          env: env(),
          stdio: "pipe",
        },
      );
    } catch (error) {
      code = (error as { status?: number }).status ?? -1;
    }
    expect(code).toBe(1);
    const rows = readFileSync(join(dir, "runs", "ship-verify.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ok: false,
      branch: "feature",
      step: "typecheck:app",
      error: "src/x.ts(3,5): error TS2322: boom",
    });
  });

  it("does not call a queue timeout a failed verify: exit 75, no row, and it says what happened", async () => {
    const logged = join(dir, "runs", "ship-verify.jsonl");
    const rowsBefore = readFileSync(logged, "utf8");
    const queued = { ...env(), SKYNET_VERIFY_LOCKED: "" };
    const inside = join(dir, "holding");
    const holder = spawn(
      "bash",
      ["scripts/verify-locked.sh", "--", "sh", "-c", `: > "${inside}"; sleep 60`],
      { cwd: work, env: queued, detached: true, stdio: "ignore" },
    );
    const deadline = performance.now() + 30_000;
    while (!existsSync(inside) && performance.now() < deadline) {
      await new Promise((r) => setTimeout(r, 25));
    }
    const r = spawnSync(
      "bash",
      [resolve("scripts/ship.sh"), "open", "test: spec", "--body-file", join(dir, "body.md")],
      { cwd: work, env: { ...queued, VERIFY_LOCK_WAIT: "0" }, encoding: "utf8" },
    );
    process.kill(-(holder.pid as number), "SIGKILL");
    expect(r.status).toBe(75);
    expect(r.stdout).toContain("no verify result");
    expect(readFileSync(logged, "utf8")).toBe(rowsBefore);
  }, 60_000);

  // #6668: a closed lid slept the laptop 13 minutes into a verify, which then failed on 5 s timeouts
  // its specs passed in seconds afterwards. That run says nothing about the branch, so it is no row.
  it("does not count a verify the machine slept through: exit 75, no row", () => {
    const logged = join(dir, "runs", "ship-verify.jsonl");
    const rowsBefore = readFileSync(logged, "utf8");
    const sleepy = join(dir, "sleepy-bin");
    const wake = join(dir, "waketime");
    mkdirSync(sleepy, { recursive: true });
    writeFileSync(wake, "1793627758\n");
    // macOS's sysctl, and a verify during which the machine slept and woke: the waketime moves.
    writeFileSync(
      join(sleepy, "sysctl"),
      `#!/bin/sh\n[ "$1" = kern.waketime ] || exit 1\necho "kern.waketime: { sec = $(cat "${wake}"), usec = 179693 } Mon Nov  2 07:55:58 2026"\n`,
    );
    writeFileSync(
      join(sleepy, "npm"),
      `#!/bin/sh\n[ "$1 $2" = "run verify" ] && echo 1793628420 > "${wake}"\necho 'ERROR: "test" exited with 1.'\nexit 1\n`,
    );
    chmodSync(join(sleepy, "sysctl"), 0o755);
    chmodSync(join(sleepy, "npm"), 0o755);
    const r = spawnSync(
      "bash",
      [resolve("scripts/ship.sh"), "open", "test: spec", "--body-file", join(dir, "body.md")],
      {
        cwd: work,
        env: { ...env(), PATH: `${sleepy}:${env().PATH}`, SKYNET_VERIFY_LOCKED: "" },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(75);
    expect(r.stderr).toContain("slept");
    expect(r.stdout).toContain("no verify result");
    expect(readFileSync(logged, "utf8")).toBe(rowsBefore);
  }, 60_000);
});
