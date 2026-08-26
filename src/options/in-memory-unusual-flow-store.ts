import type { UnusualFlowStore } from "../ports/options-flow.js";
import type { UnusualFlowScan } from "./unusual-flow.js";

/**
 * In-memory flow ledger: the reference implementation of `UnusualFlowStore`, used by specs and
 * in-process runs. Append-only like the file-backed one — `save` never rewrites an earlier scan,
 * because "the same strike flagged again today" is only readable against what was already there.
 */
export class InMemoryUnusualFlowStore implements UnusualFlowStore {
  private readonly scans: UnusualFlowScan[] = [];

  save(scan: UnusualFlowScan): Promise<void> {
    this.scans.push(scan);
    return Promise.resolve();
  }

  list(underlying?: string): Promise<UnusualFlowScan[]> {
    return Promise.resolve(
      underlying === undefined
        ? [...this.scans]
        : this.scans.filter((s) => s.underlying === underlying),
    );
  }
}
