/**
 * IN-MEMORY JOURNAL STORE — the reference `JournalStore`, used by specs. Split out of
 * `journal-store.ts` (Biome `noExcessiveClassesPerFile` — one class per module).
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { JournalNote, JournalStore } from "./journal-store.js";

export class InMemoryJournalStore implements JournalStore {
  private readonly store = new InMemoryKeyedStore<JournalNote>((n) => n.opaqueMemberId);

  append(note: JournalNote): Promise<void> {
    return this.store.append(note);
  }

  list(opaqueMemberId: string): Promise<readonly JournalNote[]> {
    return this.store.list(opaqueMemberId);
  }
}
