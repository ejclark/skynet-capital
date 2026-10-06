/**
 * SECTOR COVERAGE — where our attention sits across the market, as a pure join (#3811 slice 1).
 *
 * The calendar answers *when* (events across time). This answers *where*: which of the 11 GICS
 * sectors our research, the forward calendar and a member's holdings actually reach, and which are
 * gaps. Same marks, different axis — see #3811 for the IA call.
 *
 * NO NEW FACTS. Every symbol's sector comes from `ticker-directory/` (the GICS-filed table), every
 * ledger from the shelf, every date from the event calendar, every holding from the broker read.
 * This module joins them and classifies; it invents nothing, and a symbol it cannot file lands in
 * the UNCLASSIFIED row with its count rather than being dropped (#3811 criterion 2).
 *
 * WHY THE DIRECTORY AND NOT `src/universe/sectors.ts`: that map is a coarse 5-value THEME map for
 * the 3D scene (it files NEE under energy, AMZN/GOOG/META under tech). The directory files by GICS,
 * which is what a coverage claim has to mean to be honest. The scene keeps its theme map.
 */
import { TICKER_DIRECTORY } from "./ticker-directory/index.js";

/**
 * The 11 GICS sectors, by the label `ticker-directory/` itself uses, with the SPDR Select Sector
 * fund that tracks each one. The labels are the directory's ("Technology", "Healthcare") rather
 * than GICS's own wording ("Information Technology", "Health Care") so that one table is the
 * source of truth for which sector a symbol is in — a second spelling here would be a drift seam.
 *
 * The directory also carries three NON-GICS buckets ("ETF", "Crypto", "Small cap"). They are not
 * sectors, so a symbol filed under one is unclassified for coverage purposes, exactly like a symbol
 * the directory has never heard of.
 */
export const GICS_SECTORS: readonly { readonly name: string; readonly fund: string }[] = [
  { name: "Technology", fund: "XLK" },
  { name: "Communication Services", fund: "XLC" },
  { name: "Healthcare", fund: "XLV" },
  { name: "Financials", fund: "XLF" },
  { name: "Energy", fund: "XLE" },
  { name: "Consumer Discretionary", fund: "XLY" },
  { name: "Consumer Staples", fund: "XLP" },
  { name: "Industrials", fund: "XLI" },
  { name: "Utilities", fund: "XLU" },
  { name: "Real Estate", fund: "XLRE" },
  { name: "Materials", fund: "XLB" },
];

/** The row an unfilable symbol lands in — named, counted, never dropped. */
export const UNCLASSIFIED = "Unclassified";

/**
 * MACRO SERIES WHOSE SUBJECT IS ONE INDUSTRY — how a sector gets credit for coverage it has
 * without owning a single name. Eric's own observation (#3811): energy is covered by EIA and OPEC
 * ledgers, not by tickers, and the view should show that difference rather than flatten it.
 *
 * THE ADMISSION RULE, so this table can grow without turning into opinion: an entry qualifies only
 * when (a) the dated item's SUBJECT is one industry, and (b) GICS files that industry in exactly
 * one sector. A broad diffusion or price index informs every sector and is attributed to none —
 * CPI, PPI, jobs, ISM, FOMC and Treasury supply are deliberately absent, and adding one would be
 * the whole table's credibility spent at once.
 *
 * Match is on the event id's PREFIX, the same join key a ledger uses (`docs/research/events/<id>`).
 */
export const SECTOR_MACRO_SERIES: readonly {
  readonly prefix: string;
  readonly sector: string;
}[] = [
  // Petroleum/natural-gas balances and OPEC+ supply decisions — oil & gas, one GICS sector.
  { prefix: "eia-", sector: "Energy" },
  { prefix: "opec-", sector: "Energy" },
  { prefix: "gastech", sector: "Energy" },
  { prefix: "g20-energy-", sector: "Energy" },
  // PJM capacity auctions and reliability procurements price power — regulated electric utilities.
  { prefix: "pjm-", sector: "Utilities" },
  // House-price and vacancy series read through to property owners and REITs.
  { prefix: "case-shiller-hpi-", sector: "Real Estate" },
  { prefix: "fhfa-hpi-", sector: "Real Estate" },
  { prefix: "nar-metro-home-prices-", sector: "Real Estate" },
  { prefix: "existing-home-sales-", sector: "Real Estate" },
  { prefix: "pending-home-sales-", sector: "Real Estate" },
  { prefix: "housing-vacancies-", sector: "Real Estate" },
  // New-home demand and builder sentiment read through to homebuilders, which GICS files under
  // Consumer Discretionary (Household Durables → Homebuilding) — the same sector as LEN and KBH.
  { prefix: "housing-starts-", sector: "Consumer Discretionary" },
  { prefix: "new-home-sales-", sector: "Consumer Discretionary" },
  { prefix: "nahb-hmi-", sector: "Consumer Discretionary" },
  // Construction & Engineering is an Industrials industry group.
  { prefix: "construction-spending-", sector: "Industrials" },
];

