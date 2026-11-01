import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  gradeOf,
  horizonOf,
  parseCallLinks,
  parseForwardTests,
  passRate,
  readCorpus,
  renderMarkdown,
  scorecard,
  THIN_CELL,
  verdictOf,
} from "../../scripts/research-scorecard.mjs";

// #4061 (slice 3 of #3955): WHEN the research scorecard runs, the system SHALL report forward-test
// calls by confidence and horizon — pass / kill / open counts — joined through the call sheet row
// that names each test as its falsifier.

const HEADER =
  "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n";
const fragment = (rows: string[]) => `# Forward tests — e\n\n${HEADER}${rows.join("\n")}\n`;
const ledger = (rows: string[]) =>
  [
    "## At a glance",
    "",
    "| Horizon | Call | Confidence | Why | Proves it wrong |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

describe("verdictOf", () => {
  it.each([
    ["_open_", "open"],
    ["—", "open"],
    ["", "open"],
    ["unscored — fill at close-out", "open"],
    ["**pass** — scored 2026-09-10", "pass"],
    ["PASSED. ONS bulletin", "pass"],
    ["CONFIRMED 2026-09-16), to the minute", "pass"],
    ["SCORED 2026-09-10 — FAIL. The null broke", "kill"],
    ["**KILLED** — the S", "kill"],
    ["pass — the kill switch never fired", "pass"],
    ["VOID — landed in the band", "void"],
    ["killed — this id superseded by x (#2318)", "void"],
    ["UNTESTED (scored as a miss on the prediction, not a kill)", "void"],
    ["**`unscoreable`** — data lands 2026-10-30", "unscoreable"],
    ["not scoreable before close-out", "unscoreable"],
    ["see the thread", "unread"],
  ])("%j → %s", (cell, want) => {
    expect(verdictOf(cell)).toBe(want);
  });
});

describe("parseForwardTests", () => {
  it("takes the outcome after the last dated cell, escaped pipes and all", () => {
    const rows = parseForwardTests(
      fragment([
        "| FT-e-1 | h | 2026-09-01 lead-date prediction | k \\| abs | 2026-09-20 | **pass** |",
        "| FT-e-2 | h | p | k | 2026-10-01 | _open_ |",
      ]),
    );
    expect(rows).toEqual([
      { id: "FT-e-1", verdict: "pass", scoreBy: "2026-09-20" },
      { id: "FT-e-2", verdict: "open", scoreBy: "2026-10-01" },
    ]);
  });

  it("falls back to the header's Outcome column when score-by is not a leading date", () => {
    const rows = parseForwardTests(
      fragment(["| FT-3 | h | p | k | ~2026-09-11 | **SCORED 2026-09-03 — KILLED** | tail |"]),
    );
    expect(rows).toEqual([{ id: "FT-3", verdict: "kill", scoreBy: null }]);
  });
});

describe("parseCallLinks", () => {
  it("links each named FT id to its row's horizon and grade, by header name", () => {
    const links = parseCallLinks(
      ledger([
        "| **Today (D-20)** | Stand aside | **High** | w | nothing dated |",
        "| This month | Refuse | High (was Medium) | w | registered as **FT-e-1**, score by 2026-10-06 |",
        "| This quarter | Stand aside | Medium-high | w | FT-e-2 and FT-e-1. |",
      ]),
    );
    expect(links).toEqual([
      { id: "FT-e-1", horizon: "this month", grade: "high" },
      { id: "FT-e-2", horizon: "this quarter", grade: "medium-high" },
      { id: "FT-e-1", horizon: "this quarter", grade: "medium-high" },
    ]);
  });

  it("ignores FT mentions in tables that are not call sheets", () => {
    expect(parseCallLinks("| Name | Note |\n|---|---|\n| x | FT-e-1 |\n")).toEqual([]);
  });

  it("normalises the spellings authors use", () => {
    expect(horizonOf("__ This week")).toBe("this week");
    expect(horizonOf("D+1")).toBe("other");
    expect(gradeOf("Med-high")).toBe("medium-high");
    expect(gradeOf("medium")).toBe("medium");
    expect(gradeOf("")).toBe("ungraded");
  });
});

describe("scorecard", () => {
  const tests = [
    { id: "FT-a-1", verdict: "pass" as const },
    { id: "FT-a-2", verdict: "kill" as const },
    { id: "FT-a-3", verdict: "open" as const },
    { id: "FT-b-1", verdict: "pass" as const },
  ];
  const links = [
    { id: "FT-a-1", horizon: "this week" as const, grade: "high" as const },
    { id: "FT-a-1", horizon: "this month" as const, grade: "medium" as const },
    { id: "FT-a-2", horizon: "this month" as const, grade: "medium" as const },
    { id: "FT-a-3", horizon: "this quarter" as const, grade: "high" as const },
    { id: "FT-gone-9", horizon: "today" as const, grade: "low" as const },
  ];
  const card = scorecard({ tests, links });

  it("counts every test once, under its first (nearest) call row", () => {
    expect(card.total).toBe(4);
    expect(card.linked).toBe(3);
    expect(card.multiLinked).toBe(1);
    expect(card.byGrade.high).toMatchObject({ pass: 1, kill: 0, open: 1 });
    expect(card.byGrade.medium).toMatchObject({ pass: 0, kill: 1 });
    expect(card.byHorizon["this week"].pass).toBe(1);
    expect(card.byHorizon["this month"].kill).toBe(1);
  });

  it("keeps a test no call names under unlinked — never invents a grade", () => {
    expect(card.unlinked).toMatchObject({ pass: 1 });
    expect(card.byGrade.low.pass + card.byGrade.low.kill).toBe(0);
  });

  it("pass rate ignores open, void and unscoreable rows", () => {
    expect(passRate(card.byGrade.high)).toBe(1);
    expect(passRate(card.byGrade.ungraded)).toBeNull();
  });

  it("renders the three tables with the pass rate", () => {
    const md = renderMarkdown(card, "2026-09-30");
    expect(md).toContain("| Confidence | Pass | Kill | Pass rate |");
    expect(md).toContain("| high | 1 | 0 | 100% |");
    expect(md).toContain("| Horizon |");
    expect(md).toContain("| unlinked | 1 | 0 | 100% |");
  });
});

// 2026-10-31 (the loop census, "scorecard-falsifier-fired"): high 75% and medium 76% read as a tie,
// but medium calls sit at longer horizons, and this quarter had 186 of 226 calls still open — its
// 86% is the calls that resolved early. The comparison that can move the sizing rule is high
// against medium WITHIN a horizon, over calls whose score-by date has passed, with a thin cell
// said to be thin rather than read as a percentage.
describe("confidence by horizon, matured calls only", () => {
  const today = "2026-11-03";
  const tests = [
    { id: "FT-w-1", verdict: "pass" as const, scoreBy: "2026-10-01" },
    { id: "FT-w-2", verdict: "kill" as const, scoreBy: "2026-10-02" },
    { id: "FT-w-3", verdict: "pass" as const, scoreBy: "2026-10-03" },
    { id: "FT-w-4", verdict: "open" as const, scoreBy: "2026-10-04" },
    { id: "FT-q-1", verdict: "pass" as const, scoreBy: "2026-12-31" },
    { id: "FT-q-2", verdict: "pass" as const, scoreBy: null },
  ];
  const links = [
    { id: "FT-w-1", horizon: "this week" as const, grade: "high" as const },
    { id: "FT-w-2", horizon: "this week" as const, grade: "high" as const },
    { id: "FT-w-3", horizon: "this week" as const, grade: "medium" as const },
    { id: "FT-w-4", horizon: "this week" as const, grade: "medium" as const },
    { id: "FT-q-1", horizon: "this quarter" as const, grade: "high" as const },
    { id: "FT-q-2", horizon: "this quarter" as const, grade: "medium" as const },
  ];
  const card = scorecard({ tests, links, today });

  it("parseForwardTests carries the score-by date, or null when the cell leads with none", () => {
    const rows = parseForwardTests(
      fragment([
        "| FT-e-1 | h | p | k | 2026-09-20 | **pass** |",
        "| FT-e-2 | h | p | k | ~2026-09-11 | _open_ |",
      ]),
    );
    expect(rows).toEqual([
      { id: "FT-e-1", verdict: "pass", scoreBy: "2026-09-20" },
      { id: "FT-e-2", verdict: "open", scoreBy: null },
    ]);
  });

  it("counts a call only once its score-by date has passed; a future or undated one waits", () => {
    expect(card.matured.cells["this week"].high).toMatchObject({ pass: 1, kill: 1 });
    expect(card.matured.cells["this week"].medium).toMatchObject({ pass: 1, open: 1 });
    expect(card.matured.cells["this quarter"].high).toMatchObject({ pass: 0, kill: 0 });
    expect(card.matured.notYet).toBe(1);
    expect(card.matured.undated).toBe(1);
    expect(card.matured.pastDueOpen).toBe(1);
  });

  it("renders high beside medium within each horizon, naming a thin cell as thin", () => {
    const md = renderMarkdown(card, today);
    expect(md).toContain("| Matured by 2026-11-03 | high | medium-high | medium | low |");
    expect(md).toContain("| this week | thin: 1/2 | — | thin: 1/1 | — |");
    expect(md).toContain(`fewer than ${THIN_CELL} decided`);
    expect(md).toContain("1 matured call(s) still open past their date");
  });

  it("prints a percentage once a cell has enough decided calls", () => {
    const many = Array.from({ length: THIN_CELL }, (_, i) => ({
      id: `FT-m-${i}`,
      verdict: (i < 8 ? "pass" : "kill") as "pass" | "kill",
      scoreBy: "2026-10-01",
    }));
    const manyLinks = many.map((t) => ({
      id: t.id,
      horizon: "this month" as const,
      grade: "high" as const,
    }));
    const md = renderMarkdown(scorecard({ tests: many, links: manyLinks, today }), today);
    expect(md).toContain(`| this month | 80% (8/${THIN_CELL}) | — | — | — |`);
  });
});

describe("readCorpus", () => {
  it("refuses to guess when the register is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "scorecard-"));
    try {
      expect(() => readCorpus(dir)).toThrow(/refusing to guess/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("joins a seeded register to its ledger", () => {
    const dir = mkdtempSync(join(tmpdir(), "scorecard-"));
    try {
      mkdirSync(join(dir, "docs/research/forward-tests"), { recursive: true });
      mkdirSync(join(dir, "docs/research/events"), { recursive: true });
      writeFileSync(
        join(dir, "docs/research/forward-tests/e.md"),
        fragment(["| FT-e-1 | h | p | k | 2026-09-20 | **pass** |"]),
      );
      writeFileSync(
        join(dir, "docs/research/events/e.md"),
        ledger(["| This week | Stand aside | High | w | FT-e-1 by 2026-09-20 |"]),
      );
      const card = scorecard(readCorpus(dir));
      expect(card.byGrade.high.pass).toBe(1);
      expect(card.byHorizon["this week"].pass).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the committed corpus", () => {
  it("reads every forward-test row and links some to call sheets", () => {
    const card = scorecard(readCorpus());
    expect(card.total).toBeGreaterThan(1000);
    expect(card.linked).toBeGreaterThan(0);
  });
});
