import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain .mjs script, no declarations
import { agentSummary, agentUsage, scanWorkflowAgents } from "../../scripts/agent-meter/agents.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { auditedInWindow, defectsFromIssues } from "../../scripts/agent-meter/defects.mjs";

// WORKFLOW AGENTS FROM LOCAL TRANSCRIPTS (#6470). The study's first count read transcript lines as
// API calls and overstated an Opus agent's calls by 60%: a streamed reply writes one transcript row
// per content block, all carrying the same message id and the same usage. So usage is deduped by
// message id, and the first call is the first distinct message's input plus both cache sides.

const call = (id: string, usage: Record<string, number>, ts = "2026-10-30T10:00:00.000Z") =>
  JSON.stringify({ type: "assistant", timestamp: ts, message: { id, usage } });

describe("usage from one agent transcript", () => {
  it("dedupes streamed rows by message id and takes the first call from the first message", () => {
    const usage = agentUsage([
      call("m1", {
        input_tokens: 2,
        cache_creation_input_tokens: 80000,
        cache_read_input_tokens: 0,
        output_tokens: 8,
      }),
      call("m1", {
        input_tokens: 2,
        cache_creation_input_tokens: 80000,
        cache_read_input_tokens: 0,
        output_tokens: 8,
      }),
      "not json",
      call(
        "m2",
        {
          input_tokens: 5,
          cache_creation_input_tokens: 100,
          cache_read_input_tokens: 80000,
          output_tokens: 300,
        },
        "2026-10-30T10:01:00.000Z",
      ),
    ]);
    expect(usage).toEqual({
      calls: 2,
      firstCall: 80002,
      firstAt: "2026-10-30T10:00:00.000Z",
      totals: { input: 7, cacheWrite: 80100, cacheRead: 80000, output: 308 },
    });
  });

  it("has nothing to report for a transcript with no answer", () => {
    expect(agentUsage(["{}", JSON.stringify({ type: "user" })])).toBeNull();
  });
});

describe("workflow agent summary", () => {
  it("gives first-call p50 by agent type and token totals by workflow", () => {
    const agent = (type: string, wf: string, firstCall: number, output: number) => ({
      agentType: type,
      workflow: wf,
      firstCall,
      totals: { input: 10, cacheWrite: firstCall, cacheRead: 0, output },
    });
    const s = agentSummary([
      agent("workflow-subagent", "pin-reactions", 88000, 100),
      agent("workflow-subagent", "pin-reactions", 90000, 200),
      agent("workflow-subagent", "dream", 82000, 50),
      agent("wf:reviewer", "dream", 32000, 10),
    ]);
    expect(s.agents).toBe(4);
    expect(s.firstCallP50ByType).toEqual({
      "workflow-subagent": { n: 3, p50: 88000 },
      "wf:reviewer": { n: 1, p50: 32000 },
    });
    expect(s.tokensByWorkflow["pin-reactions"]).toEqual({
      agents: 2,
      input: 20,
      cacheWrite: 178000,
      cacheRead: 0,
      output: 300,
      total: 178320,
    });
  });
});

