import type { PlaybookSubscription } from "../../src/domain/types.js";
import {
  EMPTY_SUBSCRIPTIONS,
  parseSubscriptionsState,
  subscriberCountsByPlaybook,
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
});

/**
 * WHO RUNS EACH PLAYBOOK, AS A COUNT (#3970). WHEN accounts have a playbook subscribed and enabled,
 * `subscriberCountsByPlaybook` SHALL report how many — and nothing that identifies them. Falsifier:
 * any account id reachable from the returned value, or a paused subscription raising a count.
 */
describe("subscriberCountsByPlaybook", () => {
  const sub = (over: Partial<PlaybookSubscription>): PlaybookSubscription =>
    ({ ...valid, accountId: "acct-1", ...over }) as PlaybookSubscription;

  it("counts one per account with the playbook enabled, across every account", () => {
    const counts = subscriberCountsByPlaybook({
      "acct-1": [sub({ playbookId: "S1-NVDA" }), sub({ playbookId: "G1-GOOG" })],
      "acct-2": [sub({ accountId: "acct-2", playbookId: "S1-NVDA" })],
      "acct-3": [sub({ accountId: "acct-3", playbookId: "S1-NVDA" })],
    });
    expect(counts["S1-NVDA"]).toBe(3);
    expect(counts["G1-GOOG"]).toBe(1);
  });

  it("leaves a playbook nobody subscribed to absent, never a measured zero", () => {
    const counts = subscriberCountsByPlaybook({ "acct-1": [sub({ playbookId: "S1-NVDA" })] });
    expect(counts).not.toHaveProperty("TACO-DJT");
  });

  it("excludes a paused subscription — the count answers 'who is running this', not 'who ever did'", () => {
    const counts = subscriberCountsByPlaybook({
      "acct-1": [sub({ playbookId: "S1-NVDA", enabled: false })],
      "acct-2": [sub({ accountId: "acct-2", playbookId: "S1-NVDA", enabled: true })],
    });
    expect(counts["S1-NVDA"]).toBe(1);
  });

  it("drops to an empty map for a playbook whose only subscribers are all paused", () => {
    const counts = subscriberCountsByPlaybook({
      "acct-1": [sub({ playbookId: "S1-NVDA", enabled: false })],
    });
    expect(counts).toEqual({});
  });

  it("carries no account identity at all — only playbook ids as keys and numbers as values", () => {
    const counts = subscriberCountsByPlaybook({
      "acct-secret": [sub({ accountId: "acct-secret", playbookId: "S1-NVDA" })],
    });
    expect(JSON.stringify(counts)).not.toContain("acct-secret");
    expect(Object.values(counts).every((n) => typeof n === "number")).toBe(true);
  });

  it("is empty for empty state", () => {
    expect(subscriberCountsByPlaybook(EMPTY_SUBSCRIPTIONS)).toEqual({});
  });
});
