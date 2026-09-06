/**
 * The forward market-event calendar — every dated thing that can move the names we trade, one
 * model: our own prints (derived from earnings-calendar.ts, never duplicated), macro prints
 * (CPI/FOMC), product launches, sector events, Treasury supply, options expiration, and dated
 * geopolitical checkpoints.
 *
 * This module owns the TYPES and the QUERY functions. The curated table itself lives in
 * market-events-data.ts (re-exported below as MARKET_EVENTS) so the hand-maintained data can grow
 * with coverage without inflating this logic module's line budget — the source-prefix / date
 * policy that governs that table is documented at the top of that file.
 *
 * DATE POLICY (inherited from earnings-calendar.ts / docs/plans/trade-playbooks.md): an
 * `estimate` may only WIDEN caution; date-keyed action requires `confirmed`. Research is not
 * action — estimate events still get researched — but every trading-adjacent statement written
 * about an event must carry its confirmed/estimate label honestly.
 */
import { daysUntil, type EarningsPrint, UPCOMING_PRINTS } from "./earnings-calendar.js";
import { type ImpactTier, MARKET_EVENTS, type MarketEvent } from "./market-events-data.js";

// Re-exported so every consumer keeps importing the shape AND the table from this module — the
// query API — while the leaf (market-events-data.ts) owns both. The drift gate in
// tests/arch/event-scan.spec.ts compares MARKET_EVENTS byte-for-byte against the scanner's
// marker-string extraction of the literal in that leaf.
export { type ImpactTier, MARKET_EVENTS, type MarketEvent };

/** Default earnings impact: prints on tracked names are the 10–25%-swing class. */
const EARNINGS_IMPACT: ImpactTier = "critical";

/**
 * Earnings prints as events — the adapter that keeps ONE source of truth for print dates.
 * Status and source pass through untouched so the confirmed/estimate asymmetry survives the
 * translation; ids are stable (`nvda-2026-08-26-print`) so ledger docs never dangle on re-derive.
 */
export function earningsAsEvents(
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
  impactOf: (symbol: string) => ImpactTier = () => EARNINGS_IMPACT,
): MarketEvent[] {
  return prints.map((p) => ({
    id: `${p.symbol.toLowerCase()}-${p.date}-print`,
    kind: "earnings",
    title: `${p.symbol} earnings print`,
    date: p.date,
    status: p.status,
    source: p.source,
    impact: impactOf(p.symbol),
    symbols: [p.symbol],
  }));
}

/** Every upcoming event (today counts as upcoming), merged and date-sorted. */
export function allEvents(
  asOfIso: string,
  events: readonly MarketEvent[] = MARKET_EVENTS,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): MarketEvent[] {
  return [...events, ...earningsAsEvents(prints)]
    .filter((e) => daysUntil(asOfIso, e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/**
 * Every event, past and upcoming, merged and date-sorted — the research shelf's calendar (#1704),
 * which keeps history: a closed-out ledger's call is still a receipt worth stepping back to.
 * Everything that gates or schedules keeps using `allEvents`, where a past date must drop out.
 */
export function everyEvent(
  events: readonly MarketEvent[] = MARKET_EVENTS,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): MarketEvent[] {
  return [...events, ...earningsAsEvents(prints)].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

/** Events inside the next `days` calendar days — the morning-brief horizon (slice 2 seam). */
export function eventsWithin(
  asOfIso: string,
  days: number,
  events: readonly MarketEvent[] = MARKET_EVENTS,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): MarketEvent[] {
  return allEvents(asOfIso, events, prints).filter((e) => daysUntil(asOfIso, e.date) <= days);
}