/** Symbol → GICS sector, built once from the directory; a non-GICS bucket is left out so the
 *  lookup returns undefined for it, which is what makes it unclassified rather than mis-filed. */
const SECTOR_OF_SYMBOL: ReadonlyMap<string, string> = (() => {
  const gics = new Set(GICS_SECTORS.map((s) => s.name));
  const bySymbol = new Map<string, string>();
  for (const entry of TICKER_DIRECTORY) {
    if (!gics.has(entry.sector)) continue;
    // First listing wins: a symbol repeated across files keeps the sector it was first filed under,
    // so this map never silently depends on directory concatenation order changing.
    if (!bySymbol.has(entry.symbol.toUpperCase()))
      bySymbol.set(entry.symbol.toUpperCase(), entry.sector);
  }
  return bySymbol;
})();

/** Which GICS sector a symbol is filed under, or undefined when the directory cannot file it. */
export function sectorOf(symbol: string): string | undefined {
  return SECTOR_OF_SYMBOL.get(symbol.trim().toUpperCase());
}

/**
 * Sector → its members and its macro series, inverted ONCE at module load. The call board tests
 * every row against the scoped sector, so re-deriving these per row would walk the whole directory
 * a few hundred times per keystroke — the kind of cost a phone feels.
 */
const MEMBERS_BY_SECTOR: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const bySector = new Map<string, Set<string>>();
  for (const [symbol, sector] of SECTOR_OF_SYMBOL) {
    const key = sector.toLowerCase();
    const members = bySector.get(key) ?? new Set<string>();
    members.add(symbol);
    bySector.set(key, members);
  }
  return bySector;
})();

const PREFIXES_BY_SECTOR: ReadonlyMap<string, readonly string[]> = (() => {
  const bySector = new Map<string, string[]>();
  for (const { prefix, sector } of SECTOR_MACRO_SERIES) {
    const key = sector.toLowerCase();
    bySector.set(key, [...(bySector.get(key) ?? []), prefix]);
  }
  return bySector;
})();

/** Every symbol the directory files under a sector, sorted — the `sector:` filter's membership. */
export function symbolsInSector(sector: string): readonly string[] {
  return [...(MEMBERS_BY_SECTOR.get(sector.toLowerCase()) ?? [])].sort();
}

/** The macro series attributed to a sector, by the admission rule above. */
export function macroPrefixesFor(sector: string): readonly string[] {
  return PREFIXES_BY_SECTOR.get(sector.toLowerCase()) ?? [];
}

/** The URL/query form of a sector name — `Consumer Discretionary` ↔ `consumer-discretionary`. */
export function sectorSlug(sector: string): string {
  return sector.toLowerCase().replace(/[^a-z]+/g, "-");
}

/**
 * A `sector:` token's value resolved back to its canonical sector name, or undefined when it names
 * none — a token nothing can be said about must filter nothing, rather than everything.
 *
 * The 11 GICS sectors ONLY. `Unclassified` is a row on the coverage map, not a place an event can
 * be in: nothing is filed there BY the directory, so a `sector:unclassified` scope would match no
 * event and empty the board while printing "no ledger is in Unclassified" — a false claim about a
 * corpus full of them.
 */
export function sectorFromSlug(slug: string): string | undefined {
  const wanted = slug.trim().toLowerCase();
  return GICS_SECTORS.map((s) => s.name).find((name) => sectorSlug(name) === wanted);
}

/**
 * Does this event belong to a sector? True when it names a symbol the directory files there, when
 * its id leads with such a symbol (the ledger-id convention, `nvda-2026-08-26-print`), or when it
 * is one of the sector's own macro series. The ONE rule the Board's `sector:` filter and the
 * coverage join both read, so a filtered board and the tile that filtered it can never disagree.
 */
