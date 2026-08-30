/**
 * IN-MEMORY LADDER PROGRESS LOG STORE — the reference `LadderProgressLogStore` implementation,
 * used by tests. Split out of `ladder-progress-log.ts` (Biome `noExcessiveClassesPerFile`) so the
 * file-backed store stays the one class the main module defines.
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { LadderProgressEntry, LadderProgressLogStore } from "./ladder-progress-log.js";

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryLadderProgressLogStore implements LadderProgressLogStore {
  private readonly store = new InMemoryKeyedStore<LadderProgressEntry>((e) => e.participantId);

  record(entry: LadderProgressEntry): Promise<void> {
    return this.store.append(entry);
  }

  list(participantId?: string): Promise<readonly LadderProgressEntry[]> {
    return this.store.list(participantId);
  }
}
