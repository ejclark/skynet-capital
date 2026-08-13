import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { InsightRecord } from "./insight-record.js";

const FILE_KEY = "insights";

/**
 * File-backed insight store: every record lands in a single append-only JSONL file under `dir`
 * (e.g. `/data/insights/insights.jsonl` in prod), mirroring `JsonlAuditStore`'s composition of
 * `JsonlKeyedStore` — a single, always-the-same key stands in for "one shared log" rather than
 * per-persona files, since insights aren't queried per-persona (yet) the way decisions are.
 *
 * Explicitly the interim/throwaway backing store named in `docs/plans/trade-insights-loop.md`
 * (slice 2) — kept to this one narrow `record`/`list` interface so slice 4's SQLite swap is a
 * one-file change, not a rewrite.
 */
export class JsonlInsightStore {
  private readonly store: JsonlKeyedStore<InsightRecord>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<InsightRecord>(dir, () => join(dir, `${FILE_KEY}.jsonl`));
  }

  async record(entry: InsightRecord): Promise<void> {
    await this.store.append(FILE_KEY, entry);
  }

  list(): Promise<InsightRecord[]> {
    return this.store.list();
  }
}

/**
 * Build the insight store from the environment. `SKYNET_INSIGHTS_DIR` sets the directory (in
 * production, a path on the mounted volume, e.g. `/data/insights`); it defaults to a local
 * `data/insights` for dev — the same `env.SKYNET_HISTORY_DIR ?? "data/history"` pattern
 * `createHistoryStore` uses. Always returns a store: recording is additive and safe everywhere.
 */
export function createInsightStore(env: NodeJS.ProcessEnv): JsonlInsightStore {
  return new JsonlInsightStore(env.SKYNET_INSIGHTS_DIR ?? "data/insights");
}
