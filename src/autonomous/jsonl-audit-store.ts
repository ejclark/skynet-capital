import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { AuditStore, DecisionRecord } from "./decision-record.js";

/**
 * Size at which a persona's active audit file is closed, gzipped and replaced (#6006). It bounds
 * the trail's growth on the bots' 1 GB `/data` volume (shared with the SQLite stores) to roughly a
 * tenth, and deletes nothing: retention is Eric's call, and the JSONL is the only full-fidelity
 * history (`decisions.db` drops guarded intents and unmatched outcomes). 16 MiB is about half of
 * what one persona had written by 2026-10-09 (~32 MB), so the live file stays small.
 */
export const AUDIT_ROTATE_BYTES = 16 * 1024 * 1024;

/**
 * File-backed autonomy audit: one append-only JSONL file per persona under `dir`, mirroring
 * `JsonlCycleReportStore`. Append-only keeps writes cheap and the history immutable — every
 * decision cycle is a durable line the readiness review and the observability view can replay.
 * Past `rotateAtBytes` a persona's file rotates to `<persona>.<UTC stamp>.jsonl.gz`; `list` and
 * `stream` read those archives oldest-first, then the active file, so the boot backfill and a full
 * replay see every record. Reading by hand: `zcat <persona>.*.jsonl.gz; cat <persona>.jsonl`.
 */
export class JsonlAuditStore implements AuditStore {
  private readonly store: JsonlKeyedStore<DecisionRecord>;

  constructor(dir: string, opts: { rotateAtBytes?: number } = {}) {
    this.store = new JsonlKeyedStore<DecisionRecord>(
      dir,
      (personaId) => join(dir, `${personaId}.jsonl`),
      { rotateAtBytes: opts.rotateAtBytes ?? AUDIT_ROTATE_BYTES },
    );
  }

  async record(entry: DecisionRecord): Promise<void> {
    await this.store.append(entry.personaId, entry);
  }

  list(personaId?: string): Promise<DecisionRecord[]> {
    return this.store.list(personaId);
  }

  stream(personaId?: string): AsyncIterable<DecisionRecord> {
    return this.store.stream(personaId);
  }
}
