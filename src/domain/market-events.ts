/**
 * The forward market-event calendar — every dated thing that can move the names we trade, one
 * model: our own prints (derived from earnings-calendar.ts, never duplicated), macro prints
 * (CPI/FOMC), product launches, sector events, and dated geopolitical checkpoints.
 *
 * WHY A CHECKED-IN TABLE (same doctrine as earnings-calendar.ts): event dates change rarely, must
 * be reviewable in a diff (a wrong date silently corrupts every window and every assessment keyed
 * to it), and the trading path must never fetch the network to decide. Past dates age out safely
 * because every query below ignores them.
 *
 * WHO READS THIS: scripts/event-scan.mjs (the assessment scanner — it extracts the MARKET_EVENTS
 * literal below by marker string, so keep the `export const MARKET_EVENTS` line intact; the drift
 * gate in tests/arch/event-scan.spec.ts goes red if extraction and this module ever disagree),
 * the observatory's `/calendar` view (calendar-view.ts, via `allEvents`), and — still pending —
 * the morning brief via `eventsWithin`.
 *
 * DATE POLICY (inherited from earnings-calendar.ts / docs/plans/trade-playbooks.md): an
 * `estimate` may only WIDEN caution; date-keyed action requires `confirmed`. Research is not
 * action — estimate events still get researched — but every trading-adjacent statement written
 * about an event must carry its confirmed/estimate label honestly.
 *
 * SOURCE PREFIXES (the audit trail of HOW a date is known, extending IR:/CAL: from the earnings
 * calendar). `confirmed` requires a trusted prefix; `estimate` requires an honest one:
 *   confirmed — `IR:` company primary source · `CAL:` automated aggregator cross-ref ·
 *               `BLS:` bls.gov release schedule · `FED:` federalreserve.gov FOMC calendar ·
 *               `PJM:` pjm.com auction schedule · `SEC:` an SEC filing
 *   estimate  — `EST:` cadence/reasoning estimate · `NEWS:` press-reported, not primary-verified
 * The scanner's `--validate` mode enforces this mapping.
 */
import { daysUntil, type EarningsPrint, UPCOMING_PRINTS } from "./earnings-calendar.js";

// Kept internal — consumers key on `MarketEvent["kind"]` (the calendar view does exactly that),
// so the union never needs exporting.
type EventKind =
  | "earnings" // derived from earnings-calendar.ts via earningsAsEvents — never hand-entered here
  | "macro-print" // CPI, PPI, jobs report, FOMC decisions — scheduled, market-wide
  | "product-launch"
  | "sector" // PJM capacity auctions, export-control deadlines, FERC dockets
  | "geopolitical"; // dated checkpoints only (a summit, a tariff deadline) — regime shifts with
// no date belong in the adjacency checklist, not here (see docs/process/EVENT-RESEARCH.md)

export type ImpactTier = "critical" | "high" | "medium" | "low";
type EventStatus = "confirmed" | "estimate";

export interface MarketEvent {
  /** Stable slug (lowercase, hyphenated) — the join key to the assessment ledger doc at
   *  docs/research/events/<id>.md and to the `[event-research] <id>` issue title. */
  readonly id: string;
  readonly kind: EventKind;
  readonly title: string;
  /** YYYY-MM-DD (UTC date-only; same calendar-day math as earnings-calendar.ts). */
  readonly date: string;
  readonly status: EventStatus;
  /** Where the date came from — must carry a source prefix (see header). */
  readonly source: string;
  /** Drives assessment cadence (assessment-cadence.json): how hard this can move us. */
  readonly impact: ImpactTier;
  /** Symbols affected; empty = market-wide (CPI, FOMC). */
  readonly symbols: readonly string[];
  readonly notes?: string;
}

/**
 * Hand-curated non-earnings events. Earnings NEVER go here — they are derived from
 * UPCOMING_PRINTS so print dates keep exactly one source of truth (and confirm-print-dates.ts
 * keeps working unchanged). Seeded 2026-08-15; BLS/FED dates hand-verified against the primary
 * schedules that day (the aggregator check that day had the Dec CPI date WRONG — Dec 18 vs the
 * real Dec 10 — which is the whole case for the prefix discipline).
 */
export const MARKET_EVENTS: readonly MarketEvent[] = [
  {
    id: "cpi-2026-09-11",
    kind: "macro-print",
    title: "CPI release (Aug 2026 data)",
    date: "2026-09-11",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
    notes: "Rate-path input; AI-infra names trade as long-duration assets on it.",
  },
  {
    id: "fomc-2026-09-16",
    kind: "macro-print",
    title: "FOMC decision (meeting Sep 15–16, SEP + dot plot)",
    date: "2026-09-16",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "cpi-2026-10-14",
    kind: "macro-print",
    title: "CPI release (Sep 2026 data)",
    date: "2026-10-14",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "fomc-2026-10-28",
    kind: "macro-print",
    title: "FOMC decision (meeting Oct 27–28)",
    date: "2026-10-28",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
    notes: "Lands ON the GOOG/META print date and a day before AMZN/AAPL — a compound-risk day.",
  },
  {
    id: "cpi-2026-11-10",
    kind: "macro-print",
    title: "CPI release (Oct 2026 data)",
    date: "2026-11-10",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "cpi-2026-12-10",
    kind: "macro-print",
    title: "CPI release (Nov 2026 data)",
    date: "2026-12-10",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "fomc-2026-12-09",
    kind: "macro-print",
    title: "FOMC decision (meeting Dec 8–9, SEP + dot plot)",
    date: "2026-12-09",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "pjm-capacity-auction-2026-12",
    kind: "sector",
    title: "PJM capacity auction window closes",
    date: "2026-12-15",
    status: "estimate",
    source: "EST: docs/research/ai-energy-constraint.md watch list — confirm vs pjm.com",
    impact: "medium",
    symbols: [],
    notes: "AI-datacenter power-cost signal (the energy-constraint watch list's dated indicator).",
  },
];

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

/** Events inside the next `days` calendar days — the morning-brief horizon (slice 2 seam). */
export function eventsWithin(
  asOfIso: string,
  days: number,
  events: readonly MarketEvent[] = MARKET_EVENTS,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): MarketEvent[] {
  return allEvents(asOfIso, events, prints).filter((e) => daysUntil(asOfIso, e.date) <= days);
}
