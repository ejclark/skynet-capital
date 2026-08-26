import type { IvHistoryPort, IvSample } from "./iv-record.js";

/** In-memory IV history: the reference implementation, used by specs and in-process runs. */
export class InMemoryIvHistory implements IvHistoryPort {
  private readonly samples: IvSample[] = [];

  save(sample: IvSample): Promise<void> {
    this.samples.push(sample);
    return Promise.resolve();
  }

  list(symbol?: string): Promise<IvSample[]> {
    const all = [...this.samples];
    return Promise.resolve(symbol ? all.filter((s) => s.symbol === symbol) : all);
  }
}
