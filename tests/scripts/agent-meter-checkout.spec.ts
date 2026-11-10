import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import {
  currentProject,
  isProjectFolder,
  projectFolder,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/project.mjs";

// WHICH TRANSCRIPTS ARE THIS CHECKOUT'S (#6689). The meter fixed its folder name to the laptop's
// checkout, so in a cloud session (where sessions run by default) it matched nothing and printed
// "none in the window", the same line as a quiet week. It now reads the folders named for the
// checkout it runs in, and every section that reads transcripts says unknown when none match.

const CLOUD = "/home/user/skynet-capital";
const CLOUD_FOLDER = "-home-user-skynet-capital";

describe("naming a checkout's transcript folder", () => {
  it("turns every character that is not a letter or digit into a dash, as Claude Code does", () => {
    expect(projectFolder(CLOUD)).toBe(CLOUD_FOLDER);
    expect(projectFolder("/Users/eric/Developer/skynet-capital")).toBe(
      "-Users-eric-Developer-skynet-capital",
    );
    expect(projectFolder(`${CLOUD}/.claude/worktrees/x`)).toBe(
      `${CLOUD_FOLDER}--claude-worktrees-x`,
    );
  });

  it("counts the checkout's own folder and its worktrees', never a sibling sharing a prefix", () => {
    expect(isProjectFolder(CLOUD_FOLDER, CLOUD_FOLDER)).toBe(true);
    expect(isProjectFolder(`${CLOUD_FOLDER}--claude-worktrees-x`, CLOUD_FOLDER)).toBe(true);
    expect(isProjectFolder(`${CLOUD_FOLDER}2`, CLOUD_FOLDER)).toBe(false);
    expect(isProjectFolder("-Users-eric-Developer-skynet-capital", CLOUD_FOLDER)).toBe(false);
  });

  it("is named for the checkout the script sits in, not a fixed machine", () => {
    const before = process.env.AGENT_CHECKOUT_DIR;
    delete process.env.AGENT_CHECKOUT_DIR;
    try {
      // The suite runs from the repo root, so the derived name is that root's folder.
      expect(currentProject()).toBe(projectFolder(process.cwd()));
    } finally {
      if (before !== undefined) process.env.AGENT_CHECKOUT_DIR = before;
    }
  });
});

describe("npm run meter in a checkout that is not the laptop's", () => {
  let dir: string;
  const projects = () => join(dir, "projects");
  const window = ["--since", "2026-11-01T00:00:00Z", "--until", "2026-11-02T00:00:00Z"];

  const meter = (env: Record<string, string>) => {
    const base = { ...process.env };
    // Unset, so the meter finds its folders the way a real run does.
    for (const seam of ["AGENT_TRANSCRIPTS_DIR", "AGENT_MEMORY_DIR", "AGENT_CHECKOUT_DIR"])
      delete base[seam];
    return spawnSync("node", ["scripts/agent-meter.mjs", ...window], {
      cwd: process.cwd(),
      encoding: "utf8",
      // A fake gh that refuses, so the REST sections read unavailable and no spec spends the bucket.
      env: {
        ...base,
        HOME: dir,
        PATH: `${join(dir, "bin")}:${process.env.PATH}`,
        AGENT_PROJECTS_DIR: projects(),
        AGENT_RUNS_DIR: join(dir, "runs"),
        ...env,
      },
      timeout: 60000,
    });
  };
  const section = (out: string, name: string) =>
    out.split("\n\n").find((block) => block.startsWith(name)) ?? "";

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-checkout-"));
    mkdirSync(join(dir, "bin"));
    writeFileSync(join(dir, "bin", "gh"), "#!/bin/bash\nexit 1\n");
    chmodSync(join(dir, "bin", "gh"), 0o755);

    // A workflow run launched from a worktree of the cloud checkout.
    const session = join(projects(), `${CLOUD_FOLDER}--claude-worktrees-x`, "s1");
    const run = join(session, "subagents", "workflows", "wf_cloud-1");
    mkdirSync(run, { recursive: true });
    mkdirSync(join(session, "workflows"), { recursive: true });
    writeFileSync(
      join(session, "workflows", "wf_cloud-1.json"),
      JSON.stringify({ workflowName: "cloud-sweep" }),
    );
    writeFileSync(join(run, "agent-1.meta.json"), JSON.stringify({ agentType: "worker" }));
    writeFileSync(
      join(run, "agent-1.jsonl"),
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-11-01T10:00:00.000Z",
        message: { id: "m1", usage: { input_tokens: 2, cache_creation_input_tokens: 31000 } },
      }),
    );

    // The main folder: one session's transcript and the memory index beside it.
    const main = join(projects(), CLOUD_FOLDER);
    mkdirSync(join(main, "memory"), { recursive: true });
    writeFileSync(join(main, "memory", "MEMORY.md"), "- [a](a.md) — one\n- [b](b.md) — two\n");
    writeFileSync(join(main, "memory", "a.md"), "a\n");
    writeFileSync(
      join(main, "session-1.jsonl"),
      [
        { type: "user", timestamp: "2026-11-01T09:00:00Z", message: { content: "go" } },
        {
          type: "assistant",
          timestamp: "2026-11-01T09:00:05Z",
          message: { id: "s1", usage: { input_tokens: 12000, cache_read_input_tokens: 3000 } },
        },
      ]
        .map((row) => JSON.stringify(row))
        .join("\n"),
    );

    // The laptop's folder, which a cloud checkout must not read as its own.
    mkdirSync(join(dir, "laptop", "-Users-eric-Developer-skynet-capital"), { recursive: true });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("lists the cloud checkout's workflow run, its startup and its memory index", () => {
    const res = meter({ AGENT_CHECKOUT_DIR: CLOUD });
    expect(res.status).toBe(0);
    const agents = section(res.stdout, "workflow agents");
    expect(agents).toMatch(/cloud-sweep: 31\.0k tokens over 1 agents/);
    expect(agents).not.toMatch(/none in the window/);
    expect(section(res.stdout, "startup")).toMatch(/recent first calls: 15000 tokens/);
    expect(res.stdout).toMatch(/memory index: 2 of 200 lines, 2 files/);
  });

  it("says unknown in every transcript section when no folder is this checkout's", () => {
    const res = meter({
      AGENT_CHECKOUT_DIR: CLOUD,
      AGENT_PROJECTS_DIR: join(dir, "laptop"),
    });
    expect(res.status).toBe(0);
    expect(res.stdout).not.toMatch(/none in the window/);
    expect(section(res.stdout, "workflow agents")).toMatch(/unknown: no transcripts/);
    expect(section(res.stdout, "startup")).toMatch(/unknown: no transcripts/);
    expect(section(res.stdout, "flow")).toMatch(/unknown/);
    expect(res.stdout).toMatch(/memory index: unknown/);
  });
});
