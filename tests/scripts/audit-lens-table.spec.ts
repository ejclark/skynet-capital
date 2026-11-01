import { describe, expect, it } from "@rstest/core";
import { type Reply, runWorkflow } from "../support/run-workflow";

// The performance lens joined the post-merge audit after its replay (docs/review/README.md). What
// these pin is the table: which PRs pay for the second reviewer, what tier it runs at, and that one
// defect two lenses both report pays its two refuters once.
const at = (file: string, line: number) => ({
  severity: "high",
  file,
  line,
  summary: "s",
  failure_scenario: "f",
});

const replyFor =
  (files: string[], correctness: object[], performance: object[]): Reply =>
  (_prompt, { label }) => {
    if (label === "work-mode")
      return { found: true, dispatch: true, position: "normal", grindWidth: 200 };
    if (label?.startsWith("triage")) return { merged: true, files, protected: false };
    if (label?.includes("performance")) return { merged: true, findings: performance };
    if (label?.startsWith("review")) return { merged: true, findings: correctness };
    return { refuted: false, evidence: "e" };
  };

const reviews = (calls: { opts: { label?: string } }[]) =>
  calls.filter((c) => c.opts.label?.startsWith("review"));
const traces = (calls: { opts: { label?: string } }[]) =>
  calls.filter((c) => c.opts.label?.startsWith("trace"));

describe("the audit's lens table", () => {
  it("adds the performance reviewer only on a PR that touches a path the lens fires on", async () => {
    const server = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/x.ts"], [], []),
    );
    expect(reviews(server.calls).map((c) => c.opts.label)).toEqual([
      "review #6501 correctness (deep)",
      "review #6501 performance (deep)",
    ]);
    const script = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["scripts/x.mjs"], [], []),
    );
    expect(reviews(script.calls).map((c) => c.opts.label)).toEqual([
      "review #6501 correctness (standard)",
    ]);
  });

  it("runs the lens at the tier its replay was scored at, however deep the PR's tier is", async () => {
    const { calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/x.ts"], [], []),
    );
    const [correctness, performance] = reviews(calls);
    expect(correctness?.opts).toMatchObject({ model: "fable", effort: "max" });
    expect(performance?.opts).toMatchObject({ model: "opus", effort: "high", agentType: "worker" });
  });

  it("tells the reviewer to read the lens file, and to judge against main as it is now", async () => {
    const { calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/storage/x.ts"], [], []),
    );
    const prompt = (reviews(calls)[1] as unknown as { prompt: string }).prompt;
    expect(prompt).toContain("docs/review/lenses/performance.md");
    expect(prompt).toContain("origin/main NOW");
    expect(prompt).toContain("Zero findings is a normal answer");
  });

  it("refutes one defect once when two lenses report it, and twice when they do not", async () => {
    const same = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/x.ts"], [at("src/server/x.ts", 40)], [at("src/server/x.ts", 42)]),
    );
    expect(traces(same.calls)).toHaveLength(1);
    const different = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/x.ts"], [at("src/server/x.ts", 40)], [at("src/server/x.ts", 90)]),
    );
    expect(traces(different.calls)).toHaveLength(2);
  });

  it("keeps two reports from one lens, even on the same line: the lens meant two defects", async () => {
    const { calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501] },
      replyFor(["src/server/x.ts"], [at("src/server/x.ts", 40), at("src/server/x.ts", 40)], []),
    );
    expect(traces(calls)).toHaveLength(2);
  });
});
