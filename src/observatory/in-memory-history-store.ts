import type { EquitySample, HistoryStore } from "./history-record.js";

/** In-memory store: the reference implementation, used by tests and in-process runs. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly samples: EquitySample[] = [];

  save(sample: EquitySample): Promise<void> {
    this.samples.push(sample);
    return Promise.resolve();
  }

  list(participantId?: string): Promise<EquitySample[]> {
    const all = [...this.samples];
    return Promise.resolve(
      participantId ? all.filter((s) => s.participantId === participantId) : all,
    );
  }
}
