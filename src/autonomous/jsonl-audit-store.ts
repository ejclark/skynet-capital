import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { AuditStore, DecisionRecord } from "./decision-record.js";

/**
 * File-backed autonomy audit: one append-only JSONL file per persona under `dir`, mirroring
 * `JsonlCycleReportStore`. Append-only keeps writes cheap and the history immutable — every
 * decision cycle is a durable line the readiness review and the observability view can replay.
 */
export class JsonlAuditStore implements AuditStore {
  private readonly store: JsonlKeyedStore<DecisionRecord>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<DecisionRecord>(dir, (personaId) =>
      join(dir, `${personaId}.jsonl`),
    );
  }

  async record(entry: DecisionRecord): Promise<void> {
    await this.store.append(entry.personaId, entry);
  }

  list(personaId?: string): Promise<DecisionRecord[]> {
    return this.store.list(personaId);
  }
}
