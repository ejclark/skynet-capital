import { describe, expect, it } from "@rstest/core";
import type { Seen } from "../../scripts/study/metrics.mjs";
import {
  grade,
  gradeAnswer,
  MAX_NUMBERS,
  numbersIn,
  regionSeen,
  SEEN_MIN,
  tokens,
  withinTolerance,
} from "../../scripts/study/oracle.mjs";

// The oracle decides whether a simulated member got the task done: the answer it gave AND the
// place that answer lives having been on screen before it said done. Never the route, never the
// path. Traces here are the minimum the oracle reads: an action and each frame's `seen` list.

const seen = (text: string, ratio: number, covered = false): Seen => ({ text, ratio, covered });
const rec = (kind: string, extra: Record<string, unknown> = {}, frame: Seen[] = []) => ({
  action: { kind, ...extra },
  seen: frame,
});
const NUMBER_TASK = {
  answer: { kind: "number" as const, value: 412, abs: 1, ignoreSign: true },
  answerRegion: ["$412"],
};

describe("numbersIn — every number a free-text answer writes", () => {
  it("reads dollars, thousands separators, decimals and percentages", () => {
    expect(numbersIn("down $1,056.50, about 8.32%")).toEqual([1056.5, 8.32]);
  });
  it("keeps the sign before or after the dollar sign, including the typographic minus", () => {
    expect(numbersIn("-$412 and $-3 and −295")).toEqual([-412, -3, -295]);
  });
  it("scales a k or m suffix", () => {
    expect(numbersIn("about 1.2k, maybe 2m")).toEqual([1200, 2_000_000]);
  });
  it("finds none in words", () => {
    expect(numbersIn("no idea")).toEqual([]);
  });
});

describe("withinTolerance — absolute or relative, either holds", () => {
  it("passes inside the absolute band and fails outside it", () => {
    expect(withinTolerance(412.9, { value: 412, abs: 1 })).toBe(true);
    expect(withinTolerance(414, { value: 412, abs: 1 })).toBe(false);
  });
  it("passes inside the relative band", () => {
    expect(withinTolerance(97, { value: 96, rel: 0.02 })).toBe(true);
    expect(withinTolerance(99, { value: 96, rel: 0.02 })).toBe(false);
  });
  it("respects the sign unless the task ignores it", () => {
    expect(withinTolerance(-412, { value: 412 })).toBe(false);
    expect(withinTolerance(-412, { value: 412, ignoreSign: true })).toBe(true);
  });
});

describe("gradeAnswer — the fact the member reports", () => {
  it("matches a number anywhere in the answer", () => {
    expect(gradeAnswer("CRWV is down $412", NUMBER_TASK.answer).matched).toBe(true);
  });
  it("refuses a number outside tolerance and says which", () => {
    const r = gradeAnswer("down $295", NUMBER_TASK.answer);
    expect(r).toEqual({ matched: false, why: "295 not within tolerance of 412" });
  });
  it(`refuses an answer that lists more than ${MAX_NUMBERS} numbers — it lists, it does not answer`, () => {
    expect(gradeAnswer("1, 2, 3, 412, 5", NUMBER_TASK.answer).matched).toBe(false);
  });
  it("matches text when every token of the value is present, case-blind", () => {
    const answer = { kind: "text" as const, value: "Wheel aggressive" };
    expect(gradeAnswer("it is the AGGRESSIVE wheel", answer).matched).toBe(true);
    expect(gradeAnswer("the wheel", answer).matched).toBe(false);
  });
  it("accepts any listed alternative", () => {
    const answer = { kind: "text" as const, value: "CoreWeave", alternatives: ["CRWV"] };
    expect(gradeAnswer("crwv", answer).matched).toBe(true);
  });
  it("fails an empty answer", () => {
    expect(gradeAnswer("  ", NUMBER_TASK.answer)).toEqual({ matched: false, why: "no answer" });
  });
  it("folds case and accents into tokens", () => {
    expect(tokens("Café-Déjà vu")).toEqual(["cafe", "deja", "vu"]);
  });
});

describe("regionSeen — the answer's place was on screen", () => {
  it(`needs at least ${SEEN_MIN * 100}% of a snippet inside the viewport`, () => {
    expect(regionSeen([[seen("$412", 0.4)]], ["$412"]).seen).toBe(false);
    expect(regionSeen([[seen("$412", 0.4)], [seen("$412", 0.5)]], ["$412"])).toEqual({
      seen: true,
      frame: 1,
      ratio: 0.5,
    });
  });
  it("does not count a snippet something else covers", () => {
    expect(regionSeen([[seen("$412", 1, true)]], ["$412"]).seen).toBe(false);
  });
  it("counts any one of several snippets", () => {
    expect(regionSeen([[seen("a", 0), seen("b", 1)]], ["a", "b"]).seen).toBe(true);
  });
});

describe("grade — success needs the answer AND its place seen before done", () => {
  it("succeeds when the answer matches and the region was seen in an earlier frame", () => {
    const trace = [rec("scroll", {}, [seen("$412", 1)]), rec("done", { answer: "down $412" })];
    const v = grade({ task: NUMBER_TASK, opening: { seen: [seen("$412", 0)] }, trace });
    expect(v.success).toBe(true);
    expect(v.endedBy).toBe("done");
    expect(v.region.frame).toBe(1);
  });
  it("counts the opening frame", () => {
    const v = grade({
      task: NUMBER_TASK,
      opening: { seen: [seen("$412", 1)] },
      trace: [rec("done", { answer: "412" })],
    });
    expect(v.success).toBe(true);
  });
  it("fails a right answer whose place never reached the screen — a guess is not a find", () => {
    const v = grade({
      task: NUMBER_TASK,
      opening: { seen: [seen("$412", 0)] },
      trace: [rec("done", { answer: "412" })],
    });
    expect(v.success).toBe(false);
    expect(v.reason).toMatch(/never ≥ 50% on screen/);
  });
  it("ignores frames after done", () => {
    const v = grade({
      task: NUMBER_TASK,
      opening: { seen: [] },
      trace: [rec("done", { answer: "412" }), rec("scroll", {}, [seen("$412", 1)])],
    });
    expect(v.success).toBe(false);
  });
  it("fails a give-up and a run that hit the cap, whatever they saw", () => {
    const shown = { seen: [seen("$412", 1)] };
    const gaveUp = grade({ task: NUMBER_TASK, opening: shown, trace: [rec("give_up")] });
    expect(gaveUp).toMatchObject({ success: false, endedBy: "give_up" });
    const capped = grade({ task: NUMBER_TASK, opening: shown, trace: [rec("scroll")] });
    expect(capped).toMatchObject({ success: false, endedBy: "cap" });
  });
  it("never reads the route: the same answer from two different pages both succeed", () => {
    const viaA = [{ ...rec("tap", {}, [seen("$412", 1)]), after: { pathname: "/a" } }];
    const viaB = [{ ...rec("tap", {}, [seen("$412", 1)]), after: { pathname: "/b" } }];
    const done = rec("done", { answer: "412" });
    for (const path of [viaA, viaB]) {
      expect(grade({ task: NUMBER_TASK, opening: null, trace: [...path, done] }).success).toBe(
        true,
      );
    }
  });
  it("skips refused records", () => {
    const v = grade({
      task: NUMBER_TASK,
      opening: { seen: [seen("$412", 1)] },
      trace: [{ ...rec("done", { answer: "412" }), refused: "x" }],
    });
    expect(v.endedBy).toBe("cap");
  });
});
