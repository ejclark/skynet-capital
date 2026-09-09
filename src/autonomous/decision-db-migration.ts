import type { DecisionDb } from "./decision-db.js";
import type { AuditStore } from "./decision-record.js";

/**
 * One-time (but idempotent, so "run every boot" is safe) backfill of the pre-existing JSONL audit
 * trail into the new queryable store — the answer to "can we recover history that predates this
 * store" with no `flyctl` tap: `DecisionDb.record()` already no-ops on a `(personaId, at)` it has
 * seen before (`INSERT OR IGNORE` + an intents-already-written guard), so replaying the same file
 * on every boot only ever inserts what is genuinely new since the last run.
 *
 * `audit.list()` (no personaId) reads every persona's file in one call — a real, unbounded read,
 * but a ONE-TIME boot cost bounded by however much history actually exists on the volume, not a
 * per-request cost the way the old `JsonlAuditStore`-backed views paid it.
 */
export async function migrateAuditToDecisionDb(audit: AuditStore, db: DecisionDb): Promise<number> {
  const records = await audit.list();
  for (const record of records) {
    db.record(record);
  }
  return records.length;
}
