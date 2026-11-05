import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { asksDue } from "../../scripts/newsletter/asks.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { defects, fitness, loopsMoved, prKind } from "../../scripts/newsletter/metrics.mjs";
import {
  auditRecord,
  paceReading,
  planBlock,
  planLogLines,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/newsletter/records.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { jobRows, tokenSplit } from "../../scripts/newsletter/split.mjs";
import {
  cadenceOf,
  isDue,
  parseWeek,
  previousWeek,
  weekOf,
  windowOf,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/newsletter/week.mjs";

// The newsletter's parts (#6872, N1). Each is pure, so each is pinned on the case that would make
// a week's numbers wrong without anything failing: a week off by one, an audit read as zero, a
// rollover that starves, a bucket guessed.

const W45 = windowOf("2026-W45", Date.parse("2026-11-09T00:00:00Z"));

describe("the calendar", () => {
  it("reads an ISO week as Monday 00:00Z to the next Monday, which is Sunday 18:00 CST", () => {
    const w = parseWeek("2026-W45");
    expect([w.start, w.end]).toEqual(["2026-11-02", "2026-11-09"]);
    expect(new Date(w.endMs).toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });

  it("crosses a year with a 53rd week, and refuses a week that does not exist", () => {
    expect(previousWeek("2027-W01")).toBe("2026-W53");
    expect(weekOf(Date.parse("2027-01-01T12:00:00Z"))).toBe("2026-W53");
    expect(() => parseWeek("2027-W53")).toThrow(/not a week/);
    expect(() => parseWeek("2026-45")).toThrow(/YYYY-Www/);
  });

  it("cuts a week not yet over at asOf and says partial; a week not started throws", () => {
    const mid = windowOf("2026-W45", Date.parse("2026-11-05T12:00:00Z"));
    expect([mid.until, mid.partial]).toEqual(["2026-11-05T12:00:00.000Z", true]);
    expect(W45.partial).toBe(false);
    expect(() => windowOf("2026-W46", Date.parse("2026-11-05T00:00:00Z"))).toThrow(/not started/);
  });

  it("falls due weekly always, every two weeks from W45, monthly in the first-Monday week", () => {
    expect(
      ["2026-W44", "2026-W45", "2026-W46", "2026-W47"].map((w) => isDue("every two weeks", w)),
    ).toEqual([false, true, false, true]);
    expect(["2026-W45", "2026-W49", "2026-W50"].map((w) => isDue("monthly", w))).toEqual([
      true,
      false,
      true,
    ]);
    expect(cadenceOf("**Every two weeks**")).toBe("every two weeks");
    expect(cadenceOf("Quarterly")).toBeNull();
  });
});

describe("the records", () => {
  const table = (rows: string[]) =>
    [
      "**Post-merge audit, 2026-11-02, batch B: 3 defects.**",
      "",
      "| | |",
      "|---|---|",
      ...rows,
    ].join("\n");

  it("reads an audit from its receipt when it has one, else from its table", () => {
    const fromTable = auditRecord({
      id: 1,
      createdAt: "2026-11-02T14:00:00Z",
      body: table([
        "| PRs reviewed | #1 #2, all merged 2026-11-01 |",
        "| Confirmed | 3, all medium |",
        "| Price | 26 agents, 1.73M tokens |",
      ]),
    });
    expect([
      fromTable.prs,
      fromTable.confirmed,
      fromTable.tokens,
      fromTable.batch,
      fromTable.source,
    ]).toEqual([[1, 2], 3, 1730000, "B", "table"]);
    const withReceipt = auditRecord({
      id: 2,
      createdAt: "x",
      body: `${table(["| PRs reviewed | #1 |", "| Confirmed | 9 |"])}\n<!-- audit-receipt {"prs":[5,6],"confirmed":2} -->`,
    });
    expect([withReceipt.prs, withReceipt.confirmed, withReceipt.source]).toEqual([
      [5, 6],
      2,
      "receipt",
    ]);
  });

  it("counts an audit with no count as unreadable, never as one that found nothing", () => {
    const cut = auditRecord({
      id: 3,
      createdAt: "x",
      body: table(["| PRs reviewed | #1 |", "| Confirmed | #6326, #6327: 0.3 per PR |"]),
    });
    expect([cut.confirmed, cut.readable]).toEqual([null, false]);
    expect(auditRecord({ id: 4, createdAt: "x", body: "**Surge closed**" })).toBeNull();
  });

  it("reads #4153's pace from its title, and the reading's time from its hidden marker", () => {
    const pace = paceReading(
      "Work mode: NORMAL · pace: week 6% used, 26% gone, behind pace by 20, resets 11-10 05:00Z",
      '<!-- pace-reading {"readAt":"2026-11-05T01:02:09Z","resetsAt":"2026-11-10T05:00:00Z"} -->',
    );
    expect([pace.mode, pace.used, pace.gone, pace.gap, pace.readAt]).toEqual([
      "normal",
      6,
      26,
      -20,
      "2026-11-05T01:02:09Z",
    ]);
    expect(paceReading("Work mode: HALT", "").used).toBeNull();
  });

  it("takes only Log lines dated in the week, and stops at the builder's half", () => {
    const body = [
      "## State block",
      "**Log**",
      "- 2026-11-01 · before",
      "- 2026-11-02 · in",
      "- 2026-11-09 · after",
      "### For the builder",
      "- 2026-11-03 · not a log line",
    ].join("\n");
    expect(planLogLines(body, W45)).toEqual([{ date: "2026-11-02", text: "in" }]);
    expect(planLogLines("**Log**\n- 2026-11-03 · no block", W45)).toEqual([]);
  });

  it("names what is wrong with a plan block instead of reading it as no commitments", () => {
    expect(planBlock("no block").problem).toMatch(/no newsletter-plan/);
    expect(planBlock("<!-- newsletter-plan {oops} -->").problem).toMatch(/not JSON/);
    expect(
      planBlock('<!-- newsletter-plan {"commitments":[{"id":"a","text":"t"}]} -->').problem,
    ).toMatch(/1 commitment/);
  });
});

describe("the metrics", () => {
  it("sorts a PR into one kind by its author, branch and title", () => {
    const kinds = [
      { title: "chore(deps): bump", author: "dependabot[bot]", headRef: "dependabot/npm/x" },
      { title: "docs(research): cpi pulse", author: "bot", headRef: "moneypenny/cpi" },
      { title: "feat(x)!: break", author: "e", headRef: "claude/x" },
      { title: "docs(digest): 11-04", author: "e", headRef: "claude/d" },
      { title: "Update README", author: "e", headRef: "patch-1" },
    ].map(prKind);
    expect(kinds).toEqual(["dependabot", "research", "code", "process", "other"]);
  });

  it("counts one audit recorded on #4153 and in a local receipt once", () => {
    const record = {
      at: "2026-11-02T14:45:00Z",
      batch: "A",
      prs: [1, 2],
      confirmed: 1,
      tokens: 1e6,
      source: "receipt",
      readable: true,
    };
    const reading = defects(
      [record],
      [{ at: "2026-11-02T14:45:00Z", prs: [2, 1], confirmed: 1 }],
      [],
      W45,
    );
    expect([reading.audits, reading.auditedPrs, reading.confirmed, reading.perPr]).toEqual([
      1, 2, 1, 0.5,
    ]);
  });

  it("reads defects unknown, not zero, when no audit fell in the week", () => {
    const reading = defects([], [], [], W45);
    expect([reading.auditedPrs, reading.confirmed, reading.perPr]).toEqual([null, null, null]);
  });

  it("calls a contract red if its issue was open at any moment of the week", () => {
    const issue = (n: number, id: string, createdAt: string, closedAt: string | null) => ({
      number: n,
      title: `[fitness] ${id}`,
      createdAt,
      closedAt,
    });
    const f = fitness(
      ["a", "b", "c"],
      [
        issue(1, "a", "2026-10-01T00:00:00Z", "2026-11-01T23:00:00Z"),
        issue(2, "b", "2026-11-03T00:00:00Z", "2026-11-03T01:00:00Z"),
        issue(3, "c", "2026-11-04T00:00:00Z", null),
      ],
      W45,
    );
    expect([f.green, f.redDuringWeek, f.redAtEnd]).toEqual([["a"], ["b", "c"], ["c"]]);
  });

  it("reports a loop that iterated and held still beside one that moved", () => {
    const rows = [
      { date: "2026-11-03", loop: "x", before: 5, after: 5 },
      { date: "2026-11-03", loop: "y", before: 9, after: 7, tokensM: 1 },
      { date: "2026-11-10", loop: "z", before: 1, after: 0 },
    ];
    expect(loopsMoved(rows, W45)).toEqual({
      iterated: 2,
      moved: 1,
      loops: [
        { loop: "x", iterations: 1, from: 5, to: 5, tokensM: null },
        { loop: "y", iterations: 1, from: 9, to: 7, tokensM: 1 },
      ],
    });
  });
});

describe("the token split", () => {
  const jobs = {
    rows: [
      { job: "post-merge audit", runs: null, tokens: null, verified: null },
      { job: "stages: reviewer", runs: 1, tokens: 100, verified: null },
      { job: "stages: worker", runs: 1, tokens: 40, verified: null },
    ],
  };

  it("maps only the plain job kinds and calls the rest unmapped, never a guess", () => {
    const rows = jobRows(jobs, null);
    expect(rows.map((r: { role: string; bucket: string }) => [r.role, r.bucket])).toEqual([
      ["post-merge audit", "reliability"],
      ["reviewer", "reliability"],
      ["worker", "unmapped"],
    ]);
    expect(tokenSplit(rows).byBucket.unmapped.tokens).toBe(40);
    expect(tokenSplit(rows).byBucket.product.note).toMatch(/no job row/);
  });

  it("fills the audit's tokens from #4153's records only when the meter could not read them", () => {
    const filled = jobRows(jobs, { tokens: 1000, confirmed: 4 })[0];
    expect([filled.tokens, filled.perVerified, filled.source]).toEqual([
      1000,
      250,
      "#4153 audit records",
    ]);
    const read = jobRows(
      { rows: [{ job: "post-merge audit", tokens: 7, verified: 1 }] },
      { tokens: 1000, confirmed: 4 },
    )[0];
    expect([read.tokens, read.source]).toEqual([7, "meter"]);
    expect(jobRows("unavailable: no gh", null)).toBe("unavailable: no gh");
  });
});

describe("the human steps due", () => {
  const row = (loop: string, cadence: string, state = "running", humanStep = "decide") => ({
    loop,
    cadence,
    state,
    humanStep,
    issue: "#1",
  });
  const rows = ["a", "b", "c", "d", "e", "f"].map((l) => row(l, "Weekly"));

  it("asks at most 5, in table order, and rolls the rest", () => {
    const due = asksDue({ rows, week: "2026-W45" });
    expect(due.asks.map((a: { loop: string }) => a.loop)).toEqual(["a", "b", "c", "d", "e"]);
    expect(due.rolledOver).toEqual([{ loop: "f", since: "2026-W45" }]);
  });

  it("puts a rolled-over ask first, oldest wait first, and counts it once", () => {
    const due = asksDue({
      rows,
      week: "2026-W46",
      carriedIn: [
        { loop: "f", since: "2026-W45" },
        { loop: "e", since: "2026-W44" },
        { loop: "f", since: "2026-W46" },
      ],
    });
    expect(due.asks.map((a: { loop: string }) => a.loop)).toEqual(["e", "f", "a", "b", "c"]);
    expect(due.asks[1].since).toBe("2026-W45");
  });

  it("asks nothing of a planned, ended or step-less row, and names an unreadable cadence", () => {
    const due = asksDue({
      rows: [
        row("p", "Weekly", "planned"),
        row("k", "Weekly", "killed"),
        row("n", "Weekly", "running", "—"),
        row("q", "Quarterly"),
      ],
      week: "2026-W45",
    });
    expect([due.due, due.unreadableCadence]).toEqual([0, [{ loop: "q", cadence: "Quarterly" }]]);
  });
});
