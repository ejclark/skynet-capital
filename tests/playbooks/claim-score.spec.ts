import {
  type ClaimScore,
  type FalsifierCheck,
  outcomeOf,
  scoreAll,
  scoreClaim,
  scorecardOf,
  scoreProblems,
  type TapeBar,
  withScores,
} from "../../src/playbooks/claim-score.js";
import type { ClaimStudy } from "../../src/playbooks/claim-study.js";
import { type ConvictionClaim, convictionProblems } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";

/** #5482 slice 5, criterion 6 — a claim is scored against its own dated falsifier: hit, miss, not yet
 *  due, and a study that flips on its re-run. Pure: the tape arrives through the context. */

const claim = (over: Partial<ConvictionClaim> = {}): ConvictionClaim => ({
  tag: "underrated",
  statement: "7. The floor holds.",
  bucket: "tested",
  evidence: "a study",
  falsifier: "Lowest close lands outside $41.00 to $60.90 by 2027-01-19.",
  scoreBy: "2027-01-20",
  ...over,
});

const WITHIN: FalsifierCheck = {
  kind: "closes-within",
  symbol: "CRWV",
  from: "2026-10-16",
  to: "2027-01-19",
  low: 41,
  high: 60.9,
};
const REACH: FalsifierCheck = {
  kind: "closes-reach",
  symbol: "CRWV",
  after: "2026-10-16",
  by: "2027-02-01",
  level: 63.15,
};

const bar = (date: string, close: number): TapeBar => ({ date, close });
const ctx = (today: string, tape: readonly TapeBar[] = []) => ({
  today,
  tape: (symbol: string) => (symbol === "CRWV" ? tape : undefined),
});

describe("scoreClaim — the day has not come", () => {
  it("is pending until its scoreBy day, naming the day, whatever the tape already shows", () => {
    const tape = [bar("2026-10-16", 64.72), bar("2026-12-01", 38)];
    const score = scoreClaim(claim({ check: WITHIN }), ctx("2027-01-19", tape));
    expect(score).toEqual({
      outcome: "pending",
      basis: "Not due: scored on 2027-01-20.",
      dueOn: "2027-01-20",
    });
  });

  it("is pending when no day is set to score it", () => {
    const { scoreBy: _drop, ...undated } = claim();
    expect(scoreClaim(undated, ctx("2027-03-01")).outcome).toBe("pending");
  });

  it("is untestable, not pending, when nothing here can check it", () => {
    const score = scoreClaim(claim({ bucket: "untestable" }), ctx("2030-01-01"));
    expect(score.outcome).toBe("untestable");
    expect(score.basis).toContain("Size zero");
  });
});

describe("scoreClaim — due, and no mechanical check", () => {
  it("stays pending and says its forward test is scored by the lane that registered it", () => {
    const score = scoreClaim(claim({ scoreBy: "2026-11-09" }), ctx("2026-11-10"));
    expect(score.outcome).toBe("pending");
    expect(score.basis).toContain("no reading recorded");
    expect(score.dueOn).toBe("2026-11-09");
  });
});