export function eventInSector(
  sector: string,
  event: { readonly id: string; readonly symbols: readonly string[] },
): boolean {
  const members = MEMBERS_BY_SECTOR.get(sector.toLowerCase()) ?? new Set<string>();
  if (event.symbols.some((sym) => members.has(sym.toUpperCase()))) return true;
  const lead = event.id.toUpperCase().split("-")[0] ?? "";
  if (members.has(lead)) return true;
  return macroPrefixesFor(sector).some((prefix) => event.id.startsWith(prefix));
}

/**
 * DOES THIS LEDGER COVER THIS SYMBOL — one rule, two consumers (`research-service.ts`'s shelf
 * chips and the coverage join below), so the shelf and the coverage map can never disagree about
 * what is researched.
 *
 * The id prefix is the convention (`nvda-2026-08-26-print`), but it is not the only shape in the
 * corpus: three ledgers are named for the COMPANY rather than the ticker (`costco-…`, `lennar-…`,
 * `kb-home-…`), and a prefix test silently dropped all three — COST, LEN and KBH read as
 * unresearched while their ledgers sat on the shelf (#3811, criterion 8). The event those ledgers
 * are for carries `symbols: ["COST"]` etc., so the second test reads the symbol off the EVENT
 * rather than guessing a company→ticker mapping that would need its own hand table.
 */
export function ledgerCoversSymbol(
  ledgerId: string,
  symbol: string,
  eventSymbols: ReadonlySet<string> = new Set(),
): boolean {
  const sym = symbol.toUpperCase();
  return ledgerId.toLowerCase().startsWith(`${sym.toLowerCase()}-`) || eventSymbols.has(sym);
}

/** How deeply a sector is covered — strongest first; `gap` is the honest none-of-the-above. */
export type CoverageDepth = "researched" | "held" | "calendar" | "events" | "gap";

export interface SectorCoverage {
  readonly sector: string;
  /** The SPDR Select Sector fund that tracks it, or null for the Unclassified row (no such fund). */
  readonly fund: string | null;
  readonly depth: CoverageDepth;
  /** Symbols in this sector with a ledger on the shelf. */
  readonly researched: readonly string[];
  /** Symbols on an upcoming event or print with no ledger yet. */
  readonly calendar: readonly string[];
  /** Symbols in the viewer's positions. */
  readonly held: readonly string[];
  /** Macro ledger ids attributed to this sector — coverage that is not by name. */
  readonly eventLedgers: readonly string[];
}

export interface CoverageMap {
  /** Always the 11 GICS sectors, in the table's order — a sector with nothing still gets its row. */
  readonly sectors: readonly SectorCoverage[];
  /** Symbols the directory could not file, named and counted rather than dropped. */
  readonly unclassified: SectorCoverage;
  /** How many of the 11 are covered at all (anything but `gap`) — the "3 of 11" readout. */
  readonly coveredCount: number;
}

export interface CoverageInputs {
  /** Ledger ids on the shelf — `<event-id>`, with or without the `events/` slug prefix. */
  readonly ledgerIds: readonly string[];
  /** Every event, past and upcoming: what a ledger can be FOR. Research keeps history. */
  readonly allEvents: readonly { readonly id: string; readonly symbols: readonly string[] }[];
  /** Upcoming events only: what is still ahead on the calendar. */
  readonly upcomingEvents: readonly { readonly id: string; readonly symbols: readonly string[] }[];
  /** Symbols on the forward earnings calendar. */
  readonly printSymbols: readonly string[];
  /** The viewer's held symbols (equity underlyings; an option row's underlying, never its OCC id). */
  readonly heldSymbols: readonly string[];
}

const stripSlug = (id: string): string =>
  id.startsWith("events/") ? id.slice("events/".length) : id;

/** Which sector each ledger id lands in by its own macro prefix, or undefined for a named ledger. */
const macroSectorOf = (ledgerId: string): string | undefined =>
  SECTOR_MACRO_SERIES.find((s) => ledgerId.startsWith(s.prefix))?.sector;

function depthOf(row: Omit<SectorCoverage, "depth" | "fund">): CoverageDepth {
  if (row.researched.length > 0) return "researched";
  if (row.held.length > 0) return "held";
  if (row.calendar.length > 0) return "calendar";
  if (row.eventLedgers.length > 0) return "events";
  return "gap";
}

