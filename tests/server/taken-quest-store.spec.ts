import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TakenQuest } from "../../src/domain/quest-score.js";
import { conditionsBaseRate } from "../../src/options/conditions-quests.js";
import { POSITION_UNTESTED } from "../../src/options/position-quests.js";
import { MAX_PER_DESK, TakenQuestStore } from "../../src/server/taken-quest-store.js";

/**
 * #7028 slice 6: the quests members took, one JSON file beside the subscriptions file. Reads are
 * total; a write refuses rather than rewrite a file it could only read in part.
 */

let dir: string;
let path: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "taken-quests-"));
  path = join(dir, "taken-quests.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const shares = (orderId: string): TakenQuest => ({
  questId: "conditions:QQQ:buy-shares",
  source: "conditions",
  moveKind: "buy-shares",
  symbol: "QQQ",
  orderId,
  takenAt: "2026-11-10T15:00:00.000Z",
  baseRate: conditionsBaseRate("QQQ", "shares"),
});

const takeProfit: TakenQuest = {
  questId: "position:CRWV261120C00090000:take-profit",
  source: "position",
  moveKind: "sell-to-close",
  symbol: "CRWV",
  occ: "CRWV261120C00090000",
  orderId: "o-tp",
  takenAt: "2026-11-10T16:00:00.000Z",
  baseRate: POSITION_UNTESTED,
};

describe("TakenQuestStore", () => {
  it("reads back what it recorded, per desk, oldest first", () => {
    const store = new TakenQuestStore(path);
    expect(store.record("ann-1", shares("o-1"))).toBe(true);
    expect(store.record("ann-1", takeProfit)).toBe(true);
    expect(store.record("bob-1", shares("o-2"))).toBe(true);
    const again = new TakenQuestStore(path);
    expect(again.taken("ann-1")).toEqual([shares("o-1"), takeProfit]);
    expect(again.taken("bob-1")).toEqual([shares("o-2")]);
    expect(again.taken("nobody")).toEqual([]);
  });

  it("records an order once", () => {
    const store = new TakenQuestStore(path);
    store.record("ann-1", shares("o-1"));
    store.record("ann-1", shares("o-1"));
    expect(store.taken("ann-1")).toHaveLength(1);
  });

  it(`keeps the newest ${MAX_PER_DESK} per desk`, () => {
    const rows = Array.from({ length: MAX_PER_DESK }, (_, i) => shares(`o-${i}`));
    writeFileSync(path, JSON.stringify({ "ann-1": rows }));
    const store = new TakenQuestStore(path);
    store.record("ann-1", shares("newest"));
    const kept = store.taken("ann-1");
    expect(kept).toHaveLength(MAX_PER_DESK);
    expect(kept[0]?.orderId).toBe("o-1");
    expect(kept.at(-1)?.orderId).toBe("newest");
  });

  it("drops a malformed row on read, and refuses to rewrite a file it could not read whole", () => {
    const bad = { ...shares("o-bad"), baseRate: { kind: "looks-good" } };
    writeFileSync(path, JSON.stringify({ "ann-1": [shares("o-1"), bad] }));
    const errors: string[] = [];
    const store = new TakenQuestStore(path, (m) => errors.push(m));
    expect(store.taken("ann-1")).toEqual([shares("o-1")]);
    expect(store.record("ann-1", shares("o-2"))).toBe(false);
    expect(JSON.parse(readFileSync(path, "utf8"))["ann-1"]).toHaveLength(2);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("moves a quest onto the order that replaced its own, and nothing else (#7309)", () => {
    const store = new TakenQuestStore(path);
    store.record("ann-1", shares("o-A"));
    store.record("ann-1", takeProfit);
    store.record("bob-1", shares("o-A"));
    expect(store.replace("ann-1", "o-A", "o-B")).toBe(true);
    expect(store.replace("ann-1", "o-B", "o-C")).toBe(true);
    expect(store.replace("ann-1", "o-unknown", "o-D")).toBe(true);
    const again = new TakenQuestStore(path);
    expect(again.taken("ann-1")).toEqual([{ ...shares("o-A"), orderId: "o-C" }, takeProfit]);
    expect(again.taken("bob-1")).toEqual([shares("o-A")]);
  });

  it("refuses to move a quest in a file it could not read whole", () => {
    const bad = { ...shares("o-bad"), baseRate: { kind: "looks-good" } };
    writeFileSync(path, JSON.stringify({ "ann-1": [shares("o-A"), bad] }));
    const store = new TakenQuestStore(path, () => undefined);
    expect(store.replace("ann-1", "o-A", "o-B")).toBe(false);
    expect(JSON.parse(readFileSync(path, "utf8"))["ann-1"][0].orderId).toBe("o-A");
  });

  it("answers empty for a missing file", () => {
    expect(new TakenQuestStore(join(dir, "none.json")).taken("ann-1")).toEqual([]);
  });
});
