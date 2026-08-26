/**
 * IN-MEMORY FEEDBACK LOG STORE — the reference `FeedbackLogStore` implementation, used by tests.
 * Split out of `feedback-log.ts` (Biome `noExcessiveClassesPerFile`) so the file-backed store
 * stays the one class the main module defines.
 */
import type { FeedbackLogEntry, FeedbackLogStore } from "./feedback-log.js";

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryFeedbackLogStore implements FeedbackLogStore {
  private readonly entries: FeedbackLogEntry[] = [];

  record(entry: FeedbackLogEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(opaqueMemberId?: string): Promise<readonly FeedbackLogEntry[]> {
    const all = [...this.entries];
    return Promise.resolve(
      opaqueMemberId ? all.filter((e) => e.opaqueMemberId === opaqueMemberId) : all,
    );
  }
}
