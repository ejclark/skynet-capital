import { judgeTargetSplit, parseTargetSplit } from "../../src/observatory/target-split.js";

/**
 * A target split (#4607) is the member's own three whole percents that add to 100, plus a tolerance
 * of 1–25 points. Every refusal is the sentence the Settings form shows, so each names what to fix.
 */
describe("judgeTargetSplit", () => {
  const split = { sharesPct: 60, optionsPct: 10, cashPct: 30, tolerancePct: 5 };

  it("accepts three whole percents that add to 100 and a tolerance in range", () => {
    expect(judgeTargetSplit(split)).toEqual(split);
  });

  it("accepts a slice of 0 — a member may want no options at all", () => {
    expect(judgeTargetSplit({ ...split, optionsPct: 0, cashPct: 40 })).toEqual({
      ...split,
      optionsPct: 0,
      cashPct: 40,
    });
  });

  it("drops any field it does not know", () => {
    expect(judgeTargetSplit({ ...split, owner: "someone-else" })).toEqual(split);
  });

  it("names the sum when the slices do not add to 100", () => {
    expect(judgeTargetSplit({ ...split, cashPct: 25 })).toBe(
      "The three slices add to 95% — they need to add to 100%.",
    );
  });

  it.each([
    ["a fraction", { ...split, sharesPct: 59.5, cashPct: 30.5 }],
    ["a negative", { ...split, sharesPct: -10, cashPct: 100 }],
    ["a string", { ...split, sharesPct: "60" }],
    ["a missing slice", { sharesPct: 60, cashPct: 40, tolerancePct: 5 }],
  ])("refuses %s as a slice", (_label, body) => {
    expect(judgeTargetSplit(body)).toBe("Each slice is a whole percent from 0 to 100.");
  });

  it.each([0, 26, 2.5, undefined])("refuses a tolerance of %s", (tolerancePct) => {
    expect(judgeTargetSplit({ ...split, tolerancePct })).toBe(
      "The tolerance is a whole number of points from 1 to 25.",
    );
  });

  it("refuses something that is not an object", () => {
    expect(typeof judgeTargetSplit([60, 10, 30])).toBe("string");
  });
});

describe("parseTargetSplit", () => {
  const record = {
    sharesPct: 50,
    optionsPct: 20,
    cashPct: 30,
    tolerancePct: 10,
    updatedAt: "2026-11-10T00:00:00.000Z",
  };

  it("reads a stored record back whole", () => {
    expect(parseTargetSplit(record)).toEqual(record);
  });

  it("refuses a record without its timestamp, or one a save would refuse", () => {
    const { updatedAt: _dropped, ...noStamp } = record;
    expect(parseTargetSplit(noStamp)).toBeUndefined();
    expect(parseTargetSplit({ ...record, cashPct: 31 })).toBeUndefined();
  });
});