describe("scoreClaim — a band on the closes (the falsifier hit and miss)", () => {
  const through = (...closes: number[]): TapeBar[] => [
    bar("2026-10-16", 64.72),
    ...closes.map((c, i) => bar(`2026-12-${String(i + 1).padStart(2, "0")}`, c)),
    bar("2027-01-19", closes.at(-1) ?? 64.72),
  ];

  it("passes when the lowest close stays inside the band", () => {
    const score = scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", through(55, 52)));
    expect(score.outcome).toBe("pass");
    expect(score.scoredOn).toBe("2027-01-20");
    expect(score.basis).toContain("$52.00");
    expect(score.basis).toContain("inside $41.00 to $60.90");
  });

  it("fails when the lowest close lands below the band", () => {
    const score = scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", through(55, 38.5, 50)));
    expect(score.outcome).toBe("fail");
    expect(score.basis).toContain("$38.50");
    expect(score.basis).toContain("outside");
  });

  it("fails when the lowest close never fell to the top of the band", () => {
    const score = scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", through(70, 68)));
    expect(score.outcome).toBe("fail");
  });

  it("counts the edges of the band as inside", () => {
    expect(scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", through(41))).outcome).toBe(
      "pass",
    );
    expect(scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", through(60.9))).outcome).toBe(
      "pass",
    );
  });

  it("waits, and says why, when the tape stops before the window ends", () => {
    const tape = [bar("2026-10-16", 64.72), bar("2026-12-30", 50)];
    const score = scoreClaim(claim({ check: WITHIN }), ctx("2027-01-20", tape));
    expect(score.outcome).toBe("pending");
    expect(score.basis).toBe("The CRWV tape ends 2026-12-30; the window runs to 2027-01-19.");
  });

  it("waits when the symbol's tape cannot be read at all", () => {
    const unreadable = { today: "2027-01-20", tape: () => undefined };
    const score = scoreClaim(claim({ check: WITHIN }), unreadable);
    expect(score).toMatchObject({ outcome: "pending", basis: "No CRWV price history to read." });
  });
});

describe("scoreClaim — a level the closes must reach", () => {
  const claimReach = claim({
    statement: "8. Back above today's price.",
    scoreBy: "2027-02-02",
    check: REACH,
  });

  it("passes when a close after the stated day reaches the level, and names it", () => {
    const tape = [bar("2026-10-16", 64.72), bar("2026-12-10", 70), bar("2027-02-01", 50)];
    const score = scoreClaim(claimReach, ctx("2027-02-02", tape));
    expect(score.outcome).toBe("pass");
    expect(score.basis).toContain("2026-12-10");
  });

  it("does not count the day the claim was stated: that close is the entry", () => {
    const tape = [bar("2026-10-16", 64.72), bar("2026-12-10", 55), bar("2027-02-01", 50)];
    expect(scoreClaim(claimReach, ctx("2027-02-02", tape)).outcome).toBe("fail");
  });

  it("does not count a close after the window", () => {
    const tape = [bar("2026-10-16", 64.72), bar("2027-02-01", 50), bar("2027-02-02", 90)];
    expect(scoreClaim(claimReach, ctx("2027-02-02", tape)).outcome).toBe("fail");
  });
});

describe("scoreClaim — a study re-run (the reading can flip)", () => {
  const studied = (reading: "supports" | "mixed" | "against", dataDate: string): ClaimStudy => ({
    disposition: "studied",
    instrument: "premium-fit",
    measures: "whether the option premium is rich",
    symbol: "CRWV",
    dataDate,
    verdict: {
      reading,
      call: `A ${reading} call.`,
      confidence: "low",
      why: "premium-fit",
      falsifier: "A re-run after 2026-11-13 flips it.",
      numbers: {},
    },
  });
  const rerun = (study: ClaimStudy) =>
    claim({
      statement: "1. CRWV premiums are rich.",
      scoreBy: "2026-11-20",
      check: { kind: "rerun" },
      study,
    });

  it("waits for a re-run on data from the due day: an earlier study is a preview, not a score", () => {
    const score = scoreClaim(rerun(studied("against", "2026-10-16")), ctx("2026-11-21"));
    expect(score.outcome).toBe("pending");
    expect(score.basis).toContain("not been re-run");
  });

  it("scores the same claim pass or fail as the re-run's reading flips", () => {
    expect(scoreClaim(rerun(studied("supports", "2026-11-20")), ctx("2026-11-21"))).toMatchObject({
      outcome: "pass",
      scoredOn: "2026-11-21",
    });
    expect(scoreClaim(rerun(studied("against", "2026-11-20")), ctx("2026-11-21"))).toMatchObject({
      outcome: "fail",
    });
  });

  it("does not score a split reading either way", () => {
    const score = scoreClaim(rerun(studied("mixed", "2026-11-20")), ctx("2026-11-21"));
    expect(score.outcome).toBe("pending");
    expect(score.basis).toContain("neither side");
  });

  it("waits when the claim carries no study at all", () => {
    const { study: _drop, ...bare } = rerun(studied("supports", "2026-11-20"));
    expect(scoreClaim(bare, ctx("2026-11-21")).outcome).toBe("pending");
  });
});

