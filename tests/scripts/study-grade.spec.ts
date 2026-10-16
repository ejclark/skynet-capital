import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import type { Check, Consensus, Finding, MatchEntry } from "../../scripts/study/grade-core.mjs";
import {
  cohenKappa,
  consensus,
  controlVerdict,
  cycleGate,
  easyMode,
  newProblems,
  parseGold,
  primedSplit,
  thoroughness,
  validity,
  wilson,
} from "../../scripts/study/grade-core.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import { schemaProblems } from "../../scripts/study/schema-check.mjs";

// The grader turns a round's findings into the numbers the owner reads at the stop. Every id, item
// and finding here is invented (tests/fixtures/study-grade/ is a made-up house, not the app); the
// real key never enters the repo.

const FIX = join(import.meta.dirname, "../fixtures/study-grade");
const m = (finding: string, gold: string | null, score: number): MatchEntry => ({
  finding,
  gold,
  score,
});
const agreed = (gold: string | null, score: number): Consensus => ({
  gold,
  score,
  disputed: false,
  resolvedBy: "agreed",
  m1: null,
  m2: null,
  tiebreak: null,
});

describe("parseGold — the sealed key's items, by id", () => {
  it("reads list, heading and table lines, and tiers them by letter", () => {
    const items = parseGold(
      "# Key\n\n- **A1** · first thing\n## A2: second thing\n| B1 | a known gap | x |\nS1 — readers only\nA plain line",
    );
    expect(items).toEqual([
      { id: "A1", tier: "main", title: "first thing" },
      { id: "A2", tier: "main", title: "second thing" },
      { id: "B1", tier: "known-gap", title: "a known gap" },
      { id: "S1", tier: "readers-only", title: "readers only" },
    ]);
  });

  it("refuses a key that names an id twice, or has no main list", () => {
    expect(() => parseGold("- A1 one\n- A1 again")).toThrow(/A1 twice/);
    expect(() => parseGold("- B1 only gaps")).toThrow(/no main-list items/);
  });
});

describe("wilson — the 95% range around a small count", () => {
  it("matches the textbook values", () => {
    expect(wilson(6, 12)).toEqual({ lo: 0.254, hi: 0.746 });
    expect(wilson(4, 6)).toEqual({ lo: 0.3, hi: 0.903 });
    expect(wilson(0, 10)).toEqual({ lo: 0, hi: 0.278 });
    expect(wilson(10, 10)).toEqual({ lo: 0.722, hi: 1 });
  });

  it("has no range over nothing", () => {
    expect(wilson(0, 0)).toBeNull();
  });
});

describe("cohenKappa — agreement beyond chance", () => {
  it("is 1 for perfect agreement across labels, 0 at chance", () => {
    expect(
      cohenKappa([
        ["a", "a"],
        ["b", "b"],
      ]).kappa,
    ).toBe(1);
    const chance = cohenKappa([
      ["a", "a"],
      ["a", "b"],
      ["b", "a"],
      ["b", "b"],
    ]);
    expect(chance).toEqual({ n: 4, observed: 0.5, expected: 0.5, kappa: 0 });
  });

  it("matches a hand-worked case (12 of 14 agree, chance 62/196)", () => {
    const pairs: [string, string][] = [
      ["A4", "A4"],
      ["A1", "A1"],
      ["A2", "A2"],
      ["A3", "none"],
      ["A5", "A6"],
      ["A5", "A5"],
      ["B1", "B1"],
      ...Array.from({ length: 7 }, (): [string, string] => ["none", "none"]),
    ];
    expect(cohenKappa(pairs)).toEqual({ n: 14, observed: 0.857, expected: 0.316, kappa: 0.791 });
  });

  it("is undefined when one label is all there is", () => {
    expect(
      cohenKappa([
        ["none", "none"],
        ["none", "none"],
      ]).kappa,
    ).toBeNull();
  });
});

