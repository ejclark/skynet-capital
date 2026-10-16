import { describe, expect, it } from "@rstest/core";
import type { Seen } from "../../scripts/study/metrics.mjs";
import {
  datesIn,
  grade,
  gradeAnswer,
  hedged,
  MAX_RIVALS,
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
  it("reads a spaced dash as punctuation and a range as two positive numbers", () => {
    expect(numbersIn("CRWV – $412")).toEqual([412]);
    expect(numbersIn("400-412")).toEqual([400, 412]);
  });
  it("skips dates, clock times and digits glued to a word", () => {
    expect(numbersIn("bought 10/01 at 9:45 on 2026-10-01, Q3: $412")).toEqual([412]);
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
  it(`refuses more than ${MAX_RIVALS} other amount the size of the answer — a list of candidates`, () => {
    expect(gradeAnswer("$380, $412, $455", NUMBER_TASK.answer).matched).toBe(false);
  });
  it("keeps a right total that also gives its breakdown — the first full round's real answer", () => {
    const given =
      "About $1.1 million — $1,095,445 across both accounts (my own at $98,479 plus the Sauron bot at $996,966), up $1,880 on the day.";
    expect(gradeAnswer(given, { kind: "number", value: 1095445, abs: 500 }).matched).toBe(true);
  });
  it("keeps a right answer that also carries a date, a share count and a percentage", () => {
    const given = "I hold 3 CRWV shares bought 10/01, down $412 (−8.3%)";
    expect(gradeAnswer(given, { kind: "number", value: 412, abs: 1 }).matched).toBe(true);
  });
  it("refuses a guess between numbers of one unit, keeps one fact said in two units", () => {
    expect(hedged("maybe $100, $200, $412 or $500")).toBe(true);
    expect(gradeAnswer("maybe $100, $200, $412 or $500", NUMBER_TASK.answer)).toEqual({
      matched: false,
      why: "it offers a choice of numbers — a guess",
    });
    expect(hedged("down $412, or 8.3%")).toBe(false);
    expect(gradeAnswer("down $412, or 8.3%", NUMBER_TASK.answer).matched).toBe(true);
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
});

// The first full round's audit (2026-10-09, #5009): 20 of 42 failed answers were right. These are
// the shapes the grader got wrong, in the members' own words.
describe("gradeAnswer — a date, written any common way", () => {
  const DATE = { kind: "text" as const, value: "2026-11-06" };
  it("reads the same calendar day in words, abbreviations, ordinals and numbers", () => {
    for (const given of [
      "it runs out on 6 November 2026",
      "expires Nov 6",
      "Friday, November 6, 2026",
      "on the 6th of November",
      "Nov. 6th, 2026",
      "11/6/2026",
      "11/06",
      "2026-11-06",
      "CRWV $80 PUT · 6 NOV 26",
    ]) {
      expect({ given, ...gradeAnswer(given, DATE) }).toMatchObject({ given, matched: true });
    }
  });
  it("refuses another day, another month or another stated year", () => {
    for (const given of ["Nov 7", "6 October 2026", "6 November 2025", "11/16", "no idea"]) {
      expect({ given, ...gradeAnswer(given, DATE) }).toMatchObject({ given, matched: false });
    }
  });
  it("keeps a right date beside a later one it names as context", () => {
    const given =
      "MSFT earnings on Tuesday, Oct 27, 2026 (45 shares), with AAPL earnings two days later on Thursday, Oct 29, 2026";
    expect(gradeAnswer(given, { kind: "text", value: "2026-10-27" }).matched).toBe(true);
  });
  it("refuses a guess between two days", () => {
    expect(gradeAnswer("Oct 14 or Oct 28", { kind: "text", value: "2026-10-14" })).toEqual({
      matched: false,
      why: "it offers a choice of dates — a guess",
    });
  });
  it("finds no date inside a clock time, an amount or a percentage", () => {
    expect(datesIn("at 11:06, down $11.06 or 11.6%")).toEqual([]);
  });
  it("still matches a text answer that is not a date by its tokens", () => {
    expect(gradeAnswer("it is sold", { kind: "text", value: "sold" }).matched).toBe(true);
  });
});

describe("gradeAnswer — labelled context is not a list of candidates", () => {
  it("keeps a figure given with its parts, each named", () => {
    const given =
      "I'd say about $25,200 — $25,212 to be exact ($20,111 cash and $5,101 in shares).";
    expect(gradeAnswer(given, { kind: "number", value: 25212, abs: 1 }).matched).toBe(true);
  });
  it("keeps a total whose account and cash are named beside it", () => {
    const given =
      "About $1.1 million — $1,095,445 across the whole book. That's my own account at $98,479 plus the Sauron bot account at $996,966, up $1,880 (+0.17%) today, with $1,024,280 of it sitting in cash and 5 positions open.";
    expect(gradeAnswer(given, { kind: "number", value: 1095445, abs: 1 }).matched).toBe(true);
  });
  it("keeps one holding's figure beside another holding named as separate", () => {
    const given =
      "his AAPL line shows 60 shares worth $14,166, bought at $228.40 and now $236.10, with a total profit of +$462, which is +3.37%. His other holding, MSFT, is a separate +$414, and his whole paper gain is +$876.";
    expect(gradeAnswer(given, { kind: "number", value: 462, abs: 1 }).matched).toBe(true);
  });
  it("still refuses bare candidates, however the answer opens", () => {
    for (const given of [
      "$380, $412, $455",
      "I'd say $380, $412, $455",
      "maybe $380 / $412 / $455",
    ]) {
      expect({ given, ...gradeAnswer(given, NUMBER_TASK.answer) }).toMatchObject({
        given,
        matched: false,
      });
    }
  });
  it("counts a rounded restatement of the answer as the answer, not a rival", () => {
    expect(gradeAnswer("about $400 — $412 exactly", NUMBER_TASK.answer).matched).toBe(true);
    expect(gradeAnswer("$500, $412, $300", NUMBER_TASK.answer).matched).toBe(false);
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
