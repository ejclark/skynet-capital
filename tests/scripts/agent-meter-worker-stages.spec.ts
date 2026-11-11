import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { missingToolStop, stagesByType, workerOracle } from "../../scripts/agent-meter/agents.mjs";
import { commandOf } from "../../scripts/loop-check.mjs";

// THE WORKER'S ORACLE (#6470). Worker is grind's default stage agent because it starts near 30k
// tokens against 82k for the default workflow agent. The registry's falsifier is a median first call
// under 40k with at most 1 in 20 stages stopped for a tool it does not have, and nothing could read
// that. A stage that is told to report a missing tool usually never tries the call, since the tool
// is not in its list, so the transcript's tool error alone would read zero whatever happened.

const assistant = (...content: object[]) =>
  JSON.stringify({ type: "assistant", message: { id: `m${Math.random()}`, content } });
const toolError = (text: string) =>
  JSON.stringify({
    type: "user",
    message: {
      content: [{ type: "tool_result", is_error: true, content: `<tool_use_error>${text}` }],
    },
  });
const tool = (name: string, input: object = {}) => ({ type: "tool_use", name, input });
const says = (text: string) => ({ type: "text", text });
const NO_GREP = "Error: No such tool available: Grep. Grep is not available in this session";

describe("a stage stopped for a missing tool", () => {
  it("reads a clean stage as neither", () => {
    expect(
      missingToolStop([
        assistant(tool("Bash")),
        assistant(tool("StructuredOutput", { status: "done", summary: "all tools passed" })),
      ]),
    ).toEqual({ stopped: false, triedMissing: false });
  });

  it("does not count a stage that hit the error and carried on as stopped", () => {
    expect(
      missingToolStop([
        assistant(tool("Grep")),
        toolError(NO_GREP),
        assistant(tool("Bash")),
        assistant(says("found it")),
      ]),
    ).toEqual({ stopped: false, triedMissing: true });
  });

  it("counts a stage whose last tool call was the missing one", () => {
    expect(
      missingToolStop([
        assistant(tool("Skill")),
        toolError("Error: No such tool available: Skill."),
        assistant(says("I cannot do this stage.")),
      ]),
    ).toEqual({ stopped: true, triedMissing: true });
    expect(
      missingToolStop([
        assistant(tool("Skill")),
        toolError("Error: No such tool available: Skill."),
        assistant(tool("StructuredOutput", { found: false })),
      ]),
    ).toEqual({ stopped: true, triedMissing: true });
  });

  it("counts a stage that never tried the call and said so in its return value", () => {
    for (const said of [
      "blocked: no Skill tool in this stage",
      "I do not have the Skill tool",
      "The ReportFindings tool is not available",
      "this needs a tool: missing `Agent` tool",
    ])
      expect(missingToolStop([assistant(tool("Bash")), assistant(says(said))])).toEqual({
        stopped: true,
        triedMissing: false,
      });
    expect(
      missingToolStop([
        assistant(tool("StructuredOutput", { status: "blocked", summary: "no Skill tool here" })),
      ]).stopped,
    ).toBe(true);
  });

  // #6692: the five wordings the first pattern missed, each after one Bash call, as a blocked return.
  const blocked = (summary: string) =>
    missingToolStop([
      assistant(tool("Bash")),
      assistant(tool("StructuredOutput", { status: "blocked", summary })),
    ]);

  it("counts a stage that says it lacks a tool in any of the common wordings", () => {
    for (const summary of [
      "The Skill tool isn't available in this stage",
      "needs the Skill tool, which is not in my tool list",
      "Skill is not available to a worker",
      "the Agent tool is not in this agent's tools",
      "I can't invoke the Skill tool here",
      "I can’t use the ReportFindings tool",
      "mcp__playwright__browser_navigate is unavailable",
      "cannot call Agent from a worker stage",
    ])
      expect(blocked(summary)).toEqual({ stopped: true, triedMissing: false });
  });

  it("does not read a short blocked return that names a tool in passing as a missing tool", () => {
    for (const summary of [
      "the lint tool failed on two files",
      "ran the Bash tool; the failure is not in my diff",
      "the review agent is not available until the PR opens",
      "no tests cover the Skill loader",
      "blocked: the target file is not in the list I was given",
    ])
      expect(blocked(summary).stopped).toBe(false);
  });

  it("believes a stage that says it finished, whatever its summary mentions", () => {
    expect(
      missingToolStop([
        assistant(tool("StructuredOutput", { status: "done", summary: "added the missing tool" })),
      ]).stopped,
    ).toBe(false);
  });

  it("does not read a long report that mentions a tool as a stage that stopped", () => {
    // The shape of today's 8 false readings: finished work quoting this falsifier, or noting a tool.
    const report = {
      prs: [{ number: 1 }],
      notRun: ["this subagent has no Agent tool, so the reviewer was not asked"],
      after: "x".repeat(600),
    };
    expect(missingToolStop([assistant(tool("StructuredOutput", report))]).stopped).toBe(false);
    expect(missingToolStop([assistant(says(`no Agent tool. ${"x".repeat(600)}`))]).stopped).toBe(
      false,
    );
    // A stage that says it did not finish is read however long it runs.
    expect(
      missingToolStop([assistant(tool("StructuredOutput", { ...report, status: "blocked" }))])
        .stopped,
    ).toBe(true);
  });

  it("reads the last return value, not an earlier message that mentioned the problem", () => {
    expect(
      missingToolStop([
        assistant(says("no Grep tool, so I will use Bash")),
        assistant(tool("Bash")),
        assistant(says("fixed three files")),
      ]).stopped,
    ).toBe(false);
  });

  it("survives a line that is not JSON", () => {
    expect(missingToolStop(["not json", assistant(says("ok"))]).stopped).toBe(false);
  });
});