const bucket = (): {
  researched: string[];
  calendar: string[];
  held: string[];
  events: string[];
} => ({
  researched: [],
  calendar: [],
  held: [],
  events: [],
});

/**
 * THE JOIN. Pure: every fact arrives as an argument, nothing is read from disk or the network, so
 * a spec can pin the whole map against a fixed corpus.
 *
 * Research depth is strongest-first: a researched name is never also listed as "on the calendar",
 * because the two are the same axis and a name in both would double-count the sector. A HOLDING is
 * a different axis (the viewer's portfolio) and may co-occur with either — see the note inline.
 */
export function coverageBySector(inputs: CoverageInputs): CoverageMap {
  const ledgers = inputs.ledgerIds.map(stripSlug);
  const ledgerSet = new Set(ledgers);
  const symbolsOf = (events: CoverageInputs["allEvents"]): Set<string> => {
    const out = new Set<string>();
    for (const e of events) for (const s of e.symbols) out.add(s.toUpperCase());
    return out;
  };

  // RESEARCHED is read off the LEDGERS, not off the calendar. Walking the events instead would
  // make coverage expire: earnings events come from a rolling forward window, so the day a symbol
  // drops off it, its ledgers would stop counting and its sector would flip to `gap` — the same
  // silent drop as the company-named ledgers this slice fixes, one layer up.
  const eventSymbolsById = new Map(
    inputs.allEvents.map((e) => [e.id, new Set(e.symbols.map((s) => s.toUpperCase()))] as const),
  );
  const researched = new Set<string>();
  for (const id of ledgerSet) {
    const named = eventSymbolsById.get(id);
    if (named && named.size > 0) {
      for (const sym of named) researched.add(sym);
      continue;
    }
    // No event to read the names off (it has aged out of the table, or names none): fall back to
    // the id's leading token, and ONLY when the directory files it as a real ticker. Without that
    // guard every macro ledger would mint a symbol — `eia-steo-…` would file "EIA" as a name we
    // research, under Unclassified, which is a claim about a ticker that does not exist.
    const lead = id.toUpperCase().split("-")[0] ?? "";
    if (sectorOf(lead)) researched.add(lead);
  }

  // ON THE CALENDAR: still ahead, nothing written yet. Researched OUTRANKS it, and the two are
  // exclusive — they are the same dimension (how far our research has got with this name), and a
  // name in both columns would double-count the sector's depth.
  //
  // `held` is NOT that dimension and deliberately overlaps either: it is the viewer's portfolio,
  // not our research. "Upcoming print, no ledger, and you own it" is the single most useful cell
  // on the map, so suppressing one of those two facts to keep the row tidy would cost a reader the
  // thing they came for. `depth` below still picks ONE label for the tile.
  const held = new Set(inputs.heldSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean));
  const calendar = new Set<string>();
  for (const sym of [
    ...symbolsOf(inputs.upcomingEvents),
    ...inputs.printSymbols.map((s) => s.toUpperCase()),
  ]) {
    if (!researched.has(sym)) calendar.add(sym);
  }

  const rows = new Map<string, ReturnType<typeof bucket>>();
  const rowFor = (sector: string): ReturnType<typeof bucket> => {
    const existing = rows.get(sector);
    if (existing) return existing;
    const fresh = bucket();
    rows.set(sector, fresh);
    return fresh;
  };
  for (const [key, symbols] of [
    ["researched", researched],
    ["calendar", calendar],
    ["held", held],
  ] as const) {
    for (const sym of symbols) rowFor(sectorOf(sym) ?? UNCLASSIFIED)[key].push(sym);
  }
  // Coverage that is not by name: a macro ledger whose subject is one industry.
  for (const id of ledgerSet) {
    const sector = macroSectorOf(id);
    if (sector) rowFor(sector).events.push(id);
  }

  const build = (sector: string, fund: string | null): SectorCoverage => {
    const row = rows.get(sector) ?? bucket();
    const base = {
      sector,
      researched: [...row.researched].sort(),
      calendar: [...row.calendar].sort(),
      held: [...row.held].sort(),
      eventLedgers: [...row.events].sort(),
    };
    return { ...base, fund, depth: depthOf(base) };
  };

  const sectors = GICS_SECTORS.map((s) => build(s.name, s.fund));
  return {
    sectors,
    unclassified: build(UNCLASSIFIED, null),
    coveredCount: sectors.filter((s) => s.depth !== "gap").length,
  };
}
