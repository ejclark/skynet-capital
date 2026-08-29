/**
 * IN-MEMORY LADDER PROGRESS LOG STORE — the reference `LadderProgressLogStore` implementation,
 * used by tests. Split out of `ladder-progress-log.ts` (Biome `noExcessiveClassesPerFile`) so the
 * file-backed store stays the one class the main module defines.
 */
import type { LadderProgressEntry, LadderProgressLogStore } from "./ladder-progress-log.js";

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryLadderProgressLogStore implements LadderProgressLogStore {
  private readonly entries: LadderProgressEntry[] = [];

  record(entry: LadderProgressEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(participantId?: string): Promise<readonly LadderProgressEntry[]> {
    const all = [...this.entries];
    return Promise.resolve(
      participantId ? all.filter((e) => e.participantId === participantId) : all,
    );
  }
}
