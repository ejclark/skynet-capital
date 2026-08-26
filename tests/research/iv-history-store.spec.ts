import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  InMemoryIvHistory,
  type IvSample,
  JsonlIvHistoryStore,
} from "../../src/research/iv-history-store.js";

const sample = (symbol: string, atmIv: number, at = "2026-07-26T15:00:00.000Z"): IvSample => ({
  at,
  symbol,
  atmIv,
  spot: 100,
  daysToExpiry: 30,
});

describe("InMemoryIvHistory", () => {
  it("records samples and filters by underlying", async () => {
    const store = new InMemoryIvHistory();
    await store.save(sample("NVDA", 0.42));
    await store.save(sample("GOOG", 0.28));
    await store.save(sample("NVDA", 0.45, "2026-07-27T15:00:00.000Z"));

    expect(await store.list()).toHaveLength(3);
    const nvda = await store.list("NVDA");
    expect(nvda.map((s) => s.atmIv)).toEqual([0.42, 0.45]);
  });

  it("returns nothing for an underlying it has never seen", async () => {
    const store = new InMemoryIvHistory();
    expect(await store.list("AAPL")).toEqual([]);
  });
});

describe("JsonlIvHistoryStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-iv-history-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends samples per underlying and reads them back in order", async () => {
    const store = new JsonlIvHistoryStore(dir);
    await store.save(sample("NVDA", 0.42));
    await store.save(sample("NVDA", 0.45, "2026-07-27T15:00:00.000Z"));

    const nvda = await store.list("NVDA");
    expect(nvda).toHaveLength(2);
    expect(nvda[1]).toMatchObject({ atmIv: 0.45, spot: 100, daysToExpiry: 30 });
  });

  it("keeps each underlying's series isolated and reads all when unfiltered", async () => {
    const store = new JsonlIvHistoryStore(dir);
    await store.save(sample("NVDA", 0.42));
    await store.save(sample("GOOG", 0.28));

    expect(await store.list("GOOG")).toHaveLength(1);
    expect(await store.list()).toHaveLength(2);
  });

  it("returns nothing for an untracked underlying (missing file, not an error)", async () => {
    const store = new JsonlIvHistoryStore(dir);
    expect(await store.list("NOBODY")).toEqual([]);
  });

  it("cannot be walked out of its directory by a malformed symbol", async () => {
    const store = new JsonlIvHistoryStore(dir);
    await store.save(sample("../escape", 0.5));
    // The whole store still reads back exactly one file's worth — the write landed inside `dir`.
    expect(await store.list()).toHaveLength(1);
  });

  it("takes its directory explicitly, so no relative default can be erased by a deploy", async () => {
    const pinned = await mkdtemp(join(tmpdir(), "skynet-iv-history-pinned-"));
    try {
      const store = new JsonlIvHistoryStore(pinned);
      await store.save(sample("NVDA", 0.42));
      expect(await store.list("NVDA")).toHaveLength(1);
    } finally {
      await rm(pinned, { recursive: true, force: true });
    }
  });
});
