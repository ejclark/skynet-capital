import type { DecisionDb } from "./decision-db.js";
import type { AuditStore, DecisionRecord } from "./decision-record.js";

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
 * And it STREAMS the trail rather than `list()`ing it: `list()` parses every line into one array
 * before the watermark filter runs, and by 2026-10-22 that array outgrew the bots' 512 MB VM —
 * every boot died of heap exhaustion seconds after starting, the rollback image too (#5992
 * thread). Only records past the watermark are ever held, at most one chunk at a time.
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
  const newest = opts.watermark === false ? {} : db.maxAtAll();
  const records = audit.stream ? audit.stream() : await audit.list();
  let chunk: DecisionRecord[] = [];
  let written = 0;
  for await (const record of records) {
    if (record.at <= (newest[record.personaId] ?? Number.NEGATIVE_INFINITY)) continue;
    chunk.push(record);
    if (chunk.length < MIGRATION_CHUNK) continue;
    db.recordBatch(chunk);
    written += chunk.length;
    chunk = [];
    await yieldToLoop(); // let socket keepalives and ticks through between transactions
  }
  if (chunk.length > 0) db.recordBatch(chunk);
  return written + chunk.length;
}
