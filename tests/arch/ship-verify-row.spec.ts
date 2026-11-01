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

  it("falls back to the ✗ line, then to the exit line, and strips colour codes", () => {
    expect(row('\u001b[31m✗ built from abc\u001b[0m\nERROR: "lint" exited with 1.')).toEqual({
      step: "lint",
      error: "✗ built from abc",
    });
    expect(row('ERROR: "test" exited with 2.')).toEqual({
      step: "test",
      error: 'ERROR: "test" exited with 2.'.replace(/"/g, ""),
    });
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
    expect(r.stdout).toContain("verify did not run");
    expect(readFileSync(logged, "utf8")).toBe(rowsBefore);
  }, 60_000);
});
