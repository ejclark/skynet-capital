import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { CycleReportStore, PersistedCycleReport } from "./cycle-report-store.js";

/**
 * File-backed store: one append-only JSONL file per persona under `dir`. Append-only keeps
 * writes cheap and the history immutable — every cycle is a durable line the dashboard and
 * the future learning loop can replay. One file per persona keeps each bot's stream isolated.
 */
export class JsonlCycleReportStore implements CycleReportStore {
  private readonly store: JsonlKeyedStore<PersistedCycleReport>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<PersistedCycleReport>(dir, (personaId) =>
      join(dir, `${personaId}.jsonl`),
    );
  }

  async save(entry: PersistedCycleReport): Promise<void> {
    await this.store.append(entry.report.personaId, entry);
  }

  list(personaId?: string): Promise<PersistedCycleReport[]> {
    return this.store.list(personaId);
  }
}
