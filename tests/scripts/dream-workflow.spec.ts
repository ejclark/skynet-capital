import { describe, expect, it } from "@rstest/core";
import { type Reply, runWorkflow } from "../support/run-workflow";

// agent() resolves null when its agent stops or hits an unrecoverable API error. A memory review whose
// judging agent died used to return the same shape as one that ran and found nothing, and /dream's
// step 7 scores "nothing found" as a reason to stop scheduling it (#6718). These drive dream.js with
// each judging agent dead and pin the sibling workflows' `notRun` marker on the result.
const ARGS = { digests: ["1", "2", "3"], memoryDir: "m", staleReport: "none" };
const DIAL = {
  found: true,
  dispatch: true,
  position: "normal",
  grindWidth: 200,
  reason: "cleared: work-mode is normal",
};
const PATTERN = {
  what: "re-ran a failed push",
  kind: "repeated mistake",
  sessions: ["s1", "s2", "s3"],
  occurrences: 3,
  example: "s1: push again",
};
const PROPOSAL = {
  title: "stop re-running a failed push",
  action: "enforce",
  target: "a hook",
  change: "refuse a repeat push",
  why: "three sessions",
  captured: true,
  sessions: ["s1", "s2", "s3"],
  occurrences: 3,
};
const FINDING = { file: "m/a.md", kind: "stale", detail: "path gone", evidence: "no such file" };

/** Every agent answers, except the labels named in `dead`, which return null. */
const reply =
  (dead: string[] = []): Reply =>
  (_prompt, { label = "" }) => {
    if (dead.some((d) => label.startsWith(d))) return null;
    if (label === "work-mode") return DIAL;
    if (label.startsWith("analyze")) return { patterns: [PATTERN] };
    if (label === "check:memory") return { findings: [FINDING] };
    if (label === "propose") return { proposals: [PROPOSAL], dropped: [] };
    if (label.startsWith("attack")) return { refuted: false, why: "holds" };
    return null;
  };

/** Runs dream.js and hands back its result, failing the spec if the run threw instead. */
async function dream(answer: Reply) {
  const run = await runWorkflow("dream", ARGS, answer);
  if (!run.result) throw run.error ?? new Error("dream.js returned nothing");
  return { result: run.result, calls: run.calls };
}

describe("dream.js when a judging agent does not return", () => {
  it("a clean run carries no notRun marker", async () => {
    const { result } = await dream(reply());
    expect(result.notRun).toBeUndefined();
    expect(result.proposals).toHaveLength(1);
    expect(result.memoryFindings).toEqual([FINDING]);
  });

  it("a dead propose agent is named in notRun, not returned as an empty review", async () => {
    const { result } = await dream(reply(["propose"]));
    expect(result.notRun).toMatch(/propose/);
    expect(result.notRun).not.toMatch(/check/);
    expect(result.proposals).toEqual([]);
    expect(result.memoryFindings).toEqual([FINDING]);
  });

  it("a dead check agent is named in notRun, and propose is told the check did not run", async () => {
    const { result, calls } = await dream(reply(["check:memory"]));
    expect(result.notRun).toMatch(/check/);
    expect(result.notRun).not.toMatch(/propose/);
    expect(result.memoryFindings).toEqual([]);
    expect(result.proposals).toHaveLength(1);
    const propose = calls.find((c) => c.opts.label === "propose");
    expect(propose?.prompt).toMatch(/memory check did not return/);
  });

  it("both dead names both", async () => {
    const { result } = await dream(reply(["propose", "check:memory"]));
    expect(result.notRun).toMatch(/check/);
    expect(result.notRun).toMatch(/propose/);
  });

  it("a propose agent that throws counts as dead, not as a crashed run", async () => {
    const throwing: Reply = (prompt, opts) => {
      if (opts.label === "propose") throw new Error("api down");
      return reply()(prompt, opts);
    };
    const { result } = await dream(throwing);
    expect(result.notRun).toMatch(/propose/);
  });
});

// A memory citing another repo's issue ("claude-code #12345") reads as a 404 here, forever. The check
// agent reports it "unchecked". That is one row the review could not judge, not a stage that died, so
// it must not raise notRun — step 7 would re-run a review no re-run can fix, and never score it (#7728).
describe("dream.js when a memory row could not be checked", () => {
  const UNCHECKED = {
    file: "m/cross-repo.md",
    kind: "unchecked",
    detail: "claude-code #12345 unreadable",
    evidence: "404 in this repo",
  };
  const withUnchecked: Reply = (prompt, opts) =>
    opts.label === "check:memory" ? { findings: [FINDING, UNCHECKED] } : reply()(prompt, opts);

  it("names the row in unchecked and leaves the run scoreable", async () => {
    const { result } = await dream(withUnchecked);
    expect(result.notRun).toBeUndefined();
    expect(result.proposals).toHaveLength(1);
    expect(result.unchecked).toEqual(["m/cross-repo.md: claude-code #12345 unreadable"]);
  });

  it("still keeps the row out of what propose may retire", async () => {
    const { calls } = await dream(withUnchecked);
    const propose = calls.find((c) => c.opts.label === "propose");
    expect(propose?.prompt).not.toMatch(/cross-repo/);
    expect(propose?.prompt).toMatch(/m\/a\.md/);
  });

  it("a dead propose stage still raises notRun beside the unchecked row", async () => {
    const deadPropose: Reply = (prompt, opts) =>
      opts.label === "propose" ? null : withUnchecked(prompt, opts);
    const { result } = await dream(deadPropose);
    expect(result.notRun).toMatch(/propose/);
    expect(result.notRun).not.toMatch(/cross-repo/);
    expect(result.unchecked).toEqual(["m/cross-repo.md: claude-code #12345 unreadable"]);
  });

  it("a clean run carries no unchecked list", async () => {
    const { result } = await dream(reply());
    expect(result.unchecked).toBeUndefined();
  });
});
