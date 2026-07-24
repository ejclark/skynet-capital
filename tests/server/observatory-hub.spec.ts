import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

const state = (): DashboardData => ({
  generatedAt: "2026-07-24T15:00:00.000Z",
  participants: [
    {
      id: "day-trader",
      displayName: "The Day Trader",
      kind: "bot",
      personaId: "day-trader",
      cash: 900_000,
      equity: 1_000_000,
      positions: [{ symbol: "NVDA", quantity: 1_000, avgPrice: 100, marketValue: 100_000 }],
    },
  ],
});

describe("ObservatoryHub", () => {
  it("applies an event and notifies subscribers with the new state", () => {
    const hub = new ObservatoryHub(state());
    const seen: DashboardData[] = [];
    hub.subscribe((s) => seen.push(s));

    hub.apply({ type: "price", symbol: "NVDA", price: 110, at: "2026-07-24T15:01:00.000Z" });

    expect(seen).toHaveLength(1);
    expect(seen[0]?.participants[0]?.equity).toBe(1_010_000);
    expect(hub.getState().participants[0]?.positions[0]?.marketValue).toBe(110_000);
  });

  it("does not notify when an event changes nothing", () => {
    const hub = new ObservatoryHub(state());
    let calls = 0;
    hub.subscribe(() => {
      calls += 1;
    });

    hub.apply({ type: "price", symbol: "TSLA", price: 400, at: "later" }); // not held

    expect(calls).toBe(0);
  });

  it("stops notifying after unsubscribe", () => {
    const hub = new ObservatoryHub(state());
    let calls = 0;
    const unsub = hub.subscribe(() => {
      calls += 1;
    });
    unsub();

    hub.apply({ type: "price", symbol: "NVDA", price: 120, at: "later" });

    expect(calls).toBe(0);
    expect(hub.subscriberCount).toBe(0);
  });
});
