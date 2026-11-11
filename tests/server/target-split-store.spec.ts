import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TargetSplitStore, targetSplitsFilePath } from "../../src/server/target-split-store.js";

/**
 * The target split's durable home (#4607): one record per member, replaced on save, removed on
 * clear, and never a rewrite of a file it could read only in part.
 */
const AT = new Date("2026-11-10T00:00:00.000Z");
const LATER = new Date("2026-11-10T01:00:00.000Z");
const SPLIT = { sharesPct: 60, optionsPct: 10, cashPct: 30, tolerancePct: 5 };

describe("TargetSplitStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-target-split-"));
    path = join(dir, "target-splits.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("has no target for a member who never set one", () => {
    expect(new TargetSplitStore(path).get("member-a")).toBeUndefined();
  });

  it("saves a target stamped with when it was set, and a fresh store reads it back", () => {
    const saved = new TargetSplitStore(path).set("member-a", SPLIT, AT);
    expect(saved).toEqual({ ...SPLIT, updatedAt: AT.toISOString() });
    expect(new TargetSplitStore(path).get("member-a")).toEqual(saved);
  });

  it("replaces a member's target rather than keeping two", () => {
    const store = new TargetSplitStore(path);
    store.set("member-a", SPLIT, AT);
    store.set("member-a", { ...SPLIT, sharesPct: 50, cashPct: 40 }, LATER);
    expect(store.get("member-a")).toEqual({
      ...SPLIT,
      sharesPct: 50,
      cashPct: 40,
      updatedAt: LATER.toISOString(),
    });
  });

  it("keeps each member's target to themselves", () => {
    const store = new TargetSplitStore(path);
    store.set("member-a", SPLIT, AT);
    store.set("member-b", { ...SPLIT, optionsPct: 0, cashPct: 40 }, AT);
    store.clear("member-a");
    expect(store.get("member-a")).toBeUndefined();
    expect(store.get("member-b")?.optionsPct).toBe(0);
  });

  it("clearing a member with no target succeeds and writes nothing", async () => {
    expect(new TargetSplitStore(path).clear("member-a")).toBe(true);
    await expect(readFile(path, "utf8")).rejects.toThrow();
  });

  it("drops a stored record that breaks the rules, keeping the rest readable", async () => {
    await writeFile(
      path,
      JSON.stringify({
        good: { ...SPLIT, updatedAt: AT.toISOString() },
        bad: { ...SPLIT, cashPct: 99, updatedAt: AT.toISOString() },
      }),
    );
    const store = new TargetSplitStore(path);
    expect(store.get("good")).toBeDefined();
    expect(store.get("bad")).toBeUndefined();
  });

  it("refuses to write over a file it could read only in part", async () => {
    const raw = JSON.stringify({ bad: { ...SPLIT, cashPct: 99, updatedAt: AT.toISOString() } });
    await writeFile(path, raw);
    const store = new TargetSplitStore(path);
    expect(store.set("member-a", SPLIT, AT)).toBeUndefined();
    expect(store.clear("bad")).toBe(false);
    expect(await readFile(path, "utf8")).toBe(raw);
  });
});

describe("targetSplitsFilePath", () => {
  it("sits beside the saved-positions file, so it lands on the same volume", () => {
    expect(
      targetSplitsFilePath({ SKYNET_SAVED_POSITIONS_FILE: "/data/saved-positions.json" }),
    ).toBe("/data/target-splits.json");
    expect(targetSplitsFilePath({})).toBe("data/target-splits.json");
  });
});
