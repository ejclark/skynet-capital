import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { memoryDirOf } from "../../scripts/hooks/memory-history.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

const HOOK = resolve("scripts/hooks/memory-history.mjs");
const ENV = hermeticGitEnv();

function fire(root: string, input: object) {
  return spawnSync("node", [HOOK], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...ENV, AGENT_MEMORY_ROOT: root },
  });
}

function fireAsync(root: string, input: object): Promise<{ code: number | null; stderr: string }> {
  return new Promise((done) => {
    const child = spawn("node", [HOOK], {
      env: { ...ENV, AGENT_MEMORY_ROOT: root },
      stdio: ["pipe", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => done({ code, stderr }));
    child.stdin.end(JSON.stringify(input));
  });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "projects-"));
  const dir = join(root, "proj", "memory");
  mkdirSync(dir, { recursive: true });
  return { root, dir };
}

function writeBy(session: string, file: string) {
  return { tool_name: "Write", tool_input: { file_path: file }, session_id: session };
}

function gitOut(dir: string, ...args: string[]) {
  return spawnSync("git", ["-C", dir, ...args], { encoding: "utf8", env: ENV }).stdout;
}

/** The session named by each commit that touched a file, newest first. */
function commitsTouching(dir: string, file: string) {
  return gitOut(dir, "log", "--format=%B", "--", file)
    .split("\n")
    .filter((line) => line.startsWith("session: "));
}

