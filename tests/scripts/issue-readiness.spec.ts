import { execFileSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
import {
  declaredPrs,
  PARKING_LABELS,
  parkedBy,
  protectedPaths,
  readinessNotes,
  sizeCell,
} from "../../scripts/issue-readiness.mjs";
import { renderReport, reportRow } from "../../scripts/ready-report.mjs";

// The readiness rubric from #4056's predictive study: what committed work should carry when it goes
// `ready`, reported as advice. Fixtures are shaped on the real open ready plans the first report ran
// over (#3194 parked + ready, #3407 at ~22 PRs, #3959 clean).
const capsule = (size: string, extra = "") =>
  [
    "**Do the thing.**",
    "",
    "| | |",
    "|---|---|",
    "| **Status** | ready |",
    `| **Size** | ${size} |`,
    "",
    extra,
  ].join("\n");

const EARS = "WHEN the member saves, the system SHALL show the row.";
const AS_OF = "Where it stands, read at `main` `25b8c6e8`.";

describe("readiness: the parking set", () => {
  it("defines the four labels that each mean 'waits on someone'", () => {
    expect(PARKING_LABELS).toEqual(["needs-eric", "needs-info", "needs-design", "hold-merge"]);
  });

  it("names which parking labels an issue carries", () => {
    expect(parkedBy(["plan", "ready", "needs-eric"])).toEqual(["needs-eric"]);
    expect(parkedBy(["plan", "ready", "next-slice"])).toEqual([]);
  });
});

describe("readiness: reading the Size cell", () => {
  it("reads a leading PR count, the top of a range, and slices as PRs", () => {
    expect(declaredPrs(sizeCell(capsule("~2 PRs")))).toBe(2);
    expect(declaredPrs(sizeCell(capsule("2–3 PRs, independent")))).toBe(3);
    expect(declaredPrs(sizeCell(capsule("~9 slices + slice B, 3 Eric merges")))).toBe(9);
    expect(declaredPrs(sizeCell(capsule("5 phases, ~22 PRs")))).toBe(22);
  });

  it("returns null when the cell names no count, or there is no cell", () => {
    expect(declaredPrs(sizeCell(capsule("unsliced — pre-interrogation")))).toBeNull();
    expect(sizeCell("no table here")).toBeNull();
  });
});

describe("readiness: notes on committed work", () => {
  it("says nothing when labels were not checked, or the issue is not committed work", () => {
    expect(readinessNotes({ title: "x", body: capsule("~9 PRs") })).toEqual([]);
    expect(readinessNotes({ title: "x", body: capsule("~9 PRs"), labels: ["bug"] })).toEqual([]);
  });

  it("gives a well-shaped, small, dated build plan no notes", () => {
    const body = capsule("~2 PRs", `${EARS}\n${AS_OF}`);
    expect(readinessNotes({ title: "Add the row", body, labels: ["plan", "ready"] })).toEqual([]);
  });

  it("flags ready while parked, and treats ready + next-slice as legal", () => {
    const body = capsule("~2 PRs", `${EARS}\n${AS_OF}`);
    const parked = readinessNotes({ title: "t", body, labels: ["plan", "ready", "needs-eric"] });
    expect(parked.join()).toContain("ready while parked by needs-eric");
    const remainder = readinessNotes({ title: "t", body, labels: ["plan", "ready", "next-slice"] });
    expect(remainder).toEqual([]);
  });

  it("flags a plan past one delivery unit, and asks for a count when there is none", () => {
    const labels = ["plan"];
    const big = readinessNotes({
      title: "t",
      body: capsule("~22 PRs", `${EARS}\n${AS_OF}`),
      labels,
    });
    expect(big.join()).toContain("declares ~22 PRs");
    const blank = readinessNotes({ title: "t", body: capsule("big", `${EARS}\n${AS_OF}`), labels });
    expect(blank.join()).toContain("names no PR count");
  });

  it("asks a decision-shaped plan for its Done when line, and not for EARS", () => {
    const body = capsule("~1 PR", AS_OF);
    const open = readinessNotes({ title: "Decide how text enters", body, labels: ["plan"] });
    expect(open.join()).toContain("no `Done when` line");
    expect(open.join()).not.toContain("SHALL");
    const settled = readinessNotes({
      title: "Decide how text enters",
      body: `${body}\nDone when the call is recorded on the issue.`,
      labels: ["plan"],
    });
    expect(settled).toEqual([]);
  });

  it("accepts EARS written in lowercase, and flags a build plan with none", () => {
    const lower = capsule("~2 PRs", `WHEN x, the system shall y.\n${AS_OF}`);
    expect(readinessNotes({ title: "Build", body: lower, labels: ["plan"] })).toEqual([]);
    const none = readinessNotes({
      title: "Build",
      body: capsule("~2 PRs", AS_OF),
      labels: ["plan"],
    });
    expect(none.join()).toContain("no WHEN/IF … SHALL");
  });

  it("flags a named protected path with no route, and accepts one routed to the platter", () => {
    const naked = capsule(
      "~2 PRs",
      `${EARS}\n${AS_OF}\nEdit \`.github/workflows/pipeline.yml:215\`.`,
    );
    expect(readinessNotes({ title: "t", body: naked, labels: ["plan"] }).join()).toContain(
      "names protected .github/workflows/pipeline.yml",
    );
    const routed = `${naked}\nThat edit rides the platter.`;
    expect(readinessNotes({ title: "t", body: routed, labels: ["plan"] })).toEqual([]);
  });

  it("counts .claude/ as protected even though the envelope does not list it", () => {
    const rules = [{ pattern: ".github/workflows/**" }];
    expect(protectedPaths("change `.claude/workflows/grind.js`", rules)).toEqual([
      ".claude/workflows/grind.js",
    ]);
    expect(protectedPaths("change `scripts/issues.mjs`", rules)).toEqual([]);
  });
});

describe("readiness: reaches every filing through issue-lint", () => {
  it("adds readiness notes as notes, never as problems", () => {
    const body = capsule("~22 PRs", "a body with no criteria");
    const out = execFileSync(
      "node",
      [
        "scripts/issue-lint.mjs",
        "--stdin",
        "--json",
        "--title",
        "Build the thing",
        "--labels",
        "plan",
      ],
      { input: body, encoding: "utf8" },
    );
    const { problems, notes } = JSON.parse(out) as { problems: string[]; notes: string[] };
    expect(problems).toEqual([]);
    expect(notes.some((n) => n.startsWith("readiness: declares ~22 PRs"))).toBe(true);
  });
});

describe("ready report", () => {
  const issue = (number: number, labels: string[], size: string) => ({
    number,
    title: `Build ${number}`,
    labels: labels.map((name) => ({ name })),
    body: capsule(size, `${EARS}\n${AS_OF}`),
    sub_issues_summary: { total: 0 },
  });

  it("builds a row from a REST issue, notes stripped of their prefix", () => {
    const row = reportRow(issue(3194, ["plan", "ready", "needs-eric"], "~6 PRs"));
    expect(row.prs).toBe(6);
    expect(row.notes[0]).toMatch(/^ready while parked by needs-eric/);
    expect(row.notes.every((n) => !n.includes("#4056"))).toBe(true);
  });

  it("puts flagged rows first and counts clean ones", () => {
    const rows = [
      reportRow(issue(3959, ["plan", "ready"], "~2 PRs")),
      reportRow(issue(3407, ["plan", "ready"], "~22 PRs")),
    ];
    const table = renderReport(rows);
    expect(table).toContain("2 open `ready` issues · 1 with readiness notes · 1 clean");
    expect(table.indexOf("#3407")).toBeLessThan(table.indexOf("#3959"));
    expect(table).toContain("| #3959 Build 3959 | ~2 PRs | 0 | clean |");
  });
});
