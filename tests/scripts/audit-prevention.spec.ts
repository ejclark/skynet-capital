import { describe, expect, it } from "@rstest/core";
import { type Reply, runWorkflow } from "../support/run-workflow";

// The audit's last step: what it confirmed becoming a proposed spec, gate line or reviewer line. Which
// causes earn a proposal is decided in the script, so these drive it with a stubbed grouper and read
// what comes back. Whether a real agent groups findings well is only shown by a real run.
const finding = (summary: string) => ({
  severity: "high",
  file: `${summary}.ts`,
  summary,
  failure_scenario: "f",
});

const proposal = {
  kind: "spec",
  target: "tests/arch/x.spec.ts",
  line: "assert the exit status",
  why: "would have failed on both",
};

function replyWith(findings: ReturnType<typeof finding>[], causes: unknown): Reply {
  return (_prompt, { label }) => {
    if (label === "work-mode")
      return { found: true, dispatch: true, position: "normal", grindWidth: 200 };
    if (label === "dead agents") return { left: [] };
    if (label === "prevention") return causes;
    if (label?.startsWith("triage")) return { merged: true, files: ["x.ts"], protected: false };
    if (label?.startsWith("review")) return { merged: true, findings };
    return { refuted: false, evidence: "e" };
  };
}

const audit = (findings: ReturnType<typeof finding>[], causes: unknown) =>
  runWorkflow("post-merge-audit", { prs: [6501] }, replyWith(findings, causes));
const asked = (calls: { prompt: string; opts: { label?: string } }[]) =>
  calls.find((c) => c.opts.label === "prevention");

type Prevention = {
  proposals: { cause: string; findings: { summary: string }[]; lesson?: string }[];
  otherCauses: string[];
};
const prevention = (result: unknown) => (result as { prevention: Prevention }).prevention;

describe("the audit's prevention step", () => {
  it("pays for no agent with fewer than two confirmed findings", async () => {
    const { calls, result } = await audit([finding("a")], { causes: [] });
    expect(asked(calls)).toBeUndefined();
    expect(prevention(result).proposals).toEqual([]);
  });

  it("does not count a refuted finding towards the two", async () => {
    const reply: Reply = (prompt, opts) =>
      opts.label?.startsWith("trace #6501.2")
        ? { refuted: true, evidence: "guarded upstream" }
        : replyWith([finding("a"), finding("b")], { causes: [] })(prompt, opts);
    const { calls } = await runWorkflow("post-merge-audit", { prs: [6501] }, reply);
    expect(asked(calls)).toBeUndefined();
  });

  it("proposes one line for a cause seen twice, and names the findings behind it", async () => {
    const { result, logs } = await audit([finding("a"), finding("b")], {
      causes: [{ cause: "a pipeline hides the exit status", findings: [0, 1], ...proposal }],
    });
    expect(prevention(result).proposals).toEqual([
      expect.objectContaining({
        cause: "a pipeline hides the exit status",
        kind: "spec",
        target: "tests/arch/x.spec.ts",
        line: "assert the exit status",
        findings: [
          expect.objectContaining({ pr: 6501, summary: "a" }),
          expect.objectContaining({ pr: 6501, summary: "b" }),
        ],
      }),
    ]);
    expect(logs.join("\n")).toContain("1 proposal");
  });

  // The rule stays a rule: an agent cannot talk a one-off into a proposal.
  it("keeps a cause seen once out of the proposals, even when the agent drafted one", async () => {
    const { result } = await audit([finding("a"), finding("b")], {
      causes: [
        { cause: "one-off a", findings: [0], ...proposal },
        { cause: "one-off b", findings: [1] },
      ],
    });
    expect(prevention(result).proposals).toEqual([]);
    expect(prevention(result).otherCauses).toEqual(["one-off a", "one-off b"]);
  });

  it("proposes for a cause seen once when docs/LESSONS.md already names it", async () => {
    const { result } = await audit([finding("a"), finding("b")], {
      causes: [
        {
          cause: "stale cached ref",
          findings: [0],
          lesson: "2026-09-04: fetch first",
          ...proposal,
        },
      ],
    });
    expect(prevention(result).proposals).toEqual([
      expect.objectContaining({ cause: "stale cached ref", lesson: "2026-09-04: fetch first" }),
    ]);
  });

  it("counts distinct real findings, so a repeated or invented id cannot reach two", async () => {
    const { result } = await audit([finding("a"), finding("b")], {
      causes: [{ cause: "padded", findings: [0, 0, 99, -1], ...proposal }],
    });
    expect(prevention(result).proposals).toEqual([]);
    expect(prevention(result).otherCauses).toEqual(["padded"]);
  });

  it("does not return a repeated cause with no line to file", async () => {
    const { result } = await audit([finding("a"), finding("b")], {
      causes: [{ cause: "no draft", findings: [0, 1] }],
    });
    expect(prevention(result).proposals).toEqual([]);
    expect(prevention(result).otherCauses).toEqual(["no draft"]);
  });

  it("runs one small worker on the findings it was given, and asks it to write nothing", async () => {
    const { calls } = await audit([finding("first"), finding("second")], { causes: [] });
    const step = asked(calls) as { prompt: string; opts: Record<string, unknown> };
    expect(calls.filter((c) => c.opts.label === "prevention")).toHaveLength(1);
    expect(step.opts).toMatchObject({ agentType: "worker", model: "sonnet", phase: "Prevent" });
    expect(step.prompt).toContain("first");
    expect(step.prompt).toContain("second");
    expect(step.prompt).toContain("docs/LESSONS.md");
    expect(step.prompt).toMatch(/never file|file nothing/i);
  });

  it("still returns the confirmed findings when the agent dies or cannot start", async () => {
    const died = await audit([finding("a"), finding("b")], null);
    expect(died.result?.confirmed).toHaveLength(2);
    expect(prevention(died.result).proposals).toEqual([]);
    expect(died.result?.deadAgents).toEqual([
      expect.objectContaining({ agent: expect.stringContaining("prevention") }),
    ]);

    const reply: Reply = (prompt, opts) => {
      if (opts.label === "prevention") throw new Error("out of budget");
      return replyWith([finding("a"), finding("b")], null)(prompt, opts);
    };
    const threw = await runWorkflow("post-merge-audit", { prs: [6501] }, reply);
    expect(threw.error).toBeNull();
    expect(threw.result?.confirmed).toHaveLength(2);
    expect(prevention(threw.result).proposals).toEqual([]);
  });
});
