import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

describe("InMemoryActivityStore", () => {
  it("records entries and filters by participant", async () => {
    const store = new InMemoryActivityStore();
    await store.record(record({ participantId: "sauron" }));
    await store.record(record({ participantId: "human-eric", orderId: "ord-2" }));

    expect(await store.list()).toHaveLength(2);
    expect(await store.list("sauron")).toHaveLength(1);
  });

  it("returns nothing for a participant with no entries", async () => {
    const store = new InMemoryActivityStore();
    expect(await store.list("nobody")).toEqual([]);
  });
});
