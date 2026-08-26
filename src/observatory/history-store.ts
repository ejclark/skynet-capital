import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { EquitySample, HistoryStore } from "./history-record.js";
import { InMemoryHistoryStore } from "./in-memory-history-store.js";

export type { EquitySample, HistoryStore };

/** In-memory store: the reference implementation, used by tests and in-process runs. */
export { InMemoryHistoryStore };

/**
 * File-backed store: one append-only JSONL file per participant under `dir` (mirrors
 * `JsonlCycleReportStore`). Append-only keeps writes cheap and the history immutable — every sample is
 * a durable line the dashboard can replay. On Fly this `dir` lives on the mounted `/data` volume, so
 * history survives redeploys with **no database and no host change** (set `SKYNET_HISTORY_DIR=/data/history`).
 */
export class JsonlHistoryStore implements HistoryStore {
  private readonly store: JsonlKeyedStore<EquitySample>;

  constructor(dir: string) {
    // A participant id is a slug (`human-<name>` / personaId); safe as a filename. Guard just in case.
    this.store = new JsonlKeyedStore<EquitySample>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async save(sample: EquitySample): Promise<void> {
    await this.store.append(sample.participantId, sample);
  }

  list(participantId?: string): Promise<EquitySample[]> {
    return this.store.list(participantId);
  }
}

/**
 * Build the history store from the environment. `SKYNET_HISTORY_DIR` sets the directory (in production,
 * a path on the mounted volume, e.g. `/data/history`); it defaults to a local `data/history` for dev.
 * Always returns a store — history is additive and safe to record everywhere.
 */
export function createHistoryStore(env: NodeJS.ProcessEnv): HistoryStore {
  return new JsonlHistoryStore(env.SKYNET_HISTORY_DIR ?? "data/history");
}
