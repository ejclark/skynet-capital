/**
 * IN-MEMORY FEEDBACK LOG STORE — the reference `FeedbackLogStore` implementation, used by tests.
 * Split out of `feedback-log.ts` (Biome `noExcessiveClassesPerFile`) so the file-backed store
 * stays the one class the main module defines.
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { FeedbackLogEntry, FeedbackLogStore } from "./feedback-log.js";

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryFeedbackLogStore implements FeedbackLogStore {
  private readonly store = new InMemoryKeyedStore<FeedbackLogEntry>((e) => e.opaqueMemberId);

  record(entry: FeedbackLogEntry): Promise<void> {
    return this.store.append(entry);
  }

  list(opaqueMemberId?: string): Promise<readonly FeedbackLogEntry[]> {
    return this.store.list(opaqueMemberId);
  }
}