describe("consensus — the agreed label per finding", () => {
  it("keeps the lower score on agreement, settles a dispute by tie-break, else counts no match", () => {
    const { byId, problems } = consensus({
      ids: ["f1", "f2", "f3"],
      m1: [m("f1", "A1", 1), m("f2", "A2", 1), m("f3", "A3", 0.5)],
      m2: [m("f1", "A1", 0.5), m("f2", null, 0), m("f3", "A4", 0.5)],
      tiebreak: [m("f2", "A2", 0.5)],
    });
    expect(problems).toEqual([]);
    expect(byId.get("f1")).toMatchObject({ gold: "A1", score: 0.5, disputed: false });
    expect(byId.get("f2")).toMatchObject({
      gold: "A2",
      score: 0.5,
      disputed: true,
      resolvedBy: "tie-break",
    });
    expect(byId.get("f3")).toMatchObject({
      gold: null,
      score: 0,
      disputed: true,
      resolvedBy: "unresolved",
    });
  });

  it("names an unlabelled finding, an unknown one and a score off the scale", () => {
    const { problems } = consensus({
      ids: ["f1"],
      m1: [m("f1", "A1", 0.7), m("ghost", null, 0)],
      m2: [],
    });
    expect(problems).toEqual([
      "matches-1 scores f1 0.7",
      "matches-1 names unknown ghost",
      "matches-2 leaves f1 unlabelled",
    ]);
  });
});

describe("thoroughness and the primed split", () => {
  const byId = new Map([
    ["f1", agreed("A1", 1)],
    ["f2", agreed("A2", 0.5)],
    ["f3", agreed("A3", 1)],
    ["f4", agreed("A3", 1)],
  ]);
  const findings: Finding[] = [
    { id: "f1", level: "surface", class: "members", member: "owl" },
    { id: "f2", level: "surface", class: "experts" },
    { id: "f3", level: "surface", class: "members", member: "owl" },
    { id: "f4", level: "surface", class: "members", member: "lark" },
  ];

  it("counts a 0.5 as found, reported apart as partial credit", () => {
    const best = new Map([
      ["A1", 1],
      ["A2", 0.5],
      ["A9", 1],
    ]);
    expect(thoroughness(["A1", "A2", "A3"], best)).toMatchObject({
      found: 2,
      full: 1,
      partial: 1,
      renders: 3,
      rate: 0.667,
      ids: ["A1", "A2"],
    });
  });

  it("calls an item primed only when every finding of it came from a member hinted at it", () => {
    const split = primedSplit({
      renderIds: ["A1", "A2", "A3", "A4"],
      findings,
      byId,
      primes: { owl: ["A1", "A3"] },
    });
    // A1: only owl, hinted → primed. A3: owl (hinted) AND lark (not) → unprimed. A2: an expert.
    expect(split.primed).toEqual(["A1"]);
    expect(split.unprimed).toEqual(["A2", "A3"]);
    expect(split.unprimedRate).toBe(0.5);
  });
});

