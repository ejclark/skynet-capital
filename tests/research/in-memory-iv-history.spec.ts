import { InMemoryIvHistory } from "../../src/research/in-memory-iv-history.js";
import type { IvSample } from "../../src/research/iv-record.js";

const sample = (symbol: string, atmIv: number): IvSample => ({
  at: "2026-08-26T15:00:00.000Z",
  symbol,
  atmIv,
  spot: 180,
  daysToExpiry: 30,
});

describe("InMemoryIvHistory (the reference adapter)", () => {
  it("hands back a copy, so a caller cannot mutate the store's own series", async () => {
    const store = new InMemoryIvHistory();
    await store.save(sample("NVDA", 0.5));
    const first = await store.list();
    first.push(sample("FAKE", 9));
    expect(await store.list()).toHaveLength(1);
  });

  it("preserves append order per underlying", async () => {
    const store = new InMemoryIvHistory();
    await store.save(sample("NVDA", 0.5));
    await store.save(sample("GOOG", 0.2));
    await store.save(sample("NVDA", 0.6));
    expect((await store.list("NVDA")).map((s) => s.atmIv)).toEqual([0.5, 0.6]);
  });
});
