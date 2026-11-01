import { describe, expect, it } from "@rstest/core";
import {
  caseDigest,
  casesFor,
  runOfSlot,
  runsFor,
  scoreReplay,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../../scripts/intent-replay.mjs";
import { IDS, kase, SET } from "./fixtures";

describe("the score", () => {
  const runs = runsFor(2);
  const answer = (id: string, over = {}) => ({
    id,
    route: id === "C2" ? "question" : "act-now",
    ask: "must-not-ask",
    firstMove: "m",
    ...over,
  });
  const full = () => runs.map((r: object) => ({ ...r, answers: IDS.map((id) => answer(id)) }));
  // Every answer of every run passes unless `fails` names its run.
  const verdicts = (rows: { name: string }[], fails: (name: string, id: string) => boolean) =>
    IDS.flatMap((id, i) =>
      rows.map((_, slot) => ({
        id,
        slot,
        pass: !fails(rows[runOfSlot(i, slot, rows.length)]?.name ?? "", id),
        why: "w",
      })),
    );
  const result = (over = {}) => ({
    caseIds: IDS,
    caseDigests: casesFor(SET).caseDigests,
    runs: full(),
    verdicts: verdicts(runs, () => false),
    ...over,
  });

  it("adds route, ask and judged per arm, each out of cases times runs", () => {
    const { arms } = scoreReplay(SET, result());
    expect(arms.without).toEqual({
      route: 6,
      ask: 6,
      judged: 6,
      of: 6,
      answered: 6,
      unjudged: 0,
    });
    expect(arms.with.judged).toBe(6);
  });

  it("gives each verdict to the run its slot held for that case, not to the slot", () => {
    const failing = verdicts(runs, (name, id) => name === "with-2" && id !== "C1");
    const { arms, byRun } = scoreReplay(SET, result({ verdicts: failing }));
    expect(byRun["with-2"].judged).toBe(1);
    expect(byRun["with-1"].judged).toBe(3);
    expect(arms.with.judged).toBe(4);
    expect(arms.without.judged).toBe(6);
  });

  it("counts a wrong route or ask only against that answer", () => {
    const rows = full();
    rows[0].answers[1] = answer("C2", { route: "park", ask: "should-ask" });
    const { byRun } = scoreReplay(SET, result({ runs: rows }));
    expect(byRun["without-1"]).toMatchObject({ route: 2, ask: 2 });
    expect(byRun["without-2"]).toMatchObject({ route: 3, ask: 3 });
  });

  it("calls the page above only when every answer is judged and its arm scores higher", () => {
    expect(scoreReplay(SET, result()).verdict).toBe("page not above");
    const beaten = verdicts(runs, (name, id) => name === "without-1" && id === "C1");
    expect(scoreReplay(SET, result({ verdicts: beaten })).verdict).toBe("page above");
    const lost = verdicts(runs, (name, id) => name === "with-1" && id === "C1");
    expect(scoreReplay(SET, result({ verdicts: lost })).verdict).toBe("page not above");
  });

  it("reads a run that died as unknown, never as a low score", () => {
    const rows = full();
    rows[3].answers = null;
    const report = scoreReplay(SET, result({ runs: rows }));
    expect(report.verdict).toBe("unknown");
    expect(report.arms.with.answered).toBe(3);
    expect(report.arms.with.of).toBe(6);
  });

  it("reads a dead judge as unknown, and gives no credit for a pass on a missing answer", () => {
    const report = scoreReplay(SET, result({ verdicts: [] }));
    expect(report.verdict).toBe("unknown");
    expect(report.arms.without.unjudged).toBe(6);
    const rows = full();
    rows[0].answers = [];
    expect(scoreReplay(SET, result({ runs: rows })).byRun["without-1"].judged).toBe(0);
  });

  describe("a judge's row that does not answer pass with a boolean", () => {
    const withRow = (bad: Record<string, unknown>) =>
      verdicts(runs, () => false).map((row: { id: string; slot: number }) =>
        row.id === "C2" && row.slot === 1 ? { id: row.id, slot: row.slot, why: "w", ...bad } : row,
      );

    const rows: [string, Record<string, unknown>][] = [
      ["no pass field", {}],
      ["the string true", { pass: "true" }],
      ["the string false", { pass: "false" }],
      ["the number 1", { pass: 1 }],
      ["the number 0", { pass: 0 }],
      ["null", { pass: null }],
    ];
    for (const [name, bad] of rows) {
      it(`reads ${name} as unjudged, gives it no credit, and prints no verdict`, () => {
        const report = scoreReplay(SET, result({ verdicts: withRow(bad) }));
        expect(report.verdict).toBe("unknown");
        const unjudged = report.arms.without.unjudged + report.arms.with.unjudged;
        expect(unjudged).toBe(1);
        expect(report.arms.without.judged + report.arms.with.judged).toBe(11);
      });
    }

    it("still judges a false, which is an answer", () => {
      const allFail = verdicts(runs, () => true);
      const report = scoreReplay(SET, result({ verdicts: allFail }));
      expect(report.arms.with).toMatchObject({ judged: 0, unjudged: 0 });
      expect(report.verdict).toBe("page not above");
    });
  });

  describe("a backward run, whose answers come back in reverse", () => {
    // Every case's right route is its own, so an answer read by position scores wrong on two of three.
    const SPREAD = {
      ...SET,
      cases: [
        kase("C1", { route: "park" }),
        kase("C2", { route: "question" }),
        kase("C3", { route: "act-now" }),
      ],
    };
    const ROUTES: Record<string, string> = { C1: "park", C2: "question", C3: "act-now" };
    const inItsOrder = () =>
      runs.map((run: { order: string }) => {
        const ids = run.order === "backward" ? [...IDS].reverse() : IDS;
        return {
          ...run,
          answers: ids.map((id) => answer(id, { route: ROUTES[id], ask: "must-not-ask" })),
        };
      });

    it("gives each answer to its case by id, never by position", () => {
      const spread = {
        caseIds: IDS,
        caseDigests: casesFor(SPREAD).caseDigests,
        runs: inItsOrder(),
        verdicts: verdicts(runs, () => false),
      };
      const { byRun, verdict } = scoreReplay(SPREAD, spread);
      for (const run of runs) expect(byRun[run.name], run.name).toMatchObject({ route: 3, ask: 3 });
      expect(verdict).toBe("page not above");
    });

    it("does the same when only one case's answer is wrong", () => {
      const rows = inItsOrder();
      const backward = rows.find((r: { name: string }) => r.name === "without-2");
      backward.answers[0] = answer("C3", { route: "park" });
      const { byRun } = scoreReplay(SPREAD, {
        caseIds: IDS,
        caseDigests: casesFor(SPREAD).caseDigests,
        runs: rows,
        verdicts: [],
      });
      expect(byRun["without-2"].route).toBe(2);
      expect(byRun["without-1"].route).toBe(3);
    });
  });

  it("refuses a run whose arms read one order each, since order would pose as the page", () => {
    const oneEach = runsFor(1).map((run: object) => ({
      ...run,
      answers: IDS.map((id) => answer(id)),
    }));
    const passing = IDS.flatMap((id) =>
      oneEach.map((_: unknown, slot: number) => ({ id, slot, pass: true, why: "w" })),
    );
    expect(() => scoreReplay(SET, result({ runs: oneEach, verdicts: passing }))).toThrow(
      /both orders/,
    );
    const lopsided = full().map((run: object) => ({ ...run, order: "forward" }));
    expect(() => scoreReplay(SET, result({ runs: lopsided }))).toThrow(/both orders/);
    const armless = full().filter((run: { arm: string }) => run.arm === "with");
    expect(() => scoreReplay(SET, result({ runs: armless }))).toThrow(/both orders/);
  });

  it("refuses arms of unequal size, each balanced on its own, whose totals cannot compare", () => {
    const extra = runsFor(4)
      .filter((run: { arm: string }) => run.arm === "without")
      .map((run: object) => ({ ...run, answers: IDS.map((id) => answer(id)) }));
    const withArm = full().filter((run: { arm: string }) => run.arm === "with");
    expect(() => scoreReplay(SET, result({ runs: [...extra, ...withArm] }))).toThrow(/both orders/);
  });

  it("reads a slot the judge contradicted itself on as unjudged, whichever came last", () => {
    const base = verdicts(runs, () => false);
    for (const [first, second] of [
      [false, true],
      [true, false],
    ]) {
      const report = scoreReplay(
        SET,
        result({
          verdicts: [
            ...base.filter((row: { id: string; slot: number }) => row.id !== "C1" || row.slot),
            { id: "C1", slot: 0, pass: first, why: "w" },
            { id: "C1", slot: 0, pass: second, why: "w" },
          ],
        }),
      );
      expect(report.verdict, String(first)).toBe("unknown");
      expect(report.arms.without.unjudged, String(first)).toBe(1);
    }
  });

  it("counts a slot the judge repeated itself on once, as what it said", () => {
    const repeated = [...verdicts(runs, () => false), { id: "C1", slot: 0, pass: true, why: "w" }];
    const report = scoreReplay(SET, result({ verdicts: repeated }));
    expect(report.verdict).toBe("page not above");
    expect(report.arms.without.judged).toBe(6);
  });

  it("names the cases where the arms differ, so a number can be read back to a message", () => {
    const failing = verdicts(runs, (name, id) => name.startsWith("without") && id === "C3");
    expect(scoreReplay(SET, result({ verdicts: failing })).differs).toEqual([
      { id: "C3", without: 0, with: 2 },
    ]);
  });

  it("names no differences on an unknown score, where a missing answer would read as a loss", () => {
    const rows = full();
    rows[3].answers = null;
    const failing = verdicts(runs, (name, id) => name.startsWith("without") && id === "C3");
    const report = scoreReplay(SET, result({ runs: rows, verdicts: failing }));
    expect(report.verdict).toBe("unknown");
    expect(report.differs).toEqual([]);
  });

  it("refuses a result from a different set, since a slot means nothing against other cases", () => {
    expect(() => scoreReplay(SET, result({ caseIds: ["C2", "C1", "C3"] }))).toThrow(/C2/);
    expect(() => scoreReplay(SET, result({ caseIds: ["C1"] }))).toThrow(/set/);
    expect(() => scoreReplay(SET, {})).toThrow(/runs/);
  });

  describe("results from a set rewritten since they ran, whose ids are all the same", () => {
    const rewrites: [string, Record<string, unknown>][] = [
      ["said", { said: "other words" }],
      ["context", { context: "another context" }],
      ["route", { route: "park" }],
      ["ask", { ask: "should-ask" }],
      ["mustDo", { mustDo: ["another must"] }],
      ["mustNotDo", { mustNotDo: ["another must not"] }],
      ["evidence", { evidence: "other evidence" }],
      ["date", { date: "2026-10-02" }],
      ["confidence", { confidence: "low" }],
      ["a new field", { note: "added" }],
    ];
    for (const [field, change] of rewrites) {
      it(`refuses them when ${field} changed, and names the case`, () => {
        const rewritten = {
          ...SET,
          cases: [kase("C1"), kase("C2", { route: "question", ...change }), kase("C3")],
        };
        expect(() => scoreReplay(rewritten, result())).toThrow(/C2/);
        expect(() => scoreReplay(rewritten, result())).not.toThrow(/C1|C3/);
      });
    }

    it("refuses them when the cases swapped their words", () => {
      const swapped = {
        ...SET,
        cases: [
          kase("C1", { said: "the words of C3" }),
          kase("C2", { route: "question" }),
          kase("C3", { said: "the words of C1" }),
        ],
      };
      expect(() => scoreReplay(swapped, result())).toThrow(/C1.*C3/);
    });

    it("refuses results that say nothing of what their cases held", () => {
      expect(() => scoreReplay(SET, result({ caseDigests: undefined }))).toThrow(/run it again/);
      expect(() => scoreReplay(SET, result({ caseDigests: ["x"] }))).toThrow(/C1/);
    });

    it("scores them when the same content is only written in another key order", () => {
      const reordered = {
        ...SET,
        cases: SET.cases.map((row) => Object.fromEntries(Object.entries(row).reverse())),
      };
      expect(scoreReplay(reordered, result()).verdict).toBe("page not above");
    });

    it("gives two cases different digests, and one case the same digest twice", () => {
      expect(caseDigest(kase("C1"))).toBe(caseDigest(kase("C1")));
      expect(caseDigest(kase("C1"))).not.toBe(caseDigest(kase("C2")));
      expect(casesFor(SET).caseDigests).toEqual(SET.cases.map(caseDigest));
    });
  });
});
