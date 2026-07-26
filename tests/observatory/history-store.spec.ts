import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type EquitySample,
  InMemoryHistoryStore,
  JsonlHistoryStore,
  createHistoryStore,
} from "../../src/observatory/history-store.js";

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
});

describe("JsonlHistoryStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-history-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends samples per participant and reads them back", async () => {
    const store = new JsonlHistoryStore(dir);
    await store.save(sample("human-eric", 10_000));
    await store.save(sample("human-eric", 10_500, 500));

    const eric = await store.list("human-eric");
    expect(eric).toHaveLength(2);
    expect(eric[1]).toMatchObject({ equity: 10_500, realizedPl: 500 });
  });

  it("keeps each participant's stream isolated and reads all when unfiltered", async () => {
    const store = new JsonlHistoryStore(dir);
    await store.save(sample("human-eric", 10_000));
    await store.save(sample("news-fader", 20_000));

    expect(await store.list("news-fader")).toHaveLength(1);
    expect(await store.list()).toHaveLength(2);
  });

  it("returns nothing for an unknown participant (missing file, not an error)", async () => {
    const store = new JsonlHistoryStore(dir);
    expect(await store.list("nobody")).toEqual([]);
  });
});

describe("createHistoryStore", () => {
  it("uses SKYNET_HISTORY_DIR when set", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-history-env-"));
    try {
      const store = createHistoryStore({ SKYNET_HISTORY_DIR: dir } as NodeJS.ProcessEnv);
      await store.save(sample("human-eric", 10_000));
      expect(await store.list("human-eric")).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
