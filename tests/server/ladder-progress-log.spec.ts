import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createLadderProgressLogStore,
  earliestPerMilestone,
  JsonlLadderProgressLogStore,
  type LadderProgressEntry,
  ladderProgressEntry,
} from "../../src/server/ladder-progress-log.js";
import { InMemoryLadderProgressLogStore } from "../../src/server/ladder-progress-log-memory-store.js";

const entry = (overrides: Partial<LadderProgressEntry> = {}): LadderProgressEntry => ({
  uuid: "u-1",
  participantId: "member-a",
  milestoneId: "first-buy",
  evidence: { kind: "fill", orderId: "order-1" },
  at: "2026-08-29T12:00:00.000Z",
  ...overrides,
});

describe("ladderProgressEntry", () => {
  it("builds an entry from a detection, minting its own uuid", () => {
    const result = ladderProgressEntry(
      "member-a",
      "first-buy",
      { kind: "fill", orderId: "order-7" },
      "2026-08-29T12:00:00.000Z",
    );

    expect(result).toMatchObject({
      participantId: "member-a",
      milestoneId: "first-buy",
      evidence: { kind: "fill", orderId: "order-7" },
      at: "2026-08-29T12:00:00.000Z",
    });
    expect(result.uuid).toBeTruthy();
  });
});

describe("earliestPerMilestone", () => {
  it("keeps the earliest logged completion per milestone", () => {
    const byMilestone = earliestPerMilestone([
      entry({ uuid: "u-1", at: "2026-08-29T12:00:00.000Z" }),
      entry({ uuid: "u-2", at: "2026-08-20T09:00:00.000Z" }),
      entry({ uuid: "u-3", milestoneId: "first-sell", at: "2026-08-25T09:00:00.000Z" }),
    ]);

    expect(byMilestone.get("first-buy")?.uuid).toBe("u-2");
    expect(byMilestone.get("first-sell")?.uuid).toBe("u-3");
    expect(byMilestone.size).toBe(2);
  });

  it("returns an empty map for no entries", () => {
    expect(earliestPerMilestone([]).size).toBe(0);
  });
});

describe("InMemoryLadderProgressLogStore", () => {
  it("records entries and filters by participant", async () => {
    const store = new InMemoryLadderProgressLogStore();
    await store.record(entry({ participantId: "member-a" }));
    await store.record(entry({ participantId: "member-b", uuid: "u-2" }));

    expect(await store.list()).toHaveLength(2);
    expect(await store.list("member-a")).toHaveLength(1);
  });
});

describe("JsonlLadderProgressLogStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-ladder-progress-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends per participant and reads back", async () => {
    const store = new JsonlLadderProgressLogStore(dir);
    await store.record(entry());
    await store.record(entry({ uuid: "u-2", milestoneId: "first-sell" }));
    await store.record(entry({ participantId: "someone-else", uuid: "u-3" }));

    const mine = await store.list("member-a");
    expect(mine).toHaveLength(2);
    expect(mine.map((e) => e.milestoneId).sort()).toEqual(["first-buy", "first-sell"]);
    expect(await store.list()).toHaveLength(3);
  });

  it("survives being reconstructed against the same directory (durability across restarts)", async () => {
    const first = new JsonlLadderProgressLogStore(dir);
    await first.record(entry());

    const second = new JsonlLadderProgressLogStore(dir);
    expect(await second.list("member-a")).toHaveLength(1);
  });
});

describe("createLadderProgressLogStore", () => {
  it("defaults to the relative data/ path when SKYNET_LADDER_PROGRESS_DIR is unset", () => {
    const store = createLadderProgressLogStore({});
    expect(store).toBeInstanceOf(JsonlLadderProgressLogStore);
  });
});
