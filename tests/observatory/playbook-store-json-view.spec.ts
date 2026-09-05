import type { PlaybookSubscription } from "../../src/domain/types.js";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.js";

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
});
