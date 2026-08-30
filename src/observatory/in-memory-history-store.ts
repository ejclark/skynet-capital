import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { EquitySample, HistoryStore } from "./history-record.js";

/** In-memory store: the reference implementation, used by tests and in-process runs. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly store = new InMemoryKeyedStore<EquitySample>((s) => s.participantId);

  save(sample: EquitySample): Promise<void> {
    return this.store.append(sample);
  }

  list(participantId?: string): Promise<EquitySample[]> {
    return this.store.list(participantId);
  }
}
