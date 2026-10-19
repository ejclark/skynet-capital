import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { CapitalFlow, CapitalFlowStore } from "./capital-flow.js";

/** In-memory store: the reference implementation, used by tests and offline runs. */
export class InMemoryCapitalFlowStore implements CapitalFlowStore {
  private readonly store = new InMemoryKeyedStore<CapitalFlow>((f) => f.participantId);

  record(flow: CapitalFlow): Promise<void> {
    return this.store.append(flow);
  }

  list(participantId?: string): Promise<CapitalFlow[]> {
    return this.store.list(participantId);
  }
}