describe("validity and new problems", () => {
  const byId = new Map([
    ["a", agreed("A1", 1)],
    ["b", agreed(null, 0)],
    ["c", agreed(null, 0)],
    ["d", agreed(null, 0)],
    ["e", agreed(null, 0)],
    ["g", agreed("B1", 0.5)],
  ]);
  const checks = new Map<string, Check>([
    ["b", { finding: "b", verdict: "real" }],
    ["c", { finding: "c", verdict: "world-artifact" }],
    ["d", { finding: "d", verdict: "false" }],
    ["e", { finding: "e", verdict: "real", same_as: "b" }],
  ]);
  const level =
    (l: string) =>
    (id: string): Finding => ({ id, level: l });
  const findings = [...["a", "b", "c", "e", "g"].map(level("structural")), level("surface")("d")];

  it("leaves world artifacts out of the denominator, counts unchecked as not real", () => {
    const v = validity([...findings, { id: "x", level: "surface" }], byId, checks);
    // a matched · b real · e real · g matched = 4 real; c artifact out; d false; x unchecked.
    expect(v).toEqual({
      reported: 6,
      real: 4,
      worldArtifacts: 1,
      false: 1,
      unchecked: 1,
      rate: 0.667,
    });
  });

  it("counts real structural findings off the key once per same_as group; re-finds apart", () => {
    const y = newProblems({ findings, byId, checks, mainIds: ["A1"], level: "structural" });
    expect(y).toEqual({
      count: 1,
      groups: { b: ["b", "e"] },
      refound: { g: { ids: ["g"], gold: ["B1"] } },
      held: {},
    });
  });

  // The three ways a duplicate or a dispute could pass for a new problem (code review, #4943).
  it("never counts a duplicate of a key match, a dispute over a key item, or a loop twice", () => {
    const disputed = (m1: MatchEntry, m2: MatchEntry): Consensus => ({
      gold: null,
      score: 0,
      disputed: true,
      resolvedBy: "unresolved",
      m1: { gold: m1.gold, score: m1.score },
      m2: { gold: m2.gold, score: m2.score },
      tiebreak: null,
    });
    const byId = new Map([
      ["x", agreed("A1", 1)],
      ["z", agreed(null, 0)],
      ["w", agreed(null, 0)],
      ["y", disputed(m("y", "A2", 1), m("y", null, 0))],
      ["p", agreed(null, 0)],
      ["q", agreed(null, 0)],
      ["r", agreed(null, 0)],
      ["n", agreed(null, 0)],
    ]);
    const checks = new Map<string, Check>([
      // z → w → x: a chain whose root is matched to the main list.
      ["z", { finding: "z", verdict: "real", same_as: "w" }],
      ["w", { finding: "w", verdict: "real", same_as: "x" }],
      ["y", { finding: "y", verdict: "real" }],
      // p ⇄ q: a two-way same_as, one problem; r joins it.
      ["p", { finding: "p", verdict: "real", same_as: "q" }],
      ["q", { finding: "q", verdict: "real", same_as: "p" }],
      ["r", { finding: "r", verdict: "real", same_as: "q" }],
      ["n", { finding: "n", verdict: "real" }],
    ]);
    const ids = ["x", "z", "w", "y", "p", "q", "r", "n"];
    // x itself is outside the counted set (another class), and still answers for its group.
    const counted = ids.filter((id) => id !== "x").map((id) => ({ id, level: "structural" }));
    const y = newProblems({
      findings: counted,
      byId,
      checks,
      mainIds: ["A1", "A2"],
      level: "structural",
    });
    expect(y).toEqual({
      count: 2,
      groups: { p: ["p", "q", "r"], n: ["n"] },
      refound: {},
      held: { y: { ids: ["y"], candidates: ["A2"] } },
    });
  });
});

describe("easyMode — members that find everything easy fail calibration", () => {
  it("flags success ≥ 90% with median ease ≥ 6, on the raw rate", () => {
    const easy = Array.from({ length: 10 }, (_, i) => ({ success: i > 0, ease: 6 + (i % 2) }));
    expect(easyMode(easy)).toEqual({
      sessions: 10,
      successRate: 0.9,
      medianEase: 6.5,
      flagged: true,
    });
    expect(
      easyMode([
        { success: true, ease: 7 },
        { success: false, ease: 2 },
      ]).flagged,
    ).toBe(false);
    // 8996 of 10000 rounds to 0.9 but is under it.
    const near = Array.from({ length: 10000 }, (_, i) => ({ success: i < 8996, ease: 7 }));
    expect(easyMode(near)).toMatchObject({ successRate: 0.9, flagged: false });
    expect(easyMode([])).toEqual({
      sessions: 0,
      successRate: null,
      medianEase: null,
      flagged: false,
    });
  });
});

