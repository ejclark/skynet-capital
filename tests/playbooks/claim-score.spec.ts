import { loadProposals } from "../../scripts/conviction-proposals.mjs";
import {
  type ClaimScore,
  type FalsifierCheck,
  type ForwardLink,
  type ForwardRow,
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

const P6: ForwardLink = {
  event: "midterm-elections-2026-11-03",
  ref: "ai-dip-2026-10/P6",
  onPass: "fail",
  onKill: "pass",
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

describe("scoreClaim — the forward test an event lane registered", () => {
  const P1: ForwardLink = {
    event: "crwv-2026-11-10-print",
    ref: "ai-dip-2026-10/P1",
    onPass: "pass",
    onKill: "fail",
  };
  const P2: ForwardLink = { ...P1, ref: "ai-dip-2026-10/P2", onKill: "pending" };
  const forward = (rows: Record<string, ForwardRow>) => ({
    today: "2026-11-25",
    forwardTest: (link: ForwardLink) => rows[link.ref],
  });
  const scored = (tests: readonly ForwardLink[], rows: Record<string, ForwardRow>) =>
    scoreClaim(
      claim({
        statement: "2b. Buy calls after the print.",
        scoreBy: "2026-11-25",
        check: { kind: "forward-tests", tests },
      }),
      forward(rows),
    );

  it("is pending, naming the proposal, while the lane has not registered it", () => {
    expect(scored([P1], {})).toEqual({
      outcome: "pending",
      basis:
        "Due 2026-11-25. ai-dip-2026-10/P1 is not registered in crwv-2026-11-10-print's forward tests yet.",
      dueOn: "2026-11-25",
    });
  });

  it("stays pending while the registered row is open or void, naming the row", () => {
    const open = scored([P1], {
      "ai-dip-2026-10/P1": { id: "FT-crwv-2026-11-10-print-7", verdict: "open" },
    });
    expect(open.outcome).toBe("pending");
    expect(open.basis).toContain(
      "FT-crwv-2026-11-10-print-7 (registered from ai-dip-2026-10/P1) reads open.",
    );
    expect(scored([P1], { "ai-dip-2026-10/P1": { id: "FT-x-1", verdict: "void" } }).outcome).toBe(
      "pending",
    );
  });

  it("passes when the test passes, and fails when it is killed", () => {
    const pass = scored([P1], { "ai-dip-2026-10/P1": { id: "FT-x-1", verdict: "pass" } });
    expect(pass).toEqual({
      outcome: "pass",
      basis: "FT-x-1 (registered from ai-dip-2026-10/P1) passed: this claim held.",
      dueOn: "2026-11-25",
      scoredOn: "2026-11-25",
    });
    const fail = scored([P1], { "ai-dip-2026-10/P1": { id: "FT-x-1", verdict: "kill" } });
    expect(fail.outcome).toBe("fail");
    expect(fail.basis).toBe(
      "FT-x-1 (registered from ai-dip-2026-10/P1) was killed: this claim's falsifier landed.",
    );
  });

  it("reads an inverted link the claim's way: the test passing is the falsifier landing", () => {
    expect(scored([P6], { "ai-dip-2026-10/P6": { id: "FT-m-4", verdict: "pass" } }).outcome).toBe(
      "fail",
    );
    expect(scored([P6], { "ai-dip-2026-10/P6": { id: "FT-m-4", verdict: "kill" } }).outcome).toBe(
      "pass",
    );
  });

  it("leaves the claim pending when a test that is one reading of several is killed", () => {
    const score = scored([P2], { "ai-dip-2026-10/P2": { id: "FT-x-2", verdict: "kill" } });
    expect(score.outcome).toBe("pending");
    expect(score.basis).toContain("was killed: that alone does not decide this claim.");
  });

  it("fails on any failing link, and passes only when every link passes", () => {
    const pass = { id: "FT-x-1", verdict: "pass" } as const;
    const kill = { id: "FT-x-2", verdict: "kill" } as const;
    const mixed = scored([P1, { ...P2, onKill: "fail" }], {
      "ai-dip-2026-10/P1": pass,
      "ai-dip-2026-10/P2": kill,
    });
    expect(mixed.outcome).toBe("fail");
    expect(mixed.basis).not.toContain("FT-x-1");
    const waiting = scored([P1, P2], { "ai-dip-2026-10/P1": pass });
    expect(waiting.outcome).toBe("pending");
    expect(waiting.basis).toBe(
      "Due 2026-11-25. FT-x-1 (registered from ai-dip-2026-10/P1) passed: this claim held. ai-dip-2026-10/P2 is not registered in crwv-2026-11-10-print's forward tests yet.",
    );
    expect(
      scored([P1, P2], {
        "ai-dip-2026-10/P1": pass,
        "ai-dip-2026-10/P2": { ...pass, id: "FT-x-2" },
      }).outcome,
    ).toBe("pass");
  });

  it("says the forward tests were not read, never 'not registered', when no reader is wired", () => {
    const score = scoreClaim(
      claim({ scoreBy: "2026-11-25", check: { kind: "forward-tests", tests: [P1] } }),
      { today: "2026-11-25" },
    );
    expect(score.outcome).toBe("pending");
    expect(score.basis).toBe("Due 2026-11-25. ai-dip-2026-10/P1: this pass read no forward tests.");
  });

  it("names a row linked by its own id without repeating it", () => {
    const ft: ForwardLink = {
      ...P1,
      event: "nvda-2026-11-18-print",
      ref: "FT-nvda-2026-11-18-print-3",
    };
    const score = scored([ft], { [ft.ref]: { id: ft.ref, verdict: "pass" } });
    expect(score.basis).toBe("FT-nvda-2026-11-18-print-3 passed: this claim held.");
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
      "2b": "forward-tests",
      "4.": "forward-tests",
      "5.": "forward-tests",
      "7.": "closes-within",
      "8.": "closes-reach",
      "9.": "forward-tests",
    });
  });

  it("links each forward claim to a proposal its call sheet makes for that claim, on that event", () => {
    const proposals = loadProposals();
    for (const c of AI_DIP_2026_10.claims) {
      if (c.check?.kind !== "forward-tests") continue;
      for (const link of c.check.tests) {
        if (link.ref.startsWith("FT-")) {
          expect(c.falsifier).toContain(link.ref);
          expect(link.ref.startsWith(`FT-${link.event}-`)).toBe(true);
          continue;
        }
        const p = proposals.find((x) => x.key === link.ref);
        expect(p?.fragment, link.ref).toBe(link.event);
      }
    }
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

  it("refuses a forward-test check with no test, a bad ref, or a link that decides nothing", () => {
    const bad = (check: FalsifierCheck) =>
      convictionProblems({ ...AI_DIP_2026_10, claims: [claim({ check })] }).filter((p) =>
        p.startsWith("claim 1:"),
      );
    expect(bad({ kind: "forward-tests", tests: [] })).toContain(
      "claim 1: check names no forward test",
    );
    expect(bad({ kind: "forward-tests", tests: [{ ...P6, ref: "P6" }] })).toContain(
      "claim 1: P6 is neither an FT id nor a proposal token",
    );
    expect(bad({ kind: "forward-tests", tests: [{ ...P6, event: " " }] })).toContain(
      "claim 1: ai-dip-2026-10/P6: its event is not an event id",
    );
    expect(bad({ kind: "forward-tests", tests: [{ ...P6, event: "../../README" }] })).toContain(
      "claim 1: ai-dip-2026-10/P6: its event is not an event id",
    );
    expect(
      bad({ kind: "forward-tests", tests: [{ ...P6, onPass: "pending", onKill: "pending" }] }),
    ).toContain("claim 1: ai-dip-2026-10/P6 scores the claim the same whichever way it goes");
    expect(bad({ kind: "forward-tests", tests: [P6] })).toEqual([]);
  });

  it("starts with nothing decided: eight claims waiting on their day, six untestable at size zero", () => {
    const unscored = AI_DIP_2026_10.claims.map(({ score: _score, ...rest }) => rest);
    expect(scorecardOf(unscored)).toEqual({
      pass: 0,
      fail: 0,
      pending: 8,
      untestable: 6,
    });
  });
});
