import { describe, expect, it } from "@rstest/core";
import {
  answersTable,
  ISSUE,
  openPrOn,
  resultsPr,
  runLines,
  unanswered,
} from "../../scripts/paper-checks-pr.mjs";
import type { Outcome } from "../../src/alpaca/paper-checks/answer.js";
import { type CheckId, PAPER_CHECKS } from "../../src/alpaca/paper-checks/catalog.js";
import {
  type CheckRow,
  type ResultsFile,
  renderReadme,
} from "../../src/alpaca/paper-checks/results.js";

// #8256 slice 2: paper-checks.yml runs the checks once per market window and files the answers as
// ONE results PR on a fixed branch. The PR closes the issue only once every scriptable check has a
// broker answer on the record, and never spells the closing keyword before then (#8370: a quoted
// keyword closed this issue a slice early).

const SCRIPTABLE = PAPER_CHECKS.filter((c) => !c.notScriptable).map((c) => c.id);

const row = (check: CheckId, outcome: Outcome): CheckRow => ({
  check,
  ranAt: "2026-11-24T16:00:00.000Z",
  phase: "regular hours",
  outcome,
  answer: outcome === "not in window" ? "" : `limit order: ${outcome}`,
  attempts: [],
  orderIds: [],
  cleanup: "nothing placed",
});

const file = (date: string, rows: CheckRow[]): ResultsFile => ({
  date,
  runs: [
    {
      runId: "1.1",
      startedAt: `${date}T16:00:00.000Z`,
      finishedAt: `${date}T16:05:00.000Z`,
      exitCode: 0,
      rows,
      stillOpen: [],
      positionsLeft: [],
    },
  ],
});

describe("paper-checks-pr: one results PR at a time", () => {
  const branch = "chore/paper-checks-results";

  it("finds the open PR on the results branch, so a later run updates it", () => {
    const prs = [
      { number: 1, head: { ref: "other" } },
      { number: 2, head: { ref: branch } },
    ];
    expect(openPrOn(prs, branch)?.number).toBe(2);
  });

  it("opens one when no open PR carries the branch", () => {
    expect(openPrOn([{ number: 3, head: { ref: "research/nvda" } }, {}], branch)).toBeUndefined();
  });
});

describe("paper-checks-pr: which checks still wait, read across every dated file", () => {
  it("counts a refusal as an answer, and a wait or an error as no answer", () => {
    const files = [
      file("2026-11-24", [
        row("fractional-exits", "refused"),
        row("mleg-stock-leg", "accepted"),
        row("same-day-options", "error"),
        row("bracket-after-close", "not in window"),
      ]),
    ];
    const waiting = unanswered(files, PAPER_CHECKS);
    expect(waiting).not.toContain("fractional-exits");
    expect(waiting).not.toContain("mleg-stock-leg");
    expect(waiting).toContain("same-day-options");
    expect(waiting).toContain("bracket-after-close");
  });

  it("keeps an earlier window's answer when a later run only waited", () => {
    const files = [
      file("2026-11-24", [row("extended-hours", "accepted")]),
      file("2026-11-25", [row("extended-hours", "not in window")]),
    ];
    expect(unanswered(files, PAPER_CHECKS)).not.toContain("extended-hours");
  });

  it("never waits on the two checks no script can answer", () => {
    const all = file(
      "2026-12-04",
      SCRIPTABLE.map((id) => row(id, "accepted")),
    );
    expect(unanswered([all], PAPER_CHECKS)).toEqual([]);
  });
});

describe("paper-checks-pr: the body", () => {
  const log = [
    "> skynet-capital@0.0.0 paper:checks",
    'fractional-exits: refused (regular hours) bracket, 0.5 share: refused, HTTP 422, "fractional orders must be simple"',
    "same-day-options: not in window (closed)  [next 2026-11-25 09:30 ET]",
    "still open after cleanup: paperchk-1.1-fractional-exits-2",
    "results: docs/research/alpaca-paper-checks/2026-11-24.json and README.md",
  ].join("\n");
  const files = [file("2026-11-24", [row("fractional-exits", "refused")])];

  it("stays `Part of` and never spells the closing keyword while a check waits", () => {
    const waiting = unanswered(files, PAPER_CHECKS);
    const { body } = resultsPr({ readme: renderReadme(files), log, waiting, today: "2026-11-24" });
    expect(body).toContain(`- Part of #${ISSUE}`);
    expect(body).not.toMatch(/\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#\d+/i);
    expect(body).toContain("`same-day-options`");
    expect(body).toContain(`1 of ${SCRIPTABLE.length} scriptable checks`);
  });

  it("says `Closes` once every scriptable check carries an answer", () => {
    const done = [
      file(
        "2026-12-04",
        SCRIPTABLE.map((id) => row(id, "refused")),
      ),
    ];
    const { body } = resultsPr({
      readme: renderReadme(done),
      log,
      waiting: unanswered(done, PAPER_CHECKS),
      today: "2026-12-04",
    });
    expect(body).toContain(`- Closes #${ISSUE}`);
    expect(body).not.toContain(`Part of #${ISSUE}`);
  });

  it("carries the README's answers table and the run's own check lines, not npm's noise", () => {
    const readme = renderReadme(files);
    const { body } = resultsPr({ readme, log, waiting: [], today: "2026-11-24" });
    for (const line of answersTable(readme)) expect(body).toContain(line);
    expect(answersTable(readme)).toHaveLength(2 + PAPER_CHECKS.length);
    expect(body).toContain("still open after cleanup: paperchk-1.1-fractional-exits-2");
    expect(body).not.toContain("> skynet-capital");
    expect(runLines(log, PAPER_CHECKS)).toHaveLength(3);
  });

  it("titles the PR as a lowercase conventional commit with the run's date", () => {
    expect(resultsPr({ readme: "", log: "", waiting: [], today: "2026-11-24" }).title).toBe(
      "chore(research): alpaca paper-check answers (2026-11-24)",
    );
  });
});
