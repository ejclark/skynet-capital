import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { JsonlAuditStore } from "../../src/autonomous/jsonl-audit-store.js";

const rec = (personaId: string, at: number): DecisionRecord => ({
  at,
  personaId,
  mode: "observe",
  rawIntents: [{ symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "test" }],
  guardedIntents: [{ symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "test" }],
  outcomes: [
    {
      intent: { symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "test" },
      action: "observed",
    },
  ],
});

describe("JsonlAuditStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "audit-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends and reads back decision records per persona", async () => {
    const store = new JsonlAuditStore(dir);
    await store.record(rec("day-trader", 1));
    await store.record(rec("day-trader", 2));
    await store.record(rec("banker", 3));

    const dayTrader = await store.list("day-trader");
    expect(dayTrader.map((r) => r.at)).toEqual([1, 2]);
    expect(dayTrader[0]?.outcomes[0]?.action).toBe("observed");

    const all = await store.list();
    expect(all).toHaveLength(3);
  });

  it("returns empty for an unknown persona and an empty dir", async () => {
    const store = new JsonlAuditStore(dir);
    expect(await store.list("nobody")).toEqual([]);
    expect(await store.list()).toEqual([]);
  });
});