describe("controls and the cycle gate", () => {
  const byId = new Map([["p", agreed("P1", 0.5)]]);
  const findings: Finding[] = [{ id: "p", level: "surface" }];

  it("passes a positive control only when every planted defect is found", () => {
    expect(controlVerdict("positive", { expect: ["P1"], findings, byId }).pass).toBe(true);
    const missed = controlVerdict("positive", { expect: ["P1", "P2"], findings, byId });
    expect(missed).toMatchObject({ pass: false, why: "missed: P2" });
  });

  it("fails a negative control none of whose sessions succeeded — its silence proves nothing", () => {
    const none = [{ success: false }, { success: false }];
    const cold = controlVerdict("negative", { expect: ["Q9"], findings, byId, sessions: none });
    expect(cold).toMatchObject({ pass: false, sessions: { sessions: 2, succeeded: 0 } });
    expect(cold.why).toMatch(/no session succeeded/);
    const one = [{ success: false }, { success: true }];
    const warm = controlVerdict("negative", { expect: ["Q9"], findings, byId, sessions: one });
    expect(warm).toMatchObject({ pass: true, sessions: { sessions: 2, succeeded: 1 } });
  });

  // An unsettled dispute counts as no match — the strict reading for recall, but the KIND one for a
  // fixed build, where "not reported" is the pass. One naming a fixed item holds the control.
  it("holds a negative control while a matcher dispute names one of its fixed items", () => {
    const split = (gold: string | null): Consensus => ({
      gold: null,
      score: 0,
      disputed: true,
      resolvedBy: "unresolved",
      m1: { gold, score: gold ? 1 : 0 },
      m2: { gold: null, score: 0 },
      tiebreak: null,
    });
    const held = controlVerdict("negative", {
      expect: ["Q9", "Q8"],
      findings: [{ id: "d", level: "surface" }],
      byId: new Map([["d", split("Q9")]]),
    });
    expect(held).toMatchObject({ pass: false, found: [], held: ["Q9"] });
    expect(held.why).toBe("held: a matcher dispute names Q9 — settle it with a tie-break");
    const elsewhere = controlVerdict("negative", {
      expect: ["Q8"],
      findings: [{ id: "d", level: "surface" }],
      byId: new Map([["d", split("Q9")]]),
    });
    expect(elsewhere).toMatchObject({ pass: true });
    expect(elsewhere).not.toHaveProperty("held");
  });

  it("fails a negative control that still reports a fixed item, and one that never ran", () => {
    expect(controlVerdict("negative", { expect: ["P1"], findings, byId }).pass).toBe(false);
    expect(controlVerdict("negative", null)).toEqual({
      kind: "negative",
      ran: false,
      pass: false,
      why: "not run",
    });
  });

  const ok = { kind: "negative" as const, ran: true, pass: true, why: "fine" };
  it("needs recall ≥ 0.6 at validity ≥ 0.5, ≥ 3 structural and both controls", () => {
    const pass = cycleGate({
      recall: 0.6,
      validity: 0.5,
      structural: 3,
      negative: ok,
      positive: ok,
    });
    expect(pass.pass).toBe(true);
    const thin = cycleGate({
      recall: 0.3,
      validity: 0.9,
      structural: 0,
      negative: ok,
      positive: ok,
    });
    expect(thin.pass).toBe(false);
    expect(thin.checks.filter((c) => !c.pass).map((c) => c.name)).toEqual(["recall", "structural"]);
    expect(thin.kill).toEqual({ met: true, why: ["recall under 0.35", "no structural findings"] });
    const noControl = cycleGate({
      recall: 1,
      validity: 1,
      structural: 9,
      negative: ok,
      positive: { ...ok, pass: false, why: "not run" },
    });
    expect(noControl.pass).toBe(false);
  });
});

