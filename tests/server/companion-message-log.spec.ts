import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type CompanionMessageLogEntry,
  JsonlCompanionMessageLogStore,
  recordFirstMessageSafely,
} from "../../src/server/companion-message-log.js";
import { InMemoryCompanionMessageLogStore } from "../../src/server/companion-message-log-memory-store.js";

describe("InMemoryCompanionMessageLogStore", () => {
  it("records entries and filters by member", async () => {
    const store = new InMemoryCompanionMessageLogStore();
    await store.record("member-a", "2026-09-01T00:00:00.000Z");
    await store.record("member-b", "2026-09-01T00:00:01.000Z");

    expect(await store.list()).toHaveLength(2);
    expect(await store.list("member-a")).toEqual([
      { opaqueMemberId: "member-a", at: "2026-09-01T00:00:00.000Z" },
    ]);
  });

  it("stamps its own timestamp when none is given", async () => {
    const store = new InMemoryCompanionMessageLogStore();
    await store.record("member-a");
    const [entry] = await store.list("member-a");
    expect(typeof entry?.at).toBe("string");
  });
});

describe("JsonlCompanionMessageLogStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-companion-message-log-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends per member and reads back", async () => {
    const store = new JsonlCompanionMessageLogStore(dir);
    await store.record("ann", "2026-09-01T00:00:00.000Z");
    await store.record("ann", "2026-09-02T00:00:00.000Z");
    await store.record("someone-else", "2026-09-01T00:00:00.000Z");

    const mine = await store.list("ann");
    expect(mine).toHaveLength(2);
    expect(await store.list()).toHaveLength(3);
  });
});

describe("recordFirstMessageSafely", () => {
  it("records when nothing is on the log yet", async () => {
    const store = new InMemoryCompanionMessageLogStore();
    await recordFirstMessageSafely(
      { readMessages: (id) => store.list(id), recordMessage: (id) => store.record(id) },
      "ann",
    );
    expect(await store.list("ann")).toHaveLength(1);
  });

  it("never appends a second entry once one exists", async () => {
    const store = new InMemoryCompanionMessageLogStore();
    await store.record("ann", "2026-09-01T00:00:00.000Z");
    await recordFirstMessageSafely(
      { readMessages: (id) => store.list(id), recordMessage: (id) => store.record(id) },
      "ann",
    );
    expect(await store.list("ann")).toHaveLength(1);
  });

  it("does nothing when recordMessage isn't wired — offline builds stay untouched", async () => {
    await expect(recordFirstMessageSafely({}, "ann")).resolves.toBeUndefined();
  });

  it("swallows a store failure — a hiccup never fails the member's own turn", async () => {
    const deps = {
      readMessages: (): Promise<readonly CompanionMessageLogEntry[]> => Promise.resolve([]),
      recordMessage: () => Promise.reject(new Error("disk full")),
    };
    await expect(recordFirstMessageSafely(deps, "ann")).resolves.toBeUndefined();
  });
});
