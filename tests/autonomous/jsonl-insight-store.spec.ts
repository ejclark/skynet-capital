import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { InsightRecord } from "../../src/autonomous/insight-record.js";
import { createInsightStore, JsonlInsightStore } from "../../src/autonomous/jsonl-insight-store.js";

const rec = (personaId: string, at: number): InsightRecord => ({
  at,
  personaId,
  kind: "observation",
  data: { symbol: "NVDA" },
});

describe("JsonlInsightStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "insights-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends and reads back insight records from every persona in one log", async () => {
    const store = new JsonlInsightStore(dir);
    await store.record(rec("day-trader", 1));
    await store.record(rec("banker", 2));

    const all = await store.list();
    expect(all.map((r) => r.at)).toEqual([1, 2]);
    expect(all.map((r) => r.personaId)).toEqual(["day-trader", "banker"]);
  });

  it("returns empty for an empty/nonexistent dir", async () => {
    const store = new JsonlInsightStore(join(dir, "nested", "deeper"));
    expect(await store.list()).toEqual([]);
  });
});

describe("createInsightStore", () => {
  it("uses SKYNET_INSIGHTS_DIR when set", async () => {
    const store = createInsightStore({ SKYNET_INSIGHTS_DIR: mkdtempSync(join(tmpdir(), "ins2-")) });
    expect(store).toBeInstanceOf(JsonlInsightStore);
    await store.record(rec("day-trader", 1));
    expect(await store.list()).toHaveLength(1);
  });
});
