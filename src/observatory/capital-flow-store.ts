import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { CapitalFlow, CapitalFlowStore } from "./capital-flow.js";
import { InMemoryCapitalFlowStore } from "./in-memory-capital-flow-store.js";

/**
 * The capital-flow ledger (#4563): every inferred top-up or reset-down, appended for good. The
 * deduction itself is `capital-flow.ts`; the watch that feeds this is `capital-flow-watch.ts`.
 */

/** File-backed store: one append-only JSONL file per participant under `dir`, the same shape as
 *  the equity samples it is deduced from. */
export class JsonlCapitalFlowStore implements CapitalFlowStore {
  private readonly store: JsonlKeyedStore<CapitalFlow>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<CapitalFlow>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async record(flow: CapitalFlow): Promise<void> {
    await this.store.append(flow.participantId, flow);
  }

  list(participantId?: string): Promise<CapitalFlow[]> {
    return this.store.list(participantId);
  }
}

/**
 * Flows nest under the history store's own directory (`flows/`, beside the per-participant sample
 * files) rather than taking a volume path of their own, so no new `fly.toml` pin is needed. The
 * history store lists only `.jsonl` files directly under its dir, so the subdirectory never leaks
 * into the samples. Offline runs stay in memory: the fixture replay loops, and persisting its
 * repeated jumps would bank a fabricated flow ledger across restarts.
 */
export function createBootCapitalFlowStore(env: NodeJS.ProcessEnv, mode: string): CapitalFlowStore {
  if (mode === "offline") return new InMemoryCapitalFlowStore();
  return new JsonlCapitalFlowStore(join(env.SKYNET_HISTORY_DIR ?? "data/history", "flows"));
}
