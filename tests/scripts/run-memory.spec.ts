import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { pause } from "../../scripts/file-lock.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { EMPTY_FILE_HASH } from "../../scripts/run-memory.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

const SCRIPT = resolve("scripts/run-memory.mjs");

function cli(dir: string, ...args: string[]) {
  return spawnSync("node", [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, AGENT_RUNS_DIR: dir },
  });
}

function startRun(dir: string) {
  const res = cli(
    dir,
    "start",
    "bots",
    "--outcome",
    "o",
    "--scope",
    "s",
    "--keep",
    "k",
    "--evidence",
    "e",
    "--approval",
    "a",
  );
  expect(res.status).toBe(0);
  return res.stdout.trim();
}

function attempt(dir: string, run: string, changed?: string) {
  const args = ["attempt", run, "--class", "crash", "--action", "start", "--result", "fell over"];
  if (changed) args.push("--changed", changed);
  return cli(dir, ...args);
}

describe("run memory", () => {
  it("refuses to start a run that has not said what done means", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    expect(cli(dir, "start", "bots", "--outcome", "o").status).toBe(2);
  });

  it("refuses a retry that changes nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    expect(attempt(dir, run, "first image").status).toBe(0);
    expect(attempt(dir, run).status).toBe(4);
    expect(attempt(dir, run, "First Image ").status).toBe(4);
    expect(attempt(dir, run, "newer image").status).toBe(0);
  });

  it("stops a failure class at its budget, even with a new change each time", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    for (const changed of ["a", "b", "c"]) expect(attempt(dir, run, changed).status).toBe(0);
    const fourth = attempt(dir, run, "d");
    expect(fourth.status).toBe(3);
    expect(fourth.stderr).toContain("budget spent");
  });

  it("budgets each failure class apart", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    for (const changed of ["a", "b", "c"]) attempt(dir, run, changed);
    expect(cli(dir, "attempt", run, "--class", "host", "--action", "start").status).toBe(0);
  });

  it("gives a resuming session the contract and every attempt", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    attempt(dir, run, "first image");
    cli(dir, "note", run, "second stop has no cause yet");
    const out = cli(dir, "status", run).stdout;
    expect(out).toContain("**Outcome:** o");
    expect(out).toContain("changed: first image");
    expect(out).toContain("second stop has no cause yet");
  });

  it("gives each agent its own scratch pad", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    const a = cli(dir, "scratch", run, "agent-a").stdout.trim();
    const b = cli(dir, "scratch", run, "agent-b").stdout.trim();
    expect(a).not.toBe(b);
    expect(existsSync(a) && existsSync(b)).toBe(true);
  });

  it("refuses the second of two writers working from the same read", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const [one, two] = [join(dir, "one.md"), join(dir, "two.md")];
    writeFileSync(target, "base\n");
    writeFileSync(one, "from one\n");
    writeFileSync(two, "from two\n");
    const readHash = cli(dir, "hash", target).stdout.trim();

    expect(cli(dir, "promote", one, target, "--read-hash", readHash).status).toBe(0);
    expect(cli(dir, "promote", two, target, "--read-hash", readHash).status).toBe(5);
    expect(readFileSync(target, "utf8")).toBe("from one\n");
  });

  it("lets a writer create a file that did not exist when it read", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const source = join(dir, "new.md");
    const target = join(dir, "nested", "made.md");
    writeFileSync(source, "fresh\n");
    const readHash = cli(dir, "hash", target).stdout.trim();
    expect(cli(dir, "promote", source, target, "--read-hash", readHash).status).toBe(0);
    expect(readFileSync(target, "utf8")).toBe("fresh\n");
  });

  // A large target widens the gap between the check and the rename, which is where writers from the
  // same read used to all pass the check and all rename (20 MB, 20 writers: 16 winners).
  it("lets exactly one of many writers with the same read win", async () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const source = join(dir, "next.md");
    const pad = "x".repeat(20 * 1024 * 1024);
    writeFileSync(target, `${pad}\nbase\n`);
    writeFileSync(source, `${pad}\nnext\n`);
    const readHash = cli(dir, "hash", target).stdout.trim();
    const codes = await Promise.all(
      Array.from(
        { length: 12 },
        () =>
          new Promise<number | null>((done) => {
            spawn("node", [SCRIPT, "promote", source, target, "--read-hash", readHash], {
              stdio: "ignore",
            }).on("close", done);
          }),
      ),
    );
    const winners = codes.filter((code) => code === 0).length;
    const refused = codes.filter((code) => code === 5).length;
    const lockLeft = existsSync(`${target}.lock`);
    rmSync(dir, { recursive: true }); // 40 MB, and the suite runs often.
    expect(winners).toBe(1);
    expect(refused).toBe(11);
    expect(lockLeft).toBe(false);
  }, 60_000);

  it("leaves no lock behind when it refuses", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const source = join(dir, "s.md");
    writeFileSync(target, "base\n");
    writeFileSync(source, "new\n");
    expect(cli(dir, "promote", source, target, "--read-hash", "stale").status).toBe(5);
    expect(existsSync(`${target}.lock`)).toBe(false);
  });

  it("is not blocked forever by a writer killed while holding the lock", async () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const source = join(dir, "s.md");
    writeFileSync(target, "base\n");
    writeFileSync(source, "new\n");
    const holder = spawn("node", [
      "--input-type=module",
      "-e",
      `import { withFileLock } from ${JSON.stringify(resolve("scripts/file-lock.mjs"))};
       withFileLock(${JSON.stringify(`${target}.lock`)}, () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60000));`,
    ]);
    for (let tries = 0; tries < 2000 && !existsSync(`${target}.lock`); tries += 1) pause(5);
    expect(existsSync(`${target}.lock`)).toBe(true);
    await new Promise((done) => {
      holder.on("close", done);
      holder.kill("SIGKILL");
    });
    expect(existsSync(`${target}.lock`)).toBe(true);

    const readHash = cli(dir, "hash", target).stdout.trim();
    expect(cli(dir, "promote", source, target, "--read-hash", readHash).status).toBe(0);
    expect(readFileSync(target, "utf8")).toBe("new\n");
    expect(existsSync(`${target}.lock`)).toBe(false);
  }, 30_000);

  it("gives up with its own exit code while a live writer holds the lock", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const source = join(dir, "s.md");
    writeFileSync(target, "base\n");
    writeFileSync(source, "new\n");
    writeFileSync(`${target}.lock`, `${process.pid} ${Date.now()}\n`);
    const readHash = cli(dir, "hash", target).stdout.trim();
    const res = spawnSync("node", [SCRIPT, "promote", source, target, "--read-hash", readHash], {
      encoding: "utf8",
      env: { ...process.env, AGENT_LOCK_WAIT_MS: "50" },
    });
    expect(res.status).toBe(6);
    expect(readFileSync(target, "utf8")).toBe("base\n");
    expect(existsSync(`${target}.lock`)).toBe(true);
  });

  // A session reads MEMORY.md only to line 200 or 25,000, so past that a promote hides rules. The
  // boundary is the loader's own number, read from the installed harness: the vendor docs' "25KB" reads
  // as 25,600, which is how the 600 bytes a session would cut came to be accepted.
  describe("the memory index's read limit", () => {
    function promoteIndex(body: string, name = "MEMORY.md") {
      const dir = mkdtempSync(join(tmpdir(), "runs-"));
      const source = join(dir, "next.md");
      const target = join(dir, name);
      writeFileSync(source, body);
      return {
        res: cli(dir, "promote", source, target, "--read-hash", EMPTY_FILE_HASH),
        target,
      };
    }
    const linesOf = (count: number) => "- a line\n".repeat(count);

    it("takes an index of exactly 200 lines, with or without a final newline", () => {
      expect(promoteIndex(linesOf(200)).res.status).toBe(0);
      expect(promoteIndex(linesOf(200).trimEnd()).res.status).toBe(0);
    });

    it("refuses 201 lines with its own exit code and leaves the target alone", () => {
      const { res, target } = promoteIndex(linesOf(201));
      expect(res.status).toBe(7);
      expect(res.stderr).toContain("201 lines");
      expect(existsSync(target)).toBe(false);
    });

    it("takes exactly 25,000 bytes and refuses one more", () => {
      expect(promoteIndex("x".repeat(25_000)).res.status).toBe(0);
      const over = promoteIndex("x".repeat(25_001)).res;
      expect(over.status).toBe(7);
      expect(over.stderr).toContain("25001 bytes");
    });

    it("refuses an index under the line limit that the loader would cut by size", () => {
      const entries = Array.from({ length: 100 }, (_, i) => `- ${"x".repeat(250)} ${i}`).join("\n");
      expect(entries.split("\n")).toHaveLength(100);
      expect(Buffer.byteLength(entries)).toBeGreaterThan(25_000);
      expect(Buffer.byteLength(entries)).toBeLessThan(25_600);
      expect(promoteIndex(entries).res.status).toBe(7);
    });

    it("counts bytes, not characters", () => {
      expect(promoteIndex("é".repeat(12_501)).res.status).toBe(7);
    });

    it("leaves every other file to its own size", () => {
      expect(promoteIndex(linesOf(300), "topic.md").res.status).toBe(0);
    });
  });

  // A promote is a rename, which fires no tool hook, so without this /dream's taken changes have no
  // version: the history hook stages only the file it was fired for.
  it("versions a promote into a memory folder and names the session", () => {
    const root = mkdtempSync(join(tmpdir(), "projects-"));
    const memory = join(root, "proj", "memory");
    mkdirSync(memory, { recursive: true });
    const source = join(root, "next.md");
    const target = join(memory, "topic.md");
    writeFileSync(source, "taken\n");
    const env = hermeticGitEnv({ AGENT_MEMORY_ROOT: root, CLAUDE_CODE_SESSION_ID: "s-dream" });
    const res = spawnSync(
      "node",
      [SCRIPT, "promote", source, target, "--read-hash", EMPTY_FILE_HASH],
      { encoding: "utf8", env },
    );
    expect(res.status).toBe(0);
    const log = spawnSync("git", ["-C", memory, "log", "--format=%B", "--", "topic.md"], {
      encoding: "utf8",
      env,
    }).stdout;
    expect(log).toContain("promote topic.md");
    expect(log).toContain("session: s-dream");
    expect(log).toContain("agent: run-memory");
  });

  it("creates no history for a promote outside a memory folder", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const source = join(dir, "s.md");
    const target = join(dir, "plain.md");
    writeFileSync(source, "new\n");
    const res = spawnSync(
      "node",
      [SCRIPT, "promote", source, target, "--read-hash", EMPTY_FILE_HASH],
      { encoding: "utf8", env: hermeticGitEnv({ AGENT_MEMORY_ROOT: join(dir, "projects") }) },
    );
    expect(res.status).toBe(0);
    expect(existsSync(join(dir, ".git"))).toBe(false);
  });
});
