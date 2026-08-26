import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { UnusualFlowScan } from "../../src/options/unusual-flow.js";
import {
  InMemoryUnusualFlowStore,
  JsonlUnusualFlowStore,
} from "../../src/options/unusual-flow-store.js";

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

describe("JsonlUnusualFlowStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-flow-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends scans per underlying and reads them back in order", async () => {
    const store = new JsonlUnusualFlowStore(dir);
    await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z"));
    await store.save(scan("NVDA", "2026-08-25T18:00:00.000Z", [FLAG]));

    const nvda = await store.list("NVDA");
    expect(nvda).toHaveLength(2);
    expect(nvda[1]?.flags[0]).toMatchObject({ occSymbol: FLAG.occSymbol, ratio: 4 });
  });

  it("keeps each underlying's ledger isolated and reads all when unfiltered", async () => {
    const store = new JsonlUnusualFlowStore(dir);
    await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z"));
    await store.save(scan("AMD", "2026-08-24T18:00:00.000Z"));

    expect(await store.list("AMD")).toHaveLength(1);
    expect(await store.list()).toHaveLength(2);
  });

  it("reads an unwritten underlying as empty, never as an error", async () => {
    expect(await new JsonlUnusualFlowStore(dir).list("TSLA")).toEqual([]);
  });
});

describe("the flow-store module", () => {
  it("re-exports the in-memory ledger, so a caller picks one without knowing two paths", async () => {
    expect(await new InMemoryUnusualFlowStore().list()).toEqual([]);
  });

  it("takes the ledger directory as a required argument — no relative default to lose on deploy", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-flow-required-"));
    try {
      const store = new JsonlUnusualFlowStore(dir);
      await store.save(scan("NVDA", "2026-08-24T18:00:00.000Z"));
      expect(await store.list("NVDA")).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
