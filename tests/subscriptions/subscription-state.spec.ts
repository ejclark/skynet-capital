import {
  EMPTY_SUBSCRIPTIONS,
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
});
