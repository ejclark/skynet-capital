import {
  compareSplit,
  judgeTargetSplit,
  parseTargetSplit,
} from "../../src/observatory/target-split.js";

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

/**
 * #4607 slice 2: the book against the member's target. The gap is actual − target in points and the
 * same share of the bar's whole in dollars; a slice is over or under only past the tolerance.
 */
describe("compareSplit", () => {
  const target = { sharesPct: 60, optionsPct: 15, cashPct: 25, tolerancePct: 5 };

  it("names each slice's gap in points and in dollars of the whole", () => {
    const comparison = compareSplit(
      { sharesPct: 50, optionsPct: 25, cashPct: 25, total: 41_000 },
      target,
    );
    expect(comparison?.outside).toBe(true);
    expect(comparison?.slices.map((s) => [s.key, s.gapPct, s.gapDollars, s.status])).toEqual([
      ["sharesPct", -10, -4_100, "under"],
      ["optionsPct", 10, 4_100, "over"],
      ["cashPct", 0, 0, "within"],
    ]);
  });

  it("calls a slice within until it passes the tolerance, not when it reaches it", () => {
    const comparison = compareSplit(
      { sharesPct: 55, optionsPct: 20, cashPct: 25, total: 10_000 },
      target,
    );
    expect(comparison?.outside).toBe(false);
    expect(comparison?.slices.every((s) => s.status === "within")).toBe(true);
  });

  it("trims and adds the same dollars, so the moves land the book on the target", () => {
    const comparison = compareSplit(
      { sharesPct: 41.3, optionsPct: 33.9, cashPct: 24.8, total: 952_378 },
      target,
    );
    const net = comparison?.slices.reduce((sum, s) => sum + s.gapDollars, 0) ?? NaN;
    expect(Math.abs(net)).toBeLessThanOrEqual(1);
  });

  it("refuses an empty or unreadable book rather than invent a gap", () => {
    const empty = { sharesPct: 0, optionsPct: 0, cashPct: 0 };
    expect(compareSplit({ ...empty, total: 0 }, target)).toBeUndefined();
    expect(compareSplit({ ...empty, total: Number.NaN }, target)).toBeUndefined();
  });
});