describe("memory history hook", () => {
  it("matches only files directly inside a project's memory folder", () => {
    expect(memoryDirOf("/r/p/memory/a.md", "/r")).toBe("/r/p/memory");
    expect(memoryDirOf("/r/p/other/a.md", "/r")).toBeNull();
    expect(memoryDirOf("/r/p/memory/.git/config", "/r")).toBeNull();
    expect(memoryDirOf("/elsewhere/a.md", "/r")).toBeNull();
    expect(memoryDirOf(undefined, "/r")).toBeNull();
  });

  it("versions a memory write and records who made it", () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    writeFileSync(file, "one\n");
    expect(
      fire(root, {
        tool_name: "Write",
        tool_input: { file_path: file },
        session_id: "s-1",
        agent_id: "agent-7",
      }).status,
    ).toBe(0);
    const log = spawnSync("git", ["-C", dir, "log", "--format=%B"], {
      encoding: "utf8",
      env: ENV,
    }).stdout;
    expect(log).toContain("Write a.md");
    expect(log).toContain("session: s-1");
    expect(log).toContain("agent: agent-7");
  });

  it("keeps one version per change and none for a no-op", () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    const input = { tool_name: "Edit", tool_input: { file_path: file } };
    writeFileSync(file, "one\n");
    fire(root, input);
    fire(root, input);
    writeFileSync(file, "two\n");
    fire(root, input);
    const count = spawnSync("git", ["-C", dir, "rev-list", "--count", "HEAD"], {
      encoding: "utf8",
      env: ENV,
    });
    expect(count.stdout.trim()).toBe("2");
  });

  it("ignores every other file and never fails the session on bad input", () => {
    const { root, dir } = fixture();
    expect(fire(root, { tool_name: "Write", tool_input: { file_path: "/tmp/x.md" } }).status).toBe(
      0,
    );
    expect(existsSync(join(dir, ".git"))).toBe(false);
    const bad = spawnSync("node", [HOOK], { input: "not json", encoding: "utf8", env: ENV });
    expect(bad.status).toBe(0);
  });

  // The order that broke provenance: both files are on disk before either hook fires, so a hook that
  // stages the whole folder commits the other session's file under its own name.
  it("gives two writes from two sessions two commits, each naming its own session", () => {
    const { root, dir } = fixture();
    const [a, b] = [join(dir, "a.md"), join(dir, "b.md")];
    writeFileSync(a, "from a\n");
    writeFileSync(b, "from b\n");
    expect(fire(root, writeBy("s-a", a)).status).toBe(0);
    expect(fire(root, writeBy("s-b", b)).status).toBe(0);
    expect(commitsTouching(dir, "a.md")).toEqual(["session: s-a"]);
    expect(commitsTouching(dir, "b.md")).toEqual(["session: s-b"]);
    expect(gitOut(dir, "rev-list", "--count", "HEAD").trim()).toBe("2");
  });

  it("leaves a file it was not fired for out of the commit", () => {
    const { root, dir } = fixture();
    const [a, b] = [join(dir, "a.md"), join(dir, "b.md")];
    writeFileSync(a, "from a\n");
    writeFileSync(b, "still being written\n");
    fire(root, writeBy("s-a", a));
    expect(gitOut(dir, "show", "--name-only", "--format=", "HEAD").trim()).toBe("a.md");
    expect(gitOut(dir, "status", "--porcelain").trim()).toBe("?? b.md");
  });

  it("lands every version when sessions fire at once, on a folder with no repo yet", async () => {
    const { root, dir } = fixture();
    const sessions = Array.from({ length: 8 }, (_, i) => `s-${i}`);
    for (const s of sessions) writeFileSync(join(dir, `${s}.md`), `${s}\n`);
    const results = await Promise.all(
      sessions.map((s) => fireAsync(root, writeBy(s, join(dir, `${s}.md`)))),
    );
    expect(results.map((r) => r.code)).toEqual(sessions.map(() => 0));
    for (const s of sessions) expect(commitsTouching(dir, `${s}.md`)).toEqual([`session: ${s}`]);
  }, 60_000);

  it("waits out a lock another git process lets go of", async () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    writeFileSync(file, "one\n");
    fire(root, writeBy("s-0", file));
    writeFileSync(file, "two\n");
    const lock = join(dir, ".git", "index.lock");
    writeFileSync(lock, "");
    const firing = fireAsync(root, writeBy("s-1", file));
    setTimeout(() => rmSync(lock), 300);
    expect((await firing).code).toBe(0);
    expect(commitsTouching(dir, "a.md")).toEqual(["session: s-1", "session: s-0"]);
  }, 30_000);

  it("has nothing to say about a file already removed again", () => {
    const { root, dir } = fixture();
    const fired = fire(root, writeBy("s-1", join(dir, "gone.md")));
    expect(fired.status).toBe(0);
    expect(fired.stderr).toBe("");
  });

  // A filesystem failure in the lock costs a version like any other, so it must not exit 0. The lock
  // lives beside the memory folder, so a file where the project folder belongs stops the lock and
  // nothing before it, for every user. A read-only parent stopped it for everyone but root, and cloud
  // sessions run as root: there the hook took the lock, so this test failed every verify
  // (governed cycle 7, 2026-11-02).
  it("exits 2 when it cannot take its turn at all", () => {
    const root = mkdtempSync(join(tmpdir(), "projects-"));
    writeFileSync(join(root, "proj"), "a file where the project folder belongs\n");
    const fired = fire(root, writeBy("s-1", join(root, "proj", "memory", "a.md")));
    expect(fired.status).toBe(2);
    expect(fired.stderr).toContain("a.md has no version");
  });

  it("exits 2 when git itself cannot start", () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    writeFileSync(file, "one\n");
    const fired = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify(writeBy("s-1", file)),
      encoding: "utf8",
      env: { ...ENV, AGENT_MEMORY_ROOT: root, PATH: "/nonexistent" },
    });
    expect(fired.status).toBe(2);
    expect(fired.stderr).toContain("a.md has no version");
  });

  it("is not blocked by a hook that died holding its turn", () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    writeFileSync(file, "one\n");
    const dead = spawnSync("node", ["-e", ""]).pid;
    writeFileSync(`${dir}.history.lock`, `${dead} ${Date.now()}\n`);
    expect(fire(root, writeBy("s-1", file)).status).toBe(0);
    expect(commitsTouching(dir, "a.md")).toEqual(["session: s-1"]);
    expect(existsSync(`${dir}.history.lock`)).toBe(false);
  });

  // Exit 2 is what reaches the session once settings.json stops masking it; the JSON line is what
  // reaches it today, because the mask drops stderr and the exit code but not stdout.
  it("says so and exits 2 when a version cannot land", () => {
    const { root, dir } = fixture();
    const file = join(dir, "a.md");
    writeFileSync(file, "one\n");
    fire(root, writeBy("s-0", file));
    writeFileSync(file, "two\n");
    const lock = join(dir, ".git", "index.lock");
    writeFileSync(lock, "");
    const stuck = fire(root, writeBy("s-1", file));
    expect(stuck.status).toBe(2);
    expect(stuck.stderr).toContain("memory-history: a.md has no version");
    expect(JSON.parse(stuck.stdout).systemMessage).toContain("a.md has no version");
    expect(commitsTouching(dir, "a.md")).toEqual(["session: s-0"]);

    // The next write after the lock clears versions the file again, nothing is stuck.
    rmSync(lock);
    expect(fire(root, writeBy("s-2", file)).status).toBe(0);
    expect(commitsTouching(dir, "a.md")).toEqual(["session: s-2", "session: s-0"]);
  }, 30_000);
});
