import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { ActivityStore, TradeActivityRecord } from "./activity-record.js";

/** In-memory store: the reference implementation, used by tests and offline runs. */
export class InMemoryActivityStore implements ActivityStore {
  private readonly store = new InMemoryKeyedStore<TradeActivityRecord>((e) => e.participantId);

  record(entry: TradeActivityRecord): Promise<void> {
    return this.store.append(entry);
  }

  list(participantId?: string): Promise<TradeActivityRecord[]> {
    return this.store.list(participantId);
  }
}
