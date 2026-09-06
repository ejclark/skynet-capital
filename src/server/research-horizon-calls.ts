/**
 * Event id → every horizon row its ledger states (#1704 slice 1). The sibling of
 * research-service.ts's `eventCalls` (Today only, the agenda's contract), kept in its own module so
 * that grandfathered file does not grow and so the two readers stay one directory read apart from
 * each other rather than tangled. Built the same way: the shelf listing names the ledgers, each is
 * read once, the decision header is parsed by research-event-calls.ts — nothing here summarises.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type HorizonCalls, horizonCallsOf } from "./research-event-calls.js";
import { listResearch } from "./research-service.js";

const researchDir = (): string => join(process.cwd(), "docs", "research");

/** Ledgers with at least one horizon row, keyed by event id. `root` is injectable for specs. */
export function eventHorizonCalls(root: string = researchDir()): ReadonlyMap<string, HorizonCalls> {
  const out = new Map<string, HorizonCalls>();
  for (const doc of listResearch(root).ledgers) {
    const calls = horizonCallsOf(readFileSync(join(root, `${doc.slug}.md`), "utf8"));
    if (Object.keys(calls).length > 0) out.set(doc.slug.slice("events/".length), calls);
  }
  return out;
}
