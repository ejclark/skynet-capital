/**
 * Event id → the ledger's DIGEST (#1704): every horizon row its decision header states, its TL;DR
 * as plain text, and the adjacent event ids its probe-ref records. The sibling of
 * research-service.ts's `eventCalls` (Today only, the agenda's contract). Both are read in the
 * shelf's single pass over the ledgers (`ledgerShelf`, #4615) and parsed by research-event-calls.ts
 * (`ledgerDigestOf`) — nothing here summarises, and nothing here reads a file.
 */
import type { LedgerDigest } from "./research-event-calls.js";
import { ledgerShelf, RESEARCH_DIR } from "./research-service.js";

// Re-exported so the shelf view's existing import keeps working (the same import-then-export
// pattern research-service.ts uses: an `export ... from` trips Biome's noBarrelFile).
export type { LedgerDigest };

/** Ledgers with a decision header, keyed by event id. `root` is injectable for specs. */
export function ledgerDigests(root: string = RESEARCH_DIR()): ReadonlyMap<string, LedgerDigest> {
  return ledgerShelf(root).digests;
}
