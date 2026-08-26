import { InMemoryUnusualFlowStore } from "../../src/options/in-memory-unusual-flow-store.js";
import type { UnusualFlowScan } from "../../src/options/unusual-flow.js";

const scan = (
  underlying: string,
  at: string,
  flags: UnusualFlowScan["flags"] = [],
): UnusualFlowScan => ({
  at,
  underlying,
  thresholds: { minRatio: 2, minVolume: 250 },
  contractsScanned: 10,
  contractsJudged: 9,
  indeterminate: 1,
  flags,
});

const FLAG = {
  occSymbol: "NVDA260918C00200000",
  expiration: "2026-09-18",
  strike: 200,
  type: "call" as const,
  volume: 1_200,
  openInterest: 300,
  reason: "volume-over-open-interest" as const,
  ratio: 4,
};

describe("InMemoryUnusualFlowStore", () => {
  it("records scans and filters by underlying", async () => {
    const store = new InMemoryUnusualFlowStore();
    await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z"));
    await store.save(scan("AMD", "2026-08-24T18:00:00.000Z"));
    await store.save(scan("NVDA", "2026-08-25T18:00:00.000Z", [FLAG]));

    expect(await store.list()).toHaveLength(3);
    const nvda = await store.list("NVDA");
    expect(nvda).toHaveLength(2);
    expect(nvda[1]?.flags).toHaveLength(1);
  });

  it("keeps an empty scan — a quiet tape is a recorded fact, not an absent one", async () => {
    const store = new InMemoryUnusualFlowStore();
    await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z"));
    const [only] = await store.list("NVDA");
    expect(only?.flags).toEqual([]);
    expect(only?.contractsScanned).toBe(10);
  });

  it("appends rather than replacing — the series is the whole point", async () => {
    const store = new InMemoryUnusualFlowStore();
    await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z", [FLAG]));
    await store.save(scan("NVDA", "2026-08-25T18:00:00.000Z", [FLAG]));
    expect((await store.list("NVDA")).map((s) => s.at)).toEqual([
      "2026-08-24T18:00:00.000Z",
      "2026-08-25T18:00:00.000Z",
    ]);
  });

  it("reads an unscanned underlying as empty, never as an error", async () => {
    expect(await new InMemoryUnusualFlowStore().list("TSLA")).toEqual([]);
  });
});
