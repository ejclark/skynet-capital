import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { migrateAuditToDecisionDb } from "../../src/autonomous/decision-db-migration.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { JsonlAuditStore } from "../../src/autonomous/jsonl-audit-store.js";

const decision = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

describe("migrateAuditToDecisionDb", () => {
  let dir: string;
  let audit: JsonlAuditStore;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "migration-"));
    audit = new JsonlAuditStore(dir);
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("copies every JSONL record into the store, across personas", async () => {
    await audit.record(decision({ at: 1, personaId: "sauron" }));
    await audit.record(decision({ at: 2, personaId: "sauron" }));
    await audit.record(decision({ at: 1, personaId: "beta-scout" }));

    const count = await migrateAuditToDecisionDb(audit, db);

    expect(count).toBe(3);
    expect(db.listByPersona("sauron")).toHaveLength(2);
    expect(db.listByPersona("beta-scout")).toHaveLength(1);
  });

  it("is idempotent — replaying the same file on a second boot inserts nothing new", async () => {
    await audit.record(decision({ at: 1 }));
    await migrateAuditToDecisionDb(audit, db);
    await migrateAuditToDecisionDb(audit, db); // "the next boot"

    expect(db.listByPersona("sauron")).toHaveLength(1);
  });

  it("returns 0 on an empty (or never-written) audit trail, writing nothing", async () => {
    const count = await migrateAuditToDecisionDb(audit, db);
    expect(count).toBe(0);
    expect(db.listByPersona("sauron")).toEqual([]);
  });
});