describe("gradeRound — the made-up round, end to end from disk", () => {
  const input = loadRound(
    gradeArgs([
      "--sealed",
      join(FIX, "sealed"),
      "--round",
      join(FIX, "round"),
      "--struck",
      join(FIX, "round/struck.json"),
      "--negative",
      join(FIX, "negative"),
      "--positive",
      join(FIX, "positive"),
    ]),
  );
  const g = gradeRound(input);

  it("reads clean: every finding classed and labelled by both matchers", () => {
    expect(g.problems).toEqual([]);
  });

  it("finds 4 of the 6 renderable items blind (one struck), two of them partly", () => {
    expect(g.headline).toEqual({
      found: 4,
      renders: 6,
      total: 7,
      struck: 1,
      structural: 3,
      smaller: 1,
    });
    expect(g.classes.blind.thoroughness).toMatchObject({
      full: 2,
      partial: 2,
      wilson: { lo: 0.3, hi: 0.903 },
    });
    // A5 was found only by the measurements, which never count as discovery.
    expect(g.gold.find((r) => r.id === "A5")?.scores).toMatchObject({ instruments: 1, blind: 0 });
  });

  it("splits the hinted find out, and reports each member apart", () => {
    expect(g.primed.primed).toEqual(["A4"]);
    expect(g.primed.unprimed).toEqual(["A1", "A2", "A3"]);
    expect(g.perMember["night-owl"]).toMatchObject({ ids: ["A4"], primed: ["A4"] });
    expect(g.perMember.commuter).toMatchObject({ ids: ["A1"], primed: [] });
  });

  it("scores validity, matcher agreement and the disputed rows", () => {
    expect(g.classes.blind.validity).toEqual({
      reported: 13,
      real: 11,
      worldArtifacts: 1,
      false: 1,
      unchecked: 1,
      rate: 0.846,
    });
    expect(g.agreement.kappa).toBe(0.796);
    expect(g.agreement.disputed.map((d) => [d.finding, d.resolvedBy])).toEqual([
      ["F4", "tie-break"],
      ["F5", "unresolved"],
    ]);
    expect(g.gold.filter((r) => r.disputed).map((r) => r.id)).toEqual(["A3", "A5", "A6"]);
  });

  it("counts a known gap re-found as not new, and holds a disputed finding out of the yield", () => {
    expect(Object.keys(g.structural.groups)).toEqual(["F7", "F9", "F15"]);
    expect(g.structural.refound).toEqual({ F13: { ids: ["F13"], gold: ["B1"] } });
    expect(g.smaller.held).toEqual({ F5: { ids: ["F5"], candidates: ["A5", "A6"] } });
  });

  it("marks a row disputed only where a matcher claimed it, never on a score of 0", () => {
    const fs = [{ id: "f", level: "surface" }];
    const one = gradeRound({
      gold: parseGold("A3 three\nA7 seven"),
      classes: { f: "experts" },
      findings: fs,
      m1: [m("f", "A3", 1)],
      m2: [m("f", "A7", 0)],
    });
    expect(one.gold.filter((r) => r.disputed).map((r) => r.id)).toEqual(["A3"]);
  });

  it("reads the round's own struck.json when --struck is not given", () => {
    const own = loadRound(
      gradeArgs(["--sealed", join(FIX, "sealed"), "--round", join(FIX, "round")]),
    );
    expect(own.struck).toEqual(["A6"]);
  });

  it("records which items a trace touched, and passes the bar with both controls", () => {
    expect(g.gold.find((r) => r.id === "A7")?.touched).toBe(false);
    expect(g.gold.find((r) => r.id === "A2")?.touched).toBe(true);
    expect(g.controls.negative.pass).toBe(true);
    expect(g.controls.positive.pass).toBe(true);
    expect(g.gate.pass).toBe(true);
    expect(g.diagnostics.easyMode).toEqual({
      sessions: 2,
      successRate: 0.5,
      medianEase: 4.5,
      flagged: false,
    });
  });

  it("keeps the key's wording out of grade.json", () => {
    const text = JSON.stringify(g);
    for (const item of input.gold) expect(text).not.toContain(item.title);
  });

  it("reports a negative control's own sessions, and an expected id the key never had", () => {
    expect(g.controls.negative.sessions).toEqual({ sessions: 1, succeeded: 1 });
    const typo = input.negative && { ...input.negative, expect: ["S9"] };
    expect(gradeRound({ ...input, negative: typo }).problems).toEqual([
      "negative control: expect names unknown S9",
    ]);
  });

  it("refuses a control round passed as the main round", () => {
    const opts = gradeArgs(["--sealed", join(FIX, "sealed"), "--round", join(FIX, "negative")]);
    expect(() => loadRound(opts)).toThrow(/is a control round/);
  });

  it("refuses to grade without the sealed folder named", () => {
    expect(() => gradeArgs(["--round", "x"])).toThrow(/missing --sealed/);
  });
});

// The matchers are aware roles a workflow runs after the round (docs/members/study/roles/matcher.md).
// Their answer shape is the file the grader reads, so a schema-valid answer must grade cleanly and
// a score off the rubric's three steps must be refused by both.
describe("the matcher's answer", () => {
  const schema = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../scripts/study/schemas/matcher.json"), "utf8"),
  );
  const answer = {
    matches: [
      { finding: "a", gold: "Q1", score: 1, why: "the hall lamp; lit from below on both sides" },
      {
        finding: "b",
        gold: null,
        score: 0,
        why: "the hall lamp, but it flickers — not lit from below",
      },
    ],
  };

  it("fits its schema and is what the grader reads as matches-1.json", () => {
    expect(schemaProblems(schema, answer)).toEqual([]);
    const { problems } = consensus({ ids: ["a", "b"], m1: answer.matches, m2: answer.matches });
    expect(problems).toEqual([]);
  });

  it("allows only the rubric's three scores", () => {
    const off = { matches: [{ finding: "a", gold: "Q1", score: 0.75, why: "half a mechanism" }] };
    expect(schemaProblems(schema, off)).toEqual([
      "$.matches[0].score: 0.75 is not one of [0,0.5,1]",
    ]);
    expect(consensus({ ids: ["a"], m1: off.matches, m2: off.matches }).problems).toContain(
      "matches-1 scores a 0.75",
    );
  });
});
