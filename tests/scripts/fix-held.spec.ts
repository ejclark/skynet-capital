import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { fixHeld, parseLessons, preventionOf, renderMarkdown } from "../../scripts/fix-held.mjs";

// #4062 (slice 4 of #3955): WHEN the fix-held check runs, the system SHALL match incident-scan
// candidates to LESSONS classes and flag each class that recurred after its fix.

const entry = (title: string, lines: string[]) => `### ${title}\n${lines.join("\n")}\n`;
const LEDGER = [
  "# Lessons\n",
  "```\n### <short title>\n- **SHA:** <sha>   **DATE:** YYYY-MM-DD   **STATUS:** closed\n```\n",
  entry("Deploy gate ran inside the job it counted", [
    "- **SHA:** abc1234   **DATE:** 2026-08-11   **STATUS:** closed",
    "- **COVERS:** def5678 1111111",
    "- **SIGNAL:** `pipeline.yml` red",
    "- **PREVENTION:** gate — moved the counter out of `deploy`",
  ]),
  entry("A prose rule was skipped", [
    "- **SHA:** n/a   **DATE:** 2026-09-17   **STATUS:** closed",
    "- **PREVENTION:** doctrine line in CLAUDE.md",
  ]),
  entry("The prose rule was skipped again", [
    "- **SHA:** n/a   **DATE:** 2026-09-22   **STATUS:** closed",
    "- **RECURS:** A prose rule was skipped",
    "- **PREVENTION:** ledger-only, the honest ranking",
  ]),
].join("\n");

describe("preventionOf", () => {
  it.each([
    ["gate — pin the version", "mechanized"],
    ["gate + doctrine. (1) the lint rule", "mechanized"],
    ["script — `withRetry()`", "mechanized"],
    ["two gates, deliberately not one", "mechanized"],
    ["already mechanized (see `615a269`)", "mechanized"],
    ["doctrine line in CLAUDE.md", "doctrine"],
    ["ledger-only, justified explicitly", "ledger-only"],
    ["ledger-only, deliberately not mechanized here", "ledger-only"],
    ["tracked on #3307, not yet fixed", "unfixed"],
    ["two layers. (1) The setting is enabled", "unclassified"],
  ])("%j → %s", (line, want) => {
    expect(preventionOf(line)).toBe(want);
  });
});

describe("parseLessons", () => {
  const lessons = parseLessons(LEDGER);

  it("skips the header's format example and reads every real entry", () => {
    expect(lessons.map((l) => l.title)).toEqual([
      "Deploy gate ran inside the job it counted",
      "A prose rule was skipped",
      "The prose rule was skipped again",
    ]);
  });

  it("collects SHA and COVERS shas, the workflows named, and a RECURS pointer", () => {
    expect(lessons[0]?.shas).toEqual(["abc1234", "def5678", "1111111"]);
    expect(lessons[0]?.workflows).toEqual(["pipeline.yml"]);
    expect(lessons[2]?.recurs).toBe("A prose rule was skipped");
  });
});

describe("fixHeld", () => {
  const lessons = parseLessons(LEDGER);

  it("flags a declared recurrence against the EARLIER class and its prevention type", () => {
    const report = fixHeld({ lessons, runs: null });
    expect(report.recurrences).toHaveLength(1);
    expect(report.recurrences[0]?.lesson.title).toBe("A prose rule was skipped");
    expect(report.byPrevention.doctrine).toEqual({ lessons: 1, recurred: 1 });
    expect(report.live).toBe(false);
  });

  it("names a failed run a lesson covers as a recurrence only when it came after the lesson", () => {
    const runs = [
      { sha: "def5678", date: "2026-08-10", name: "Pipeline", learned: true },
      { sha: "1111111", date: "2026-09-02", name: "Pipeline", learned: true },
    ];
    const named = fixHeld({ lessons, runs }).recurrences.filter((r) => r.via === "named");
    expect(named.map((r) => r.by)).toEqual(["1111111 Pipeline"]);
  });

  it("lists unlearned runs on a workflow an earlier lesson names as possible — never counted", () => {
    const runs = [
      {
        sha: "9999999",
        date: "2026-09-30",
        name: "Pipeline",
        path: ".github/workflows/pipeline.yml",
        learned: false,
      },
      {
        sha: "8888888",
        date: "2026-09-30",
        name: "Other",
        path: ".github/workflows/other.yml",
        learned: false,
      },
    ];
    const report = fixHeld({ lessons, runs });
    expect(report.possible).toHaveLength(1);
    expect(report.possible[0]?.file).toBe("pipeline.yml");
    expect(report.possible[0]?.leads[0]?.title).toBe("Deploy gate ran inside the job it counted");
    expect(report.byPrevention.mechanized.recurred).toBe(0);
  });

  it("reports a RECURS line that names no entry instead of dropping it", () => {
    const bad = parseLessons(
      `${LEDGER}\n${entry("Orphan", ["- **DATE:** 2026-09-01", "- **RECURS:** No such lesson"])}`,
    );
    expect(fixHeld({ lessons: bad, runs: null }).unresolved).toEqual([
      { from: "Orphan", recurs: "No such lesson" },
    ]);
  });

  it("renders the table and the recurrence", () => {
    const md = renderMarkdown(fixHeld({ lessons, runs: null }), "2026-09-30");
    expect(md).toContain("| doctrine | 1 | 1 | 100% |");
    expect(md).toContain("**A prose rule was skipped** (doctrine, 2026-09-17) ← declared");
  });
});

describe("the real ledger", () => {
  it("resolves every RECURS line to an earlier entry", () => {
    const lessons = parseLessons(readFileSync("docs/LESSONS.md", "utf8"));
    const report = fixHeld({ lessons, runs: null });
    expect(report.unresolved).toEqual([]);
    expect(report.recurrences.length).toBeGreaterThan(0);
  });
});
