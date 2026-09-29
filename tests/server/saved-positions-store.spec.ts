import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SavedPositionsStore } from "../../src/server/saved-positions-store.js";

const AT = new Date("2026-09-29T00:00:00.000Z");
const LATER = new Date("2026-09-29T01:00:00.000Z");

describe("SavedPositionsStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-saved-positions-"));
    path = join(dir, "saved-positions.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads the empty state when no file exists", () => {
    expect(new SavedPositionsStore(path).load()).toEqual({});
    expect(new SavedPositionsStore(path).list("member-abc")).toEqual([]);
  });

  it("saves a position, stamping id/created/updated", () => {
    const store = new SavedPositionsStore(path);
    const saved = store.save(
      "member-abc",
      { symbol: "CRWV", name: "My Fidelity calls", stake: { shares: 400, costBasis: 70 } },
      AT,
    );
    expect(saved).toMatchObject({
      symbol: "CRWV",
      name: "My Fidelity calls",
      stake: { shares: 400, costBasis: 70 },
      createdAt: AT.toISOString(),
      updatedAt: AT.toISOString(),
    });
    expect(saved.id).toBeTruthy();
    expect(store.list("member-abc")).toEqual([saved]);
  });

  it("appends rather than replaces — two positions in the same symbol both survive", () => {
    const store = new SavedPositionsStore(path);
    store.save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    store.save("member-abc", { symbol: "CRWV", name: "B", stake: {} }, AT);
    expect(store.list("member-abc").map((p) => p.name)).toEqual(["A", "B"]);
  });

  it("update replaces name/stake in place, bumping only updatedAt", () => {
    const store = new SavedPositionsStore(path);
    const saved = store.save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    store.update("member-abc", saved.id, { name: "B", stake: { shares: 100 } }, LATER);
    expect(store.list("member-abc")).toEqual([
      { ...saved, name: "B", stake: { shares: 100 }, updatedAt: LATER.toISOString() },
    ]);
  });

  it("update is a no-op for an id that doesn't exist under that account", () => {
    const store = new SavedPositionsStore(path);
    store.save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    const before = store.load();
    store.update("member-abc", "not-a-real-id", { name: "X" }, LATER);
    expect(store.load()).toEqual(before);
  });

  it("update never reaches into another member's positions", () => {
    const store = new SavedPositionsStore(path);
    const saved = store.save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    store.update("member-xyz", saved.id, { name: "hijacked" }, LATER);
    expect(store.list("member-abc")[0]?.name).toBe("A");
  });

  it("delete removes one position, dropping the account entirely once it's empty", () => {
    const store = new SavedPositionsStore(path);
    const saved = store.save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    store.delete("member-abc", saved.id);
    expect(store.list("member-abc")).toEqual([]);
    expect(store.load()).toEqual({});
  });

  it("persists across a fresh store instance reading the same file", () => {
    new SavedPositionsStore(path).save("member-abc", { symbol: "CRWV", name: "A", stake: {} }, AT);
    expect(new SavedPositionsStore(path).list("member-abc")).toHaveLength(1);
  });
});
