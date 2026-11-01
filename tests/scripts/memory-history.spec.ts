import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "projects-"));
  const dir = join(root, "proj", "memory");
  mkdirSync(dir, { recursive: true });
  return { root, dir };
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
});
