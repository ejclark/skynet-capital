import type { PlaybookSubscription } from "../../src/domain/types.js";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.js";
import type { RoundTrip } from "../../src/trading/round-trips.js";

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "acct-1",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
  ...overrides,
});

const trip = (overrides: Partial<RoundTrip> = {}): RoundTrip => ({
  symbol: "NVDA",
  quantity: 10,
  entryPrice: 100,
  exitPrice: 100,
  openedAt: "2026-09-22T14:00:00.000Z",
  closedAt: "2026-09-22T14:05:00.000Z",
  realized: 0,
  returnPct: 0,
  holdMs: 5 * 60 * 1000,
  ...overrides,
});

describe("playbookStoreView", () => {
  it("marks canManage false and hides all subscription state when the viewer doesn't own the desk", () => {
    const view = playbookStoreView(undefined);
    expect(view.canManage).toBe(false);
    expect(view.capitalUnderManagement).toBe(0);
    for (const card of view.cards) {
      expect(card.subscription).toBeUndefined();
    }
  });

  it("marks canManage true for an owner with zero subscriptions — an empty array, not absent", () => {
    const view = playbookStoreView([]);
    expect(view.canManage).toBe(true);
    expect(view.capitalUnderManagement).toBe(0);
  });

  it("attaches the matching subscription's mode/capital/enabled onto its own card only", () => {
    const view = playbookStoreView([sub({ playbookId: "S1-NVDA", mode: "aggressive" })]);
    const nvda = view.cards.find((c) => c.id === "S1-NVDA");
    const goog = view.cards.find((c) => c.id === "G1-GOOG");
    expect(nvda?.subscription).toEqual({
      mode: "aggressive",
      capitalAllocated: 5_000,
      enabled: true,
    });
    expect(goog?.subscription).toBeUndefined();
  });

  it("sums capitalUnderManagement across enabled subscriptions only, excluding disabled ones", () => {
    const view = playbookStoreView([
      sub({ playbookId: "S1-NVDA", capitalAllocated: 5_000, enabled: true }),
      sub({ playbookId: "G1-GOOG", capitalAllocated: 3_000, enabled: false }),
      sub({ playbookId: "TACO-DJT", capitalAllocated: 1_000, enabled: true }),
    ]);
    expect(view.capitalUnderManagement).toBe(6_000);
  });

  it("carries a symbol-targeting filter (#885) onto its card, and omits it when absent", () => {
    const view = playbookStoreView([sub({ playbookId: "S1-NVDA", symbols: ["EEM", "AAPL"] })]);
    const nvda = view.cards.find((c) => c.id === "S1-NVDA");
    expect(nvda?.subscription).toEqual({
      mode: "standard",
      capitalAllocated: 5_000,
      enabled: true,
      symbols: ["EEM", "AAPL"],
    });
  });

  it("leaves every card's metrics empty when no round-trips are passed (#3543 slice 2 default)", () => {
    const view = playbookStoreView([]);
    for (const card of view.cards) {
      expect(card.metrics).toEqual([]);
    }
  });

  it("reports 'not yet measured' on a card below the whipsaw sample floor", () => {
    const trips = [
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 }),
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 }),
    ];
    const view = playbookStoreView([], false, trips);
    const nvda = view.cards.find((c) => c.id === "S1-NVDA");
    expect(nvda?.metrics).toEqual([
      { label: "Whipsaw rate", value: "not yet measured (2 round trips)" },
    ]);
  });

  it("surfaces a real whipsaw rate once the sample floor is reached, on its own card only", () => {
    const trips = Array.from({ length: 5 }, () =>
      trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 }),
    );
    const view = playbookStoreView([], false, trips);
    const nvda = view.cards.find((c) => c.id === "S1-NVDA");
    const goog = view.cards.find((c) => c.id === "G1-GOOG");
    expect(nvda?.metrics).toEqual([
      { label: "Whipsaw rate", value: "100% whipsaw (5 round trips)" },
    ]);
    expect(goog?.metrics).toEqual([]);
  });

  it("computes whipsaw metrics independently of subscription state (unsubscribed playbook still measured)", () => {
    const trips = Array.from({ length: 5 }, () =>
      trip({ playbookId: "TACO-DJT", realized: 10, holdMs: 60_000 }),
    );
    const view = playbookStoreView([sub({ playbookId: "S1-NVDA" })], false, trips);
    const djt = view.cards.find((c) => c.id === "TACO-DJT");
    expect(djt?.subscription).toBeUndefined();
    expect(djt?.metrics).toEqual([{ label: "Whipsaw rate", value: "0% whipsaw (5 round trips)" }]);
  });

  describe("warm-up opt-in (#3543)", () => {
    it("carries requireWarmup: true onto the subscription, omits it when off", () => {
      const view = playbookStoreView([sub({ playbookId: "S1-NVDA", requireWarmup: true })]);
      const nvda = view.cards.find((c) => c.id === "S1-NVDA");
      const goog = view.cards.find((c) => c.id === "G1-GOOG");
      expect(nvda?.subscription?.requireWarmup).toBe(true);
      expect(goog?.subscription).toBeUndefined();
      // A plain subscription (no opt-in) never carries the key at all.
      const view2 = playbookStoreView([sub({ playbookId: "S1-NVDA" })]);
      expect(view2.cards.find((c) => c.id === "S1-NVDA")?.subscription).not.toHaveProperty(
        "requireWarmup",
      );
    });

    it("sharpens the unmeasured copy to 'warming up — trading held' when the owner opted in", () => {
      const trips = [trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 })];
      const view = playbookStoreView(
        [sub({ playbookId: "S1-NVDA", requireWarmup: true })],
        false,
        trips,
      );
      const nvda = view.cards.find((c) => c.id === "S1-NVDA");
      expect(nvda?.metrics).toEqual([
        { label: "Whipsaw rate", value: "warming up — trading held (1 round trips)" },
      ]);
    });

    it("uses the plain 'not yet measured' copy when the owner did NOT opt in", () => {
      const trips = [trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 })];
      const view = playbookStoreView([sub({ playbookId: "S1-NVDA" })], false, trips);
      const nvda = view.cards.find((c) => c.id === "S1-NVDA");
      expect(nvda?.metrics).toEqual([
        { label: "Whipsaw rate", value: "not yet measured (1 round trips)" },
      ]);
    });

    it("drops the 'warming up' framing once the sample floor is reached, even with the opt-in on", () => {
      const trips = Array.from({ length: 5 }, () =>
        trip({ playbookId: "S1-NVDA", realized: -10, holdMs: 60_000 }),
      );
      const view = playbookStoreView(
        [sub({ playbookId: "S1-NVDA", requireWarmup: true })],
        false,
        trips,
      );
      const nvda = view.cards.find((c) => c.id === "S1-NVDA");
      expect(nvda?.metrics).toEqual([
        { label: "Whipsaw rate", value: "100% whipsaw (5 round trips)" },
      ]);
    });
  });

  describe("compounding opt-in (issue #3527 slice 3)", () => {
    it("carries compoundAllocation: true onto the subscription, omits it when off", () => {
      const view = playbookStoreView([sub({ playbookId: "S1-NVDA", compoundAllocation: true })]);
      const nvda = view.cards.find((c) => c.id === "S1-NVDA");
      const goog = view.cards.find((c) => c.id === "G1-GOOG");
      expect(nvda?.subscription?.compoundAllocation).toBe(true);
      expect(goog?.subscription).toBeUndefined();
      const view2 = playbookStoreView([sub({ playbookId: "S1-NVDA" })]);
      expect(view2.cards.find((c) => c.id === "S1-NVDA")?.subscription).not.toHaveProperty(
        "compoundAllocation",
      );
    });
  });
});
