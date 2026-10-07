import {
  carriedOnResubscribe,
  EMPTY_SUBSCRIPTIONS,
  isCalendarDay,
  parseSubscriptionsState,
} from "../../src/subscriptions/subscription-state.js";

const valid = {
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
};

describe("parseSubscriptionsState", () => {
  it("is empty by default", () => {
    expect(EMPTY_SUBSCRIPTIONS).toEqual({});
  });

  it("parses a well-formed multi-account state", () => {
    const state = parseSubscriptionsState({
      "acct-1": [valid],
      "acct-2": [{ ...valid, playbookId: "G1-GOOG", capitalAllocated: 2_000 }],
    });

    expect(state?.["acct-1"]).toEqual([{ ...valid, accountId: "acct-1" }]);
    expect(state?.["acct-2"]?.[0]?.playbookId).toBe("G1-GOOG");
  });

  it("rejects non-record top-level input entirely", () => {
    expect(parseSubscriptionsState(null)).toBeNull();
    expect(parseSubscriptionsState("nope")).toBeNull();
    expect(parseSubscriptionsState([valid])).toBeNull();
  });

  it("drops an account whose value isn't an array, without rejecting the whole state", () => {
    const state = parseSubscriptionsState({
      "acct-1": [valid],
      "acct-2": "not an array",
    });
    expect(state?.["acct-1"]).toHaveLength(1);
    expect(state?.["acct-2"]).toBeUndefined();
  });

  it("omits an account key entirely once every one of its subscriptions is malformed", () => {
    const state = parseSubscriptionsState({
      "acct-1": [{ ...valid, mode: "extreme" }],
    });
    expect(state).toEqual({});
  });

  for (const [field, badValue] of [
    ["playbookId", 42],
    ["playbookId", ""],
    ["mode", "extreme"],
    ["capitalAllocated", "5000"],
    ["capitalAllocated", Number.NaN],
    ["enabled", "yes"],
    ["createdAt", 123],
    ["updatedAt", undefined],
  ] as const) {
    it(`drops a subscription with an invalid ${field}`, () => {
      const state = parseSubscriptionsState({ "acct-1": [{ ...valid, [field]: badValue }] });
      expect(state?.["acct-1"]).toBeUndefined();
    });
  }

  it("drops a non-record entry inside an otherwise-valid account array", () => {
    const state = parseSubscriptionsState({ "acct-1": [valid, "garbage", 42] });
    expect(state?.["acct-1"]).toHaveLength(1);
  });

  describe("symbol-targeting filter (#885)", () => {
    it("parses a well-formed symbols filter", () => {
      const state = parseSubscriptionsState({
        "acct-1": [{ ...valid, symbols: ["EEM", "AAPL"] }],
      });
      expect(state?.["acct-1"]?.[0]?.symbols).toEqual(["EEM", "AAPL"]);
    });

    it("leaves symbols absent when the field was never supplied — the subscription still parses", () => {
      const state = parseSubscriptionsState({ "acct-1": [valid] });
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("symbols");
    });

    it("drops the whole filter (not the subscription) on a malformed symbols value", () => {
      for (const badSymbols of [[], "EEM", 42, [1, 2], ["EEM", 42], null]) {
        const state = parseSubscriptionsState({ "acct-1": [{ ...valid, symbols: badSymbols }] });
        expect(state?.["acct-1"]).toHaveLength(1);
        expect(state?.["acct-1"]?.[0]).not.toHaveProperty("symbols");
      }
    });
  });

  describe("compounding opt-in (issue #3527 slice 3)", () => {
    it("parses compoundAllocation: true", () => {
      const state = parseSubscriptionsState({ "acct-1": [{ ...valid, compoundAllocation: true }] });
      expect(state?.["acct-1"]?.[0]?.compoundAllocation).toBe(true);
    });

    it("leaves compoundAllocation absent when never supplied", () => {
      const state = parseSubscriptionsState({ "acct-1": [valid] });
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("compoundAllocation");
    });

    it("treats compoundAllocation: false the same as absent, never stored as an explicit false", () => {
      const state = parseSubscriptionsState({
        "acct-1": [{ ...valid, compoundAllocation: false }],
      });
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("compoundAllocation");
    });

    it("drops only the flag (not the subscription) on a non-boolean compoundAllocation", () => {
      const state = parseSubscriptionsState({
        "acct-1": [{ ...valid, compoundAllocation: "yes" }],
      });
      expect(state?.["acct-1"]).toHaveLength(1);
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("compoundAllocation");
    });
  });

  describe("fields a newer build wrote (#4772)", () => {
    it("keeps a field this build does not know on the parsed record, unchanged", () => {
      const window = { from: "D-20", to: "D-6" };
      const state = parseSubscriptionsState({ "acct-1": [{ ...valid, window }] });
      expect(state?.["acct-1"]?.[0]).toEqual({ ...valid, accountId: "acct-1", window });
    });

    it("never lets an unknown field stand in for a known one", () => {
      const state = parseSubscriptionsState({
        "acct-1": [{ ...valid, accountId: "someone-else", compoundAllocation: "yes" }],
      });
      expect(state?.["acct-1"]?.[0]?.accountId).toBe("acct-1");
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("compoundAllocation");
    });

    it("skips a reserved $ key even when it holds an array — it is never an account", () => {
      const state = parseSubscriptionsState({ "acct-1": [valid], $allocations: [valid] });
      expect(Object.keys(state ?? {})).toEqual(["acct-1"]);
    });

    it("a re-subscribe carries a conviction and a newer build's field, never what it sets", () => {
      const conviction = { reason: "Eric's call", checkOn: "2027-01-29" };
      const [prior] =
        parseSubscriptionsState({
          "acct-1": [{ ...valid, symbols: ["NVDA"], conviction, window: { from: "D-20" } }],
        })?.["acct-1"] ?? [];
      expect(prior && carriedOnResubscribe(prior)).toEqual({
        conviction,
        window: { from: "D-20" },
      });
    });
  });

  describe("conviction (#4469 slice 3c part 1)", () => {
    const conviction = {
      reason: "CRWV runs as Eric's conviction, against the study's stand-aside",
      checkOn: "2027-01-29",
    };

    it("parses an owner's reason and the day it is checked", () => {
      const state = parseSubscriptionsState({ "acct-1": [{ ...valid, conviction }] });
      expect(state?.["acct-1"]?.[0]?.conviction).toEqual(conviction);
    });

    it("leaves it absent when there is none on record", () => {
      const state = parseSubscriptionsState({ "acct-1": [valid] });
      expect(state?.["acct-1"]?.[0]).not.toHaveProperty("conviction");
    });

    it("drops a malformed conviction, never the subscription — the bots keep trading it (criterion 11)", () => {
      for (const bad of [
        "Eric's call",
        { reason: "", checkOn: "2027-01-29" },
        { reason: "   ", checkOn: "2027-01-29" },
        { reason: "x".repeat(2049), checkOn: "2027-01-29" },
        { reason: 7, checkOn: "2027-01-29" },
        { reason: "Eric's call" },
        { reason: "Eric's call", checkOn: "2027-02-30" },
        { reason: "Eric's call", checkOn: "2027-1-29" },
        { reason: "Eric's call", checkOn: "2027-01-29T00:00:00Z" },
      ]) {
        const state = parseSubscriptionsState({ "acct-1": [{ ...valid, conviction: bad }] });
        expect(state?.["acct-1"]).toHaveLength(1);
        expect(state?.["acct-1"]?.[0]).not.toHaveProperty("conviction");
      }
    });

    it("isCalendarDay: a real day only", () => {
      expect(isCalendarDay("2028-02-29")).toBe(true);
      expect(isCalendarDay("2027-02-29")).toBe(false);
      expect(isCalendarDay(20270129)).toBe(false);
    });
  });
});
