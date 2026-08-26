import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import { InMemoryIvHistory } from "./in-memory-iv-history.js";
import type { IvHistoryPort, IvSample } from "./iv-record.js";

export type { IvSample };
export { InMemoryIvHistory };

/**
 * File-backed IV history: one append-only JSONL file per UNDERLYING under `dir` (the same
 * `JsonlKeyedStore` primitive `JsonlHistoryStore` and `JsonlAuditStore` compose). Append-only keeps
 * writes cheap and the series immutable — an IV rank is only as trustworthy as the history behind
 * it, so nothing here ever rewrites a past sample.
 *
 * One file per underlying is what makes the common read cheap: computing NVDA's rank reads NVDA's
 * file and nothing else, even once the board tracks dozens of names for years.
 *
 * NO ENV-DEFAULTING FACTORY HERE, DELIBERATELY. Its siblings expose a `createXStore(env)` that
 * falls back to a relative `data/…` path — and `tests/arch/volume-persistence.spec.ts` then
 * (correctly) demands the matching var be pinned under the `/data` mount in `fly.toml`, because a
 * relative default writes inside the container image and is erased on every deploy. `fly.toml` is
 * envelope-protected (deploy topology is Eric's), so this store takes its directory EXPLICITLY and
 * the wiring PR that first schedules a tick adds the pin. Shipping the factory without the pin
 * would have quietly built a series that resets every merge — the one failure mode a year-long
 * history cannot survive.
 */
export class JsonlIvHistoryStore implements IvHistoryPort {
  private readonly store: JsonlKeyedStore<IvSample>;

  constructor(dir: string) {
    // A ticker is already filesystem-safe; sanitize anyway so a malformed symbol can never escape
    // `dir` (the same guard JsonlHistoryStore applies to a participant id).
    this.store = new JsonlKeyedStore<IvSample>(dir, (symbol) =>
      join(dir, `${symbol.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async save(sample: IvSample): Promise<void> {
    await this.store.append(sample.symbol, sample);
  }

  list(symbol?: string): Promise<IvSample[]> {
    return this.store.list(symbol);
  }
}
