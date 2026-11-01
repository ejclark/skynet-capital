import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { type Reply, runWorkflow } from "../support/run-workflow";

// The post-merge audit's agents start as the worker: 29.4k tokens on the first call against 82k for
// the default workflow agent (measured 2026-11-01), and its first real run paid for 26 of them. The
// worker has no persona and no MCP tools, so what these pin is that the tier still comes from the
// script, and that no prompt sends an agent to a tool it does not have.
const finding = { severity: "high", file: "x.ts", summary: "s", failure_scenario: "f" };

const replyFor =
  (files: string[]): Reply =>
  (_prompt, { label }) => {
    if (label === "work-mode")
      return { found: true, dispatch: true, position: "normal", grindWidth: 200 };
    if (label?.startsWith("triage")) return { merged: true, files, protected: false };
    if (label?.startsWith("review")) return { merged: true, findings: [finding] };
    return { refuted: false, evidence: "e" };
  };

const stageOf = (label = "") => label.split(" ")[0];

describe("post-merge-audit's stage agent", () => {
  it("runs triage, review and both refuters as the worker", async () => {
    const { calls } = await runWorkflow("post-merge-audit", { prs: [6501] }, replyFor(["x.ts"]));
    const stages = calls.filter((c) => c.opts.label !== "work-mode");
    expect(stages.map((c) => stageOf(c.opts.label)).sort()).toEqual([
      "repro",
      "review",
      "trace",
      "triage",
    ]);
    for (const stage of stages) expect(stage.opts.agentType).toBe("worker");
  });

  // A per-call model overrides the agent file's, and the worker has no model line, so a dropped dial
  // would quietly run the deep tier on the session's model.
  it("keeps the deep tier's model and effort on the call", async () => {
    const { calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/trading/x.ts"]),
    );
    const opts = (stage: string) => calls.find((c) => stageOf(c.opts.label) === stage)?.opts;
    expect(opts("triage")).toMatchObject({ model: "sonnet", effort: "medium" });
    expect(opts("review")).toMatchObject({ model: "fable", effort: "max" });
    expect(opts("trace")).toMatchObject({ model: "fable", effort: "xhigh" });
    expect(opts("repro")).toMatchObject({
      model: "fable",
      effort: "xhigh",
      isolation: "worktree",
    });
  });

  it("names no model on the standard tier, which stays on the session's", async () => {
    const { calls } = await runWorkflow("post-merge-audit", { prs: [6501] }, replyFor(["x.ts"]));
    const review = calls.find((c) => stageOf(c.opts.label) === "review");
    expect(review?.opts.model).toBeUndefined();
  });

  it("sends no agent to an MCP tool, and keeps the REST read as the fallback", async () => {
    const { calls } = await runWorkflow("post-merge-audit", { prs: [6501] }, replyFor(["x.ts"]));
    for (const { prompt } of calls) expect(prompt).not.toMatch(/MCP|pull_request_read/);
    const triage = calls.find((c) => stageOf(c.opts.label) === "triage");
    expect(triage?.prompt).toContain("repos/ejclark/skynet-capital/pulls/6501");
  });

  // Each of these is a tool a prompt asks for: shell for git and the specs, Write for the throwaway
  // spec and the scratch notes, Read and Grep for the current files.
  it("relies only on tools the worker has", () => {
    const tools = /^tools: (.+)$/m.exec(readFileSync(".claude/agents/worker.md", "utf8"))?.[1];
    expect(tools?.split(", ")).toEqual(
      expect.arrayContaining(["Bash", "Read", "Write", "Edit", "Grep"]),
    );
  });
});

describe("post-merge-audit's lens table", () => {
  const ROW = "{ name: 'correctness', roots: null, prompt: reviewPrompt },";
  const withSecurity = (source: string) => {
    expect(source).toContain(ROW);
    return source.replace(
      ROW,
      `${ROW}\n  { name: 'security', roots: ['src/server/'], prompt: reviewPrompt },`,
    );
  };
  const reviewers = (calls: { opts: { label?: string } }[]) =>
    calls.filter((c) => stageOf(c.opts.label) === "review").map((c) => c.opts.label);

  it("holds only the correctness lens today, which reads every path", async () => {
    const { calls, result } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["anything/at/all.ts"]),
    );
    expect(reviewers(calls)).toEqual(["review #6501 correctness (standard)"]);
    expect(result?.confirmed).toEqual([expect.objectContaining({ lens: "correctness" })]);
  });

  it("takes a later lens as one row, read only on the paths it names", async () => {
    const onItsPath = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/a.ts"]),
      withSecurity,
    );
    expect(reviewers(onItsPath.calls)).toEqual([
      "review #6501 correctness (deep)",
      "review #6501 security (deep)",
    ]);
    expect(((onItsPath.result?.confirmed ?? []) as { lens: string }[]).map((f) => f.lens)).toEqual([
      "correctness",
      "security",
    ]);

    const elsewhere = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["scripts/a.mjs"]),
      withSecurity,
    );
    expect(reviewers(elsewhere.calls)).toEqual(["review #6501 correctness (standard)"]);
  });

  // The same fail-safe as the tier: an unknown blast radius is never read by fewer lenses.
  it("runs every lens when triage died and the paths are unknown", async () => {
    const reply: Reply = (prompt, opts) =>
      opts.label?.startsWith("triage") ? null : replyFor(["x.ts"])(prompt, opts);
    const { calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      (prompt, opts) => (opts.label === "dead agents" ? { left: [] } : reply(prompt, opts)),
      withSecurity,
    );
    expect(reviewers(calls)).toHaveLength(2);
  });

  it("keeps one lens's findings when another lens's reviewer dies", async () => {
    const reply: Reply = (prompt, opts) => {
      if (opts.label === "dead agents") return { left: [] };
      if (opts.label?.includes("security")) return null;
      return replyFor(["src/server/a.ts"])(prompt, opts);
    };
    const { result } = await runWorkflow("post-merge-audit", { prs: [6501] }, reply, withSecurity);
    expect(result?.confirmed).toHaveLength(1);
    expect(result?.deadAgents).toEqual([
      expect.objectContaining({ agent: expect.stringContaining("security") }),
    ]);
  });

  it("calls a PR not found only when no reviewer found it", async () => {
    const reply: Reply = (prompt, opts) =>
      opts.label?.startsWith("review")
        ? { merged: false, findings: [] }
        : replyFor(["x.ts"])(prompt, opts);
    const { result } = await runWorkflow("post-merge-audit", { prs: [6501] }, reply);
    expect(result?.unreviewed).toEqual([{ pr: 6501, why: "not found on origin/main" }]);
  });

  it("asks for a re-run when no reviewer came back", async () => {
    const reply: Reply = (prompt, opts) => {
      if (opts.label === "dead agents") return { left: [] };
      return opts.label?.startsWith("review") ? null : replyFor(["x.ts"])(prompt, opts);
    };
    const { result } = await runWorkflow("post-merge-audit", { prs: [6501] }, reply);
    expect(result?.unreviewed).toEqual([{ pr: 6501, why: expect.stringContaining("re-run") }]);
  });
});