describe("the scorecard and the ledger", () => {
  const pass: ClaimScore = {
    outcome: "pass",
    basis: "held",
    dueOn: "2026-11-06",
    scoredOn: "2026-11-07",
  };

  it("counts pass, fail, pending and untestable; a claim never scored is pending", () => {
    const claims = [
      claim({ score: pass }),
      claim({ score: { ...pass, outcome: "fail" } }),
      claim(),
      claim({ bucket: "untestable" }),
    ];
    expect(scorecardOf(claims)).toEqual({ pass: 1, fail: 1, pending: 1, untestable: 1 });
    expect(outcomeOf(claim())).toBe("pending");
  });

  it("attaches a recorded score only while the claim says what it said when it was scored", () => {
    const base = { ...AI_DIP_2026_10, claims: [claim()] };
    const kept = withScores(base, [{ statement: claim().statement, score: pass }]);
    expect(kept.claims[0]?.score).toEqual(pass);
    const reworded = withScores(base, [{ statement: "7. Something else.", score: pass }]);
    expect(reworded.claims[0]?.score).toBeUndefined();
  });

  it("drops a score that breaks the contract instead of serving it", () => {
    const bad: ClaimScore = { outcome: "pass", basis: "held" };
    expect(scoreProblems(bad)).toContain("a pass or fail records the day it was scored");
    expect(scoreProblems({ outcome: "pending", basis: "x", scoredOn: "2026-11-07" })).toContain(
      "only a pass or fail carries a scored-on day",
    );
    const base = { ...AI_DIP_2026_10, claims: [claim()] };
    expect(
      withScores(base, [{ statement: claim().statement, score: bad }]).claims[0]?.score,
    ).toBeUndefined();
  });

  it("scores every claim of a record, in order", () => {
    const entries = scoreAll([claim(), claim({ bucket: "untestable", statement: "6. x" })], {
      today: "2026-10-17",
    });
    expect(entries.map((e) => e.score.outcome)).toEqual(["pending", "untestable"]);
  });
});

describe("the AI-dip record's checks", () => {
  it("still passes every record rule with its checks in place", () => {
    expect(convictionProblems(AI_DIP_2026_10)).toEqual([]);
  });

  it("reads its floor and recovery claims off the tape, and its premium claim off the re-run", () => {
    const kinds = Object.fromEntries(
      AI_DIP_2026_10.claims.flatMap((c) =>
        c.check ? [[c.statement.slice(0, 2), c.check.kind]] : [],
      ),
    );
    expect(kinds).toEqual({
      "1.": "rerun",
      "7.": "closes-within",
      "8.": "closes-reach",
    });
  });

  it("refuses a check with a malformed window or band", () => {
    const bad = (check: FalsifierCheck) =>
      convictionProblems({ ...AI_DIP_2026_10, claims: [claim({ check })] }).filter((p) =>
        p.includes("check"),
      );
    expect(bad({ ...WITHIN, from: "2027-02-01" })).toContain(
      "claim 1: check window ends before it starts",
    );
    expect(bad({ ...WITHIN, low: 70 })).toContain("claim 1: check band must run low to high");
    expect(bad({ ...REACH, symbol: " " })).toContain("claim 1: check names no symbol");
  });

  it("starts with nothing decided: eight claims waiting on their day, two untestable at size zero", () => {
    const unscored = AI_DIP_2026_10.claims.map(({ score: _score, ...rest }) => rest);
    expect(scorecardOf(unscored)).toEqual({
      pass: 0,
      fail: 0,
      pending: 8,
      untestable: 2,
    });
  });
});
