import type { MarketContext } from "../domain/types.js";
import type { MarketDataPort } from "../ports/market-data.js";

/**
 * A `MarketDataPort` that replays a fixed sequence of pre-built snapshots.
 *
 * Purpose-built for deterministic tests and scenario replays: hand it the exact
 * market states you want the engine to see, in order. Once the script is exhausted,
 * the final snapshot sticks (so longer sim loops don't fall off the end).
 */
export class ScriptedMarketData implements MarketDataPort {
  private readonly snapshots: readonly MarketContext[];
  private cursor = 0;

  constructor(snapshots: readonly MarketContext[]) {
    if (snapshots.length === 0) {
      throw new Error("ScriptedMarketData requires at least one snapshot");
    }
    this.snapshots = snapshots;
  }

  snapshot(_symbols: readonly string[]): Promise<MarketContext> {
    const index = Math.min(this.cursor, this.snapshots.length - 1);
    this.cursor += 1;
    // Non-null: index is clamped to a valid position and the array is non-empty.
    const next = this.snapshots[index];
    if (!next) {
      throw new Error("ScriptedMarketData: unreachable empty snapshot");
    }
    return Promise.resolve(next);
  }
}
