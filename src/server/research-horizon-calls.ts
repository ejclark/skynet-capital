/**
 * Event id → the ledger's DIGEST (#1704): every horizon row its decision header states, its TL;DR
 * as plain text, and the adjacent event ids its probe-ref records. The sibling of
 * research-service.ts's `eventCalls` (Today only, the agenda's contract), kept in its own module so
 * that grandfathered file does not grow. Built the same way: the shelf listing names the ledgers,
 * each is read once, the header is parsed by research-event-calls.ts — nothing here summarises.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  adjacentIdsOf,
  type HorizonCalls,
  horizonCallsOf,
  tldrOf,
} from "./research-event-calls.js";
import { listResearch } from "./research-service.js";

export interface LedgerDigest {
  readonly horizons: HorizonCalls;
  /** The TL;DR paragraph, plain text — the shelf's search index, never a substitute document. */
  readonly tldr?: string;
  /** Event ids the ledger's probe-ref names as adjacent — the corridor graph. */
  readonly adjacent: readonly string[];
}

const researchDir = (): string => join(process.cwd(), "docs", "research");

/** Ledgers with a decision header, keyed by event id. `root` is injectable for specs. */
export function ledgerDigests(root: string = researchDir()): ReadonlyMap<string, LedgerDigest> {
  const out = new Map<string, LedgerDigest>();
  for (const doc of listResearch(root).ledgers) {
    const md = readFileSync(join(root, `${doc.slug}.md`), "utf8");
    const horizons = horizonCallsOf(md);
    if (Object.keys(horizons).length === 0) continue;
    const tldr = tldrOf(md);
    out.set(doc.slug.slice("events/".length), {
      horizons,
      ...(tldr ? { tldr } : {}),
      adjacent: adjacentIdsOf(md),
    });
  }
  return out;
}
