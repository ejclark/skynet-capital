/**
 * IN-MEMORY COMPANION MESSAGE LOG STORE — the reference `CompanionMessageLogStore` implementation,
 * used by tests. Split out of `companion-message-log.ts` (Biome `noExcessiveClassesPerFile`) so
 * the file-backed store stays the one class the main module defines.
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type {
  CompanionMessageLogEntry,
  CompanionMessageLogStore,
} from "./companion-message-log.js";

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryCompanionMessageLogStore implements CompanionMessageLogStore {
  private readonly store = new InMemoryKeyedStore<CompanionMessageLogEntry>(
    (e) => e.opaqueMemberId,
  );

  record(opaqueMemberId: string, at = new Date().toISOString()): Promise<void> {
    return this.store.append({ opaqueMemberId, at });
  }

  list(opaqueMemberId?: string): Promise<readonly CompanionMessageLogEntry[]> {
    return this.store.list(opaqueMemberId);
  }
}
