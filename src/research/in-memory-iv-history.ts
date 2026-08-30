import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { IvHistoryPort, IvSample } from "./iv-record.js";

/** In-memory IV history: the reference implementation, used by specs and in-process runs. */
export class InMemoryIvHistory implements IvHistoryPort {
  private readonly store = new InMemoryKeyedStore<IvSample>((s) => s.symbol);

  save(sample: IvSample): Promise<void> {
    return this.store.append(sample);
  }

  list(symbol?: string): Promise<IvSample[]> {
    return this.store.list(symbol);
  }
}
