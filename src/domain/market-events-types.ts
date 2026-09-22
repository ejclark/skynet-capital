/**
 * The MarketEvent shape — split out of market-events-data.ts (the checked-in event table) so the
 * type definitions and the hand-maintained instances that inhabit them can each stay well clear of
 * Biome's per-file line budget without changing any behavior. Owns EventKind/EventStatus (kept
 * internal here, same as before the split — consumers key on `MarketEvent["kind"]`, so the union
 * never needs exporting) plus the exported ImpactTier and MarketEvent shapes.
 *
 * market-events-data.ts imports these types and re-exports them unchanged, so every existing
 * import path (market-events.ts, tests/domain/market-events.spec.ts, scripts/event-scan.mjs's
 * `MarketEvent[]` type annotation in its marker string) keeps working with zero changes there.
 */

// Kept internal — consumers key on `MarketEvent["kind"]` (the calendar view does exactly that),
// so the union never needs exporting.
type EventKind =
  | "earnings" // derived from earnings-calendar.ts via earningsAsEvents — never hand-entered here
  | "macro-print" // CPI, PPI, jobs report, FOMC decisions — scheduled, market-wide
  | "product-launch"
  | "sector" // PJM capacity auctions, export-control deadlines, FERC dockets
  | "rates" // Treasury auctions & supply — move yields, which move our long-duration AI names
  | "opex" // options expiration (monthly 3rd Friday; quarterly = triple/quad witching) — pin/gamma
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
  /** Where the date came from — must carry a source prefix (see market-events-data.ts header). */
  readonly source: string;
  /** Drives assessment cadence (assessment-cadence.json): how hard this can move us. */
  readonly impact: ImpactTier;
  /** Symbols affected; empty = market-wide (CPI, FOMC). */
  readonly symbols: readonly string[];
  readonly notes?: string;
  /** RETIRING A RE-SLUG (issue #3101) — the survivor's id, written by THIS event's own lane into
   *  THIS event's own file once it proves the two ids name one release. The loader then drops this
   *  entry from the calendar: it stops loading, stops pulsing, stops buying sessions. The file, its
   *  ledger and its forward-test fragment all stay on disk as the record.
   *
   *  MARK, DON'T DELETE — the shape every calendar standard uses to retire an event (RFC 5545
   *  `STATUS:CANCELLED`, RFC 5546 `CANCEL` keyed by the original `UID`, schema.org `eventStatus`),
   *  and the only shape available here anyway: one-file-per-owner (#1449, #1717) forbids a lane
   *  deleting another lane's file, which is why the convention this replaces was an all-caps
   *  "DUPLICATE of …" annotation inside the duplicate's own `title`. That convention retired
   *  nothing (every copy still drew its own 30-day pulse and bought its own close-out) and it blinded
   *  the only detector we had — annotating one pair dropped its title-overlap score from 0.857 to
   *  0.400, i.e. recording a duplicate removed it from the census of duplicates.
   *
   *  The contract (target is a canonical same-date file, no chains, this entry must be `estimate`,
   *  and its forward tests must already be scored) is enforced by `event-scan --validate`. */
  readonly supersededBy?: string;
}
