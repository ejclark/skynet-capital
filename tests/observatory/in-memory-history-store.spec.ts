import type { EquitySample } from "../../src/observatory/history-store.js";
import { InMemoryHistoryStore } from "../../src/observatory/in-memory-history-store.js";

const sample = (participantId: string, equity: number, realizedPl = 0): EquitySample => ({
  at: "2026-07-26T15:00:00.000Z",
  participantId,
  equity,
  cash: 1_000,
  realizedPl,
});

describe("InMemoryHistoryStore", () => {
  it("records samples and filters by participant", async () => {
    const store = new InMemoryHistoryStore();
    await store.save(sample("human-eric", 10_000));
    await store.save(sample("news-fader", 20_000));
    await store.save(sample("human-eric", 10_500, 500));

    expect(await store.list()).toHaveLength(3);
    const eric = await store.list("human-eric");
    expect(eric).toHaveLength(2);
    expect(eric.map((s) => s.equity)).toEqual([10_000, 10_500]);
    expect(eric[1]?.realizedPl).toBe(500);
  });

  it("returns nothing for a participant with no samples", async () => {
    const store = new InMemoryHistoryStore();
    expect(await store.list("nobody")).toEqual([]);
  });
});