describe("scanning the projects folder for workflow agents", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-agents-"));
    // The main project folder and one worktree folder: both launch workflow agents.
    for (const [folder, wf, name] of [
      ["-Users-eric-Developer-skynet-capital", "wf_aaa-1", "pin-reactions"],
      ["-Users-eric-Developer-skynet-capital--claude-worktrees-x", "wf_bbb-2", "dream"],
    ] as const) {
      const session = join(dir, folder, "s1");
      mkdirSync(join(session, "subagents", "workflows", wf), { recursive: true });
      mkdirSync(join(session, "workflows"), { recursive: true });
      writeFileSync(
        join(session, "workflows", `${wf}.json`),
        JSON.stringify({ runId: wf, workflowName: name }),
      );
      const agent = join(session, "subagents", "workflows", wf, "agent-1.jsonl");
      writeFileSync(
        agent,
        `${call("m1", { input_tokens: 1, cache_creation_input_tokens: 1000, cache_read_input_tokens: 0, output_tokens: 5 })}\n`,
      );
      writeFileSync(
        `${agent.slice(0, -6)}.meta.json`,
        JSON.stringify({ agentType: "workflow-subagent" }),
      );
    }
    // An unrelated project never counts.
    mkdirSync(join(dir, "-Users-eric-Other", "s1", "subagents", "workflows", "wf_c"), {
      recursive: true,
    });
    writeFileSync(
      join(dir, "-Users-eric-Other", "s1", "subagents", "workflows", "wf_c", "agent-2.jsonl"),
      `${call("m9", { input_tokens: 1 })}\n`,
    );
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("finds agents under every folder of this project, named by their workflow", async () => {
    const agents = await scanWorkflowAgents(
      dir,
      "-Users-eric-Developer-skynet-capital",
      Date.parse("2026-10-27T00:00:00Z"),
      Date.parse("2026-11-01T00:00:00Z"),
    );
    expect(agents.map((a: { workflow: string }) => a.workflow).sort()).toEqual([
      "dream",
      "pin-reactions",
    ]);
    expect(agents[0].agentType).toBe("workflow-subagent");
    expect(agents[0].firstCall).toBe(1001);
  });

  it("leaves out an agent whose first call is outside the window", async () => {
    const agents = await scanWorkflowAgents(
      dir,
      "-Users-eric-Developer-skynet-capital",
      Date.parse("2026-10-31T00:00:00Z"),
      Date.parse("2026-11-01T00:00:00Z"),
    );
    expect(agents).toEqual([]);
  });
});

// POST-MERGE DEFECTS (#6470). The audit files each confirmed finding as an issue whose metadata
// table carries `Found by` and `Introduced in`. The count sits beside how many PRs were audited,
// read from the audit's receipts, so a week nobody audited reads unknown and never zero.

const issue = (number: number, created: string, found: string, introduced: string) => ({
  number,
  created_at: created,
  body: `**Ask:** x\n\n| | |\n|---|---|\n| **Found by** | ${found} |\n| **Introduced in** | ${introduced} |\n`,
});

describe("confirmed defects from filed issues", () => {
  it("counts issues carrying both fields inside the window, by finder and by PR", () => {
    const out = defectsFromIssues(
      [
        issue(
          1,
          "2026-10-30T00:00:00Z",
          "post-merge audit 2026-10-30, two refuters",
          "#6029 · `src/a.ts:65`",
        ),
        issue(2, "2026-10-30T01:00:00Z", "post-merge audit 2026-10-30", "#6029"),
        issue(3, "2026-10-30T02:00:00Z", "member report", "#6100"),
        issue(4, "2026-10-20T00:00:00Z", "post-merge audit 2026-10-20", "#5900"),
        { number: 5, created_at: "2026-10-30T03:00:00Z", body: "| **Found by** | me |" },
      ],
      Date.parse("2026-10-27T05:00:00Z"),
      Date.parse("2026-11-01T00:00:00Z"),
    );
    expect(out).toEqual({
      confirmed: 3,
      byFinder: { "post-merge audit": 2, "member report": 1 },
      prsWithDefect: 2,
    });
  });
});

describe("PRs audited, from receipts", () => {
  it("reads null, not zero, when no receipt falls in the window", () => {
    expect(auditedInWindow([], 0, Date.now())).toBeNull();
    expect(
      auditedInWindow(
        [{ at: "2026-10-20T00:00:00Z", prs: [1, 2] }],
        Date.parse("2026-10-27T05:00:00Z"),
        Date.parse("2026-11-01T00:00:00Z"),
      ),
    ).toBeNull();
  });

  it("counts distinct PRs across the window's audits", () => {
    expect(
      auditedInWindow(
        [
          { at: "2026-10-30T00:00:00Z", prs: [1, 2, 3] },
          { at: "2026-10-31T00:00:00Z", prs: [3, 4] },
        ],
        Date.parse("2026-10-27T05:00:00Z"),
        Date.parse("2026-11-01T00:00:00Z"),
      ),
    ).toEqual({ audits: 2, prs: 4 });
  });
});
