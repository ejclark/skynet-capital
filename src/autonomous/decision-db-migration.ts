import type { DecisionDb } from "./decision-db.js";
import type { AuditStore } from "./decision-record.js";

/**
 * Backfill of the JSONL audit trail into the queryable store, run every boot.
 *
 * It used to replay the WHOLE file each boot (~14k cycles, 32 MB by 2026-10-09) through
 * `record()` in one synchronous loop: idempotent, but ~60s of blocked event loop that dropped the
 * bots' market-data socket on every deploy (`closed — code 1006` beside `migrated 14372
 * historical cycle(s)`, #5002). Now it writes only what is past each persona's newest stored `at`
 * (`maxAtAll()`, computed from the data itself), in batched transactions that yield between
 * chunks, and reports what it actually inserted.
 *
 * Trade-off, on purpose: a record OLDER than a persona's newest stored one is not re-tried. The
 * live sink writes JSONL and the store together, so such a gap only follows a failed store write;
 * `record()` stays idempotent if a full replay is ever wanted (`watermark: false`).
 */
export const MIGRATION_CHUNK = 500;

const yieldToLoop = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

export async function migrateAuditToDecisionDb(
  audit: AuditStore,
  db: DecisionDb,
  opts: { watermark?: boolean } = {},
): Promise<number> {
  const records = await audit.list();
  const newest = opts.watermark === false ? {} : db.maxAtAll();
  const fresh = records.filter((record) => record.at > (newest[record.personaId] ?? -Infinity));
  for (let i = 0; i < fresh.length; i += MIGRATION_CHUNK) {
    db.recordBatch(fresh.slice(i, i + MIGRATION_CHUNK));
    await yieldToLoop(); // let socket keepalives and ticks through between transactions
  }
  return fresh.length;
}
