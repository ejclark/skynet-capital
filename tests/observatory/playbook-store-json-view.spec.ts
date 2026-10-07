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

describe("the Store by strategy, joined to the viewer's own account (#4469 slice 3a)", () => {
  const TODAY = "2026-10-07T15:00:00.000Z";
  const PAST_SHELF = "2027-04-01T15:00:00.000Z";
  // Eric's two live subscriptions, as the plan's call 1 names them.
  const erics = [
    sub({ playbookId: "S1-NVDA", capitalAllocated: 50_000, compoundAllocation: true }),
    sub({ playbookId: "CRWV-WHEEL", mode: "aggressive", capitalAllocated: 75_000 }),
  ];
  const rowsOf = (view: ReturnType<typeof playbookStoreView>) =>
    new Map(view.strategies.flatMap((card) => card.pairs).map((row) => [row.id, row]));

  it("joins each subscription onto its pair's row, and keeps it there past the shelf date", () => {
    for (const asOf of [TODAY, PAST_SHELF]) {
      const rows = rowsOf(playbookStoreView(erics, false, [], false, asOf));
      expect(rows.get("S1-NVDA")?.subscription, asOf).toEqual({
        mode: "standard",
        capitalAllocated: 50_000,
        enabled: true,
        compoundAllocation: true,
      });
      expect(rows.get("CRWV-WHEEL")?.subscription, asOf).toEqual({
        mode: "aggressive",
        capitalAllocated: 75_000,
        enabled: true,
      });
      expect(rows.get("S1-NVDA")?.subscribeRefusal, asOf).toBeUndefined();
      expect(rows.get("CRWV-WHEEL")?.subscribeRefusal, asOf).toBeUndefined();
    }
  });

  it("keeps the per-playbook cards beside it for one release", () => {
    const view = playbookStoreView(erics, false, [], false, TODAY);
    expect(view.cards.find((card) => card.id === "CRWV-WHEEL")?.subscription?.mode).toBe(
      "aggressive",
    );
  });

  it("shows why an unsubscribed row would be refused — a stale ✓, once its shelf date passes", () => {
    const rows = rowsOf(playbookStoreView(erics, false, [], false, PAST_SHELF));
    expect(rows.get("G1-GOOG")?.subscribeRefusal).toMatch(/ran past its shelf date \(2027-03-31\)/);
    expect(
      rowsOf(playbookStoreView(erics, false, [], false, TODAY)).get("G1-GOOG"),
    ).not.toHaveProperty("subscribeRefusal");
  });

  it("draws today's hand-off on the run-up when the call spread is subscribed on the same bot", () => {
    const rows = rowsOf(
      playbookStoreView(
        [sub({ playbookId: "S1-NVDA" }), sub({ playbookId: "NVDA-CALL-SPREAD" })],
        false,
        [],
        false,
        TODAY,
      ),
    );
    expect(rows.get("S1-NVDA")?.handOff).toBe(
      "The call spread trades NVDA on this bot; the pre-print run-up yields it.",
    );
    expect(rows.get("NVDA-CALL-SPREAD")?.handOff).toBeUndefined();
  });

  it("gives a viewer who doesn't manage the account the bare rows", () => {
    for (const row of playbookStoreView(undefined, false, [], false, TODAY).strategies.flatMap(
      (card) => card.pairs,
    )) {
      expect(row).not.toHaveProperty("subscription");
      expect(row).not.toHaveProperty("subscribeRefusal");
    }
  });
});
