import type { UnusualFlowStore } from "../ports/options-flow.js";
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { UnusualFlowScan } from "./unusual-flow.js";

/**
 * In-memory flow ledger: the reference implementation of `UnusualFlowStore`, used by specs and
 * in-process runs. Append-only like the file-backed one — `save` never rewrites an earlier scan,
 * because "the same strike flagged again today" is only readable against what was already there.
 */
export class InMemoryUnusualFlowStore implements UnusualFlowStore {
  private readonly store = new InMemoryKeyedStore<UnusualFlowScan>((s) => s.underlying);

  save(scan: UnusualFlowScan): Promise<void> {
    return this.store.append(scan);
  }

  list(underlying?: string): Promise<UnusualFlowScan[]> {
    return this.store.list(underlying);
  }
}
