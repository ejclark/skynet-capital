import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWatchlist, JsonlWatchlist } from "../../src/adapters/jsonl-watchlist-store.js";

/**
 * The durable watchlist (#4332): a list nothing in this app can re-derive, so the test that
 * matters is the DEPLOY case — a fresh instance over the same directory reads back exactly what
 * the member chose, including what they chose to remove.
 */

describe("JsonlWatchlist", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "watchlist-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("survives a new process: a fresh instance over the same dir reads the list back in order", async () => {
    const first = new JsonlWatchlist(dir, () => new Date("2026-10-04T14:00:00Z"));
    await first.add("human-ann", "NVDA");
    await first.add("human-ann", "AAPL");
    const second = new JsonlWatchlist(dir);
    expect((await second.load("human-ann")).map((row) => row.symbol)).toEqual(["NVDA", "AAPL"]);
    expect(readFileSync(join(dir, "human-ann.jsonl"), "utf8")).toContain(
      '"at":"2026-10-04T14:00:00.000Z"',
    );
  });

  it("records a remove as a line rather than rewriting the file", async () => {
    const store = new JsonlWatchlist(dir);
    await store.add("human-ann", "NVDA");
    await store.add("human-ann", "AAPL");
    await store.remove("human-ann", "NVDA");
    expect((await store.load("human-ann")).map((row) => row.symbol)).toEqual(["AAPL"]);
    // Append-only: the add is still on disk, so a torn write can lose at most the last decision.
    const file = readFileSync(join(dir, "human-ann.jsonl"), "utf8");
    expect(file.trim().split("\n")).toHaveLength(3);
  });

  it("scopes per member and reads empty for a stranger", async () => {
    const store = new JsonlWatchlist(dir);
    await store.add("human-ann", "NVDA");
    await store.add("human-bob", "TSLA");
    expect((await store.load("human-bob")).map((row) => row.symbol)).toEqual(["TSLA"]);
    expect(await store.load("human-nobody")).toEqual([]);
  });

  it("keeps a member id with a path separator inside the directory", async () => {
    const store = new JsonlWatchlist(dir);
    await store.add("../escape", "NVDA");
    expect((await store.load("../escape")).map((row) => row.symbol)).toEqual(["NVDA"]);
    expect(readFileSync(join(dir, "___escape.jsonl"), "utf8")).toContain("NVDA");
  });

  it("builds from the environment with the volume-pinned default", () => {
    expect(createWatchlist({})).toBeInstanceOf(JsonlWatchlist);
    expect(createWatchlist({ SKYNET_WATCHLIST_DIR: dir })).toBeInstanceOf(JsonlWatchlist);
  });
});
