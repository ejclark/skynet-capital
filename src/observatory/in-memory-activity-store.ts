import type { ActivityStore, TradeActivityRecord } from "./activity-record.js";

/** In-memory store: the reference implementation, used by tests and offline runs. */
export class InMemoryActivityStore implements ActivityStore {
  private readonly entries: TradeActivityRecord[] = [];

  record(entry: TradeActivityRecord): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(participantId?: string): Promise<TradeActivityRecord[]> {
    const all = [...this.entries];
    return Promise.resolve(
      participantId ? all.filter((e) => e.participantId === participantId) : all,
    );
  }
}
