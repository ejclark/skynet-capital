import { describe, expect, it } from "@rstest/core";
import { rescoreOracle } from "../../scripts/study/rescore.mjs";

// Re-grading after an oracle fix touches only the answer half; what was on screen stays as measured.
const TASK = { answer: { kind: "number", value: 1095445, abs: 500 } };
const META = { rule: "rival amounts, not a number count", at: "2026-10-09T18:00:00Z" };
const failed = (given: string, seen = true) => ({
  success: false,
  endedBy: "done",
  answer: { given, matched: false, why: "5 numbers in one answer — it lists, it does not answer" },
  region: { seen, frame: 2, ratio: seen ? 1 : 0 },
  reason: "5 numbers in one answer — it lists, it does not answer",
});

describe("rescoreOracle", () => {
  it("passes a right answer the old listing rule failed, and keeps the old verdict beside it", () => {
    const r = rescoreOracle(
      failed("$1,095,445 across both (mine $98,479, the bot $996,966), up $1,880"),
      TASK,
      META,
    );
    expect(r.changed).toBe(true);
    expect(r.oracle.success).toBe(true);
    expect(r.oracle.rescored.previous.success).toBe(false);
    expect(r.oracle.rescored.rule).toBe(META.rule);
  });
  it("never passes an answer whose place was never on screen", () => {
    const r = rescoreOracle(failed("$1,095,445", false), TASK, META);
    expect(r.oracle.success).toBe(false);
    expect(r.oracle.reason).toMatch(/never ≥ 50% on screen/);
  });
  it("leaves a give-up alone", () => {
    const o = {
      success: false,
      endedBy: "give_up",
      answer: { given: null, matched: false, why: "gave up" },
      region: { seen: false, frame: null, ratio: 0 },
      reason: "gave up",
    };
    expect(rescoreOracle(o, TASK, META)).toEqual({ changed: false, oracle: o });
  });
});
