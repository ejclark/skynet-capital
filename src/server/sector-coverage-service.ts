/**
 * THE COVERAGE JOIN'S ONE I/O CALLER (#3811 slice 1) — reads the shelf and the event corpus off
 * disk, then hands them to the pure `coverageBySector()` in `domain/sector-coverage.ts`.
 *
 * The split is the point: everything judgemental (which sector, how deep, what counts as
 * researched) is pure and pinned by a spec against a fixed corpus; this file only gathers. Held
 * symbols arrive from the CALLER rather than being read here, because holdings are per member —
 * the broker read belongs to the route that already knows who is asking, and a coverage map that
 * quietly fetched someone's positions would be the wrong seam for that.
 */
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { allEvents, everyEvent } from "../domain/market-events.js";
import { type CoverageMap, coverageBySector } from "../domain/sector-coverage.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import { listResearch, RESEARCH_DIR } from "./research-service.js";

/**
 * A position's symbol as coverage counts it: an option row counts for its UNDERLYING, never its
 * OCC id. Holding NVDA calls is attention on NVDA; filing `NVDA261218C00180000` under Unclassified
 * would report a gap that isn't one.
 */
export function heldUnderlying(symbol: string): string {
  return parseOccSymbol(symbol)?.underlying ?? symbol.trim().toUpperCase();
}

/** The coverage map for one viewer. `heldSymbols` is their position symbols (OCC rows welcome);
 *  pass none for the pre-holdings view, which is honest rather than empty — a sector can still be
 *  researched, on the calendar, or covered by its macro series. */
export function shelfCoverage(
  asOfIso: string,
  heldSymbols: readonly string[] = [],
  root: string = RESEARCH_DIR(),
): CoverageMap {
  return coverageBySector({
    ledgerIds: listResearch(root).ledgers.map((d) => d.slug),
    allEvents: everyEvent(),
    upcomingEvents: allEvents(asOfIso),
    printSymbols: UPCOMING_PRINTS.map((p) => p.symbol),
    heldSymbols: [...new Set(heldSymbols.map(heldUnderlying))],
  });
}