describe("first calls and stops by agent type", () => {
  const stage = (agentType: string, firstCall: number, over = {}) => ({
    agentType,
    firstCall,
    stopped: false,
    triedMissing: false,
    description: "a stage",
    ...over,
  });

  it("gives each type its median, its range and its stops, the largest type first", () => {
    const rows = stagesByType([
      stage("worker", 34000),
      stage("worker", 35000, { stopped: true, triedMissing: true, description: "fix lint" }),
      stage("worker", 36000, { triedMissing: true }),
      stage("wf:reviewer", 29000),
    ]);
    expect(rows.map((r: { type: string }) => r.type)).toEqual(["worker", "wf:reviewer"]);
    expect(rows[0]).toEqual({
      type: "worker",
      n: 3,
      median: 35000,
      min: 34000,
      max: 36000,
      stopped: 1,
      triedMissing: 2,
      stoppedStages: ["fix lint"],
    });
  });
});

describe("the worker's oracle", () => {
  const row = (n: number, median: number, stopped = 0) => ({ n, median, stopped });

  it("passes at 86 stages, a median of 34k and nothing stopped", () => {
    expect(workerOracle(row(86, 34387)).verdict).toBe("pass");
  });

  it("fails on a median at the ceiling, and just under it passes", () => {
    expect(workerOracle(row(20, 40000)).verdict).toBe("fail");
    expect(workerOracle(row(20, 39999)).verdict).toBe("pass");
  });

  it("allows 1 in 20 stopped and fails past it", () => {
    expect(workerOracle(row(20, 34000, 1)).verdict).toBe("pass");
    expect(workerOracle(row(20, 34000, 2)).verdict).toBe("fail");
    expect(workerOracle(row(40, 34000, 2)).verdict).toBe("pass");
    expect(workerOracle(row(40, 34000, 3)).verdict).toBe("fail");
  });

  it("says not yet below 20 stages, and when no worker has run", () => {
    expect(workerOracle(row(19, 90000, 5)).verdict).toBe("not yet");
    expect(workerOracle(undefined).verdict).toBe("not yet");
    // Counted in the window, so it must not read as the total ever run.
    expect(workerOracle(undefined).line).toMatch(/0 stages in this window, 20 needed/);
  });
});

