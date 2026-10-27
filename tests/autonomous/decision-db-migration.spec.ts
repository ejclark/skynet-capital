import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import {
  MIGRATION_CHUNK,
  migrateAuditToDecisionDb,
} from "../../src/autonomous/decision-db-migration.js";
import type { AuditStore, DecisionRecord } from "../../src/autonomous/decision-record.js";
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

  it("on a later boot writes only cycles past each persona's newest stored one, and says so", async () => {
    await audit.record(decision({ at: 1 }));
    await audit.record(decision({ at: 2 }));
    await migrateAuditToDecisionDb(audit, db);
    await audit.record(decision({ at: 3 }));
    await audit.record(decision({ at: 1, personaId: "beta-scout" }));

    const count = await migrateAuditToDecisionDb(audit, db); // "the next boot"

    expect(count).toBe(2); // sauron's at:3 and beta-scout's first — not the 4-record file
    expect(db.listByPersona("sauron")).toHaveLength(3);
  });

  it("writes a large backlog in chunks, all of it landing", async () => {
    for (let at = 1; at <= MIGRATION_CHUNK + 7; at += 1) await audit.record(decision({ at }));

    const count = await migrateAuditToDecisionDb(audit, db);

    expect(count).toBe(MIGRATION_CHUNK + 7);
    expect(db.maxAtAll().sauron).toBe(MIGRATION_CHUNK + 7); // the last chunk landed too
  });

  it("streams the trail instead of loading it whole — list() is never called", async () => {
    // By 2026-10-22 list()'s one big array outgrew the bots' 512 MB VM and every boot died of heap
    // exhaustion; the backfill must hold only what is past the watermark.
    await audit.record(decision({ at: 1 }));
    await audit.record(decision({ at: 2 }));
    const streaming: AuditStore = {
      record: (entry) => audit.record(entry),
      list: () => {
        throw new Error("list() loads the whole trail");
      },
      stream: (personaId) => audit.stream(personaId),
    };

    expect(await migrateAuditToDecisionDb(streaming, db)).toBe(2);
    expect(db.listByPersona("sauron")).toHaveLength(2);
  });

  it("reads rotated, gzipped audit files and the active file — a full replay finds every record (#6006)", async () => {
    const rotating = new JsonlAuditStore(dir, { rotateAtBytes: 1 }); // every append rotates the last
    for (let at = 1; at <= 4; at++) await rotating.record(decision({ at }));
    await rotating.record(decision({ at: 1, personaId: "beta-scout" }));

    expect(await migrateAuditToDecisionDb(rotating, db, { watermark: false })).toBe(5);
    expect(db.listByPersona("sauron").map((r) => r.at)).toEqual([4, 3, 2, 1]);

    await rotating.record(decision({ at: 5 }));
    expect(await migrateAuditToDecisionDb(rotating, db)).toBe(1); // only the record past the watermark
  });

  it("loses no archived row when a live cycle rotates a persona's file mid-backfill (#6290)", async () => {
    // The boot backfill runs fire-and-forget while the first cycles record; one record that tips a
    // persona's file past the cap rotates it under the backfill's feet. A row the backfill skips
    // here is buried for good: the live row it raced is newer, and next boot's watermark starts there.
    const rotating = new JsonlAuditStore(dir, { rotateAtBytes: 200 }); // ~97-byte rows
    for (let at = 1; at <= 2; at++)
      await rotating.record(decision({ at, personaId: "beta-scout" }));
    for (let at = 1; at <= 3; at++) await rotating.record(decision({ at })); // sauron, past the cap
    const live = decision({ at: 4 });
    const racing: AuditStore = {
      record: (entry) => rotating.record(entry),
      list: () => rotating.list(),
      async *stream() {
        let first = true;
        for await (const record of rotating.stream()) {
          yield record;
          if (!first) continue;
          first = false;
          db.record(live); // the live sink: the store write, then the JSONL append that rotates
          await rotating.record(live);
        }
      },
    };

    await migrateAuditToDecisionDb(racing, db);
    expect(db.listByPersona("sauron").map((r) => r.at)).toEqual([4, 3, 2, 1]);
    expect(db.listByPersona("beta-scout").map((r) => r.at)).toEqual([2, 1]);
  });

  it("returns 0 on an empty (or never-written) audit trail, writing nothing", async () => {
    const count = await migrateAuditToDecisionDb(audit, db);
    expect(count).toBe(0);
    expect(db.listByPersona("sauron")).toEqual([]);
  });
});
