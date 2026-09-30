import { execFileSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
import { baselineReport, readBaseline } from "../../scripts/bottleneck-baseline.mjs";

// #4063 (slice 5 of #3955): WHEN a bottleneck issue is filed, it SHALL carry a measured before
// number; WHEN it closes, it SHALL carry an after number — or say "unmeasured" and why.

describe("readBaseline", () => {
  it("reads a measured Before line, bulleted or bare", () => {
    expect(readBaseline("- **Before:** 63 comments / 7 days — 2026-09-30, REST count").before).toBe(
      "63 comments / 7 days — 2026-09-30, REST count",
    );
    expect(readBaseline("**Before:** 4 stuck issues").before).toBe("4 stuck issues");
  });

  it("accepts an honest `unmeasured — why`", () => {
    expect(readBaseline("**After:** unmeasured — logs expired").after).toBe(
      "unmeasured — logs expired",
    );
  });

  it("treats a placeholder as missing — TBD is the same miss as no line", () => {
    expect(readBaseline("**Before:** TBD")).toEqual({ before: null, after: null });
    expect(readBaseline("no lines at all")).toEqual({ before: null, after: null });
  });
});

describe("baselineReport", () => {
  const row = (number: number, created: string, state: string, body: string) => ({
    number,
    title: `bottleneck ${number}`,
    created_at: `${created}T00:00:00Z`,
    state,
    body,
  });
  const report = baselineReport([
    row(1, "2026-09-01", "closed", "old, no lines"),
    row(2, "2026-10-02", "open", "**Before:** 5 runs"),
    row(3, "2026-10-02", "open", "nothing measured"),
    row(4, "2026-10-03", "closed", "**Before:** 5 runs"),
    row(5, "2026-10-03", "closed", "**Before:** 5 runs\n**After:** 1 run"),
    { ...row(6, "2026-10-03", "open", ""), pull_request: {} },
  ]);

  it("counts pre-contract issues as legacy, never as silent misses", () => {
    expect(report.total).toBe(5);
    expect(report.legacy).toBe(1);
    expect(report.missingBefore).toEqual([3]);
  });

  it("flags a post-contract close with no After, and scores one with both", () => {
    expect(report.closedMissingAfter).toEqual([4]);
    expect(report.scored).toEqual([5]);
  });
});

describe("issue-lint — a bottleneck body carries its Before number", () => {
  const lint = (body: string, labels: string) => {
    const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--labels", labels];
    try {
      return JSON.parse(execFileSync("node", args, { input: body, encoding: "utf8" }));
    } catch (error) {
      return JSON.parse((error as { stdout?: Buffer }).stdout?.toString() ?? "{}");
    }
  };
  const body = (extra: string) =>
    ["**Stop the retry storm.**", "", "- A talking point.", extra, "", "Picture: waived."].join(
      "\n",
    );
  const baselineProblem = (p: string[]) => p.filter((x) => x.includes("**Before:**"));

  it("refuses a bottleneck with no Before line", () => {
    expect(baselineProblem(lint(body(""), "bottleneck").problems)).toHaveLength(1);
  });

  it("passes a measured one, and never checks an issue without the label", () => {
    expect(baselineProblem(lint(body("- **Before:** 63 comments"), "bottleneck").problems)).toEqual(
      [],
    );
    expect(baselineProblem(lint(body(""), "bug").problems)).toEqual([]);
  });
});