describe("npm run meter -- --worker-stages", () => {
  let dir: string;
  const write = (run: string, name: string, agentType: string, first: number, lines: string[]) => {
    const folder = join(
      dir,
      "-Users-eric-Developer-skynet-capital-worktree",
      "session-1",
      "subagents",
      "workflows",
      run,
    );
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, `agent-${name}.meta.json`),
      JSON.stringify({ agentType, description: `stage ${name}` }),
    );
    const firstCall = JSON.stringify({
      type: "assistant",
      timestamp: "2026-11-01T10:00:00.000Z",
      message: { id: `${name}-1`, usage: { input_tokens: 2, cache_creation_input_tokens: first } },
    });
    writeFileSync(join(folder, `agent-${name}.jsonl`), [firstCall, ...lines].join("\n"));
  };
  const meter = (projects: string, mode: string[] = ["--worker-stages"]) =>
    spawnSync(
      "node",
      [
        "scripts/agent-meter.mjs",
        ...mode,
        "--since",
        "2026-11-01T00:00:00Z",
        "--until",
        "2026-11-02T00:00:00Z",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        // A fake gh that records and refuses: this read costs no REST, and if the flag ever stopped
        // being wired, the full meter would otherwise spend the real shared bucket from a spec.
        env: {
          ...process.env,
          PATH: `${join(dir, "bin")}:${process.env.PATH}`,
          AGENT_PROJECTS_DIR: projects,
          AGENT_RUNS_DIR: join(dir, "runs"),
          // The fixture folder is named for the laptop's checkout (#6689).
          AGENT_CHECKOUT_DIR: "/Users/eric/Developer/skynet-capital",
        },
        timeout: 60000,
      },
    );

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-worker-"));
    mkdirSync(join(dir, "bin"));
    writeFileSync(
      join(dir, "bin", "gh"),
      `#!/bin/bash\ntouch "${join(dir, "gh-called")}"\nexit 1\n`,
    );
    chmodSync(join(dir, "bin", "gh"), 0o755);
    for (let i = 0; i < 20; i += 1) write("run-a", `w${i}`, "worker", 34000 + i, []);
    write("run-a", "default", "workflow-subagent", 88000, []);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("prints each type from the meta files, the oracle's verdict, and exits 0 on a pass", () => {
    const res = meter(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/worker: 20 stages, median first call 34\.0k/);
    expect(res.stdout).toMatch(/workflow-subagent: 1 stage, median first call 88\.0k/);
    expect(res.stdout).toMatch(/worker oracle: pass/);
    expect(existsSync(join(dir, "gh-called"))).toBe(false);
  });

  it("carries the same verdict in the full meter's agents section", () => {
    // The fake gh refuses, so the REST sections read unavailable and this one still prints.
    const res = meter(dir, []);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/workflow agents[\s\S]*worker oracle: pass/);
  });

  it("reads unknown, not a count, on a machine with no transcripts", () => {
    const res = meter(join(dir, "no-such-folder"));
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/worker oracle: unknown: no transcripts/);
    // A folder of other projects' transcripts is the same answer, not "0 stages".
    const others = join(dir, "others");
    mkdirSync(join(others, "-home-runner-work-another-repo"), { recursive: true });
    expect(meter(others).stdout).toMatch(/worker oracle: unknown: no transcripts/);
  });

  it("is named so the registry's check runs this and not the whole meter", () => {
    // loop-check reads the first word after `npm run`, so `npm run meter -- --worker-stages` would
    // run the bare meter from a push tick and spend up to 250 REST calls.
    const row = readFileSync("docs/process/LEARNING-LOOP.md", "utf8")
      .split("\n")
      .find((line) => line.startsWith("| Worker stage agent |"));
    expect(commandOf(row)).toBe("meter:workers");
    expect(JSON.parse(readFileSync("package.json", "utf8")).scripts["meter:workers"]).toContain(
      "--worker-stages",
    );
  });

  it("exits 1 when the oracle fails, and names the stage that stopped", () => {
    write("run-a", "stop1", "worker", 34000, [assistant(says("blocked: no Skill tool"))]);
    write("run-a", "stop2", "worker", 34000, [assistant(says("blocked: no Agent tool"))]);
    const res = meter(dir);
    expect(res.status).toBe(1);
    expect(res.stdout).toMatch(/worker oracle: fail/);
    expect(res.stdout).toMatch(/stage stop1/);
  });
});
