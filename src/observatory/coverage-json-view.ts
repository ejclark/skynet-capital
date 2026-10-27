import {
  type CoverageDepth,
  type CoverageMap,
  eventInSector,
  type SectorCoverage,
  sectorSlug,
} from "../domain/sector-coverage.js";
import type { FundStats } from "./sector-fund-stats.js";

/**
 * R&D → COVERAGE AS DATA (#3811 slice 3) — the JSON the Coverage section renders, shaped for the
 * placed shape H ("ring over matrix", Eric's 2026-10-07 reaction, placed 2026-10-26): a summary
 * readout beside a ring, then one row per sector with fixed count slots.
 *
 * Same contract as the other shell views: the server formats every value, the browser draws them
 * and never re-derives a figure. Everything here is a pure function of the coverage map, the
 * upcoming calendar and (optionally) the sector-fund bars, so a spec pins the whole payload.
 */

export type Tone = "pos" | "neg" | "flat";

export interface CoverageRowJson {
  readonly sector: string;
  /** The `sector:` token's value; null for Unclassified, which no event can be in. */
  readonly slug: string | null;
  readonly fund: string | null;
  readonly depth: CoverageDepth;
  readonly researched: readonly string[];
  readonly calendar: readonly string[];
  readonly held: readonly string[];
  /** How many macro ledgers are attributed to the sector — coverage that is not by name. */
  readonly macroReports: number;
  /** The first dated item ahead that the Board's own `sector:` rule places here. */
  readonly next: { readonly title: string; readonly date: string } | null;
  /** The sector fund's month, formatted; absent with no market data or bars too short. */
  readonly fundLine?: {
    readonly ret: string;
    readonly retTone: Tone;
    readonly vsSpy?: string;
    readonly vsSpyTone?: Tone;
    readonly vol?: string;
  };
}

export type FundsJson =
  | { readonly available: true; readonly window: "1M"; readonly asOf: string }
  | { readonly available: false; readonly note: string };

export interface CoverageJson {
  /** The date the join was read on. */
  readonly asOf: string;
  readonly coveredCount: number;
  readonly byName: number;
  readonly byMacroOnly: number;
  /** Sector names with no coverage of any kind, in row order. */
  readonly gaps: readonly string[];
  /** True when at least one of the viewer's accounts was read cleanly — an errored read never counts. */
  readonly holdingsRead: boolean;
  /** Present when one or more of the viewer's accounts could not be read: why a count is partial or absent. */
  readonly holdingsNote?: string;
  readonly heldSectorCount: number;
  /** The 11 GICS sectors in H's order: deepest first, then most names, then most macro reports. */
  readonly sectors: readonly CoverageRowJson[];
  /** Symbols no GICS sector can hold — named and counted, never dropped (criterion 2). */
  readonly unclassified: CoverageRowJson;
  readonly funds: FundsJson;
}

export interface CoverageViewInputs {
  readonly asOfIso: string;
  readonly map: CoverageMap;
  /** Upcoming events, date-sorted (`allEvents(asOf)`) — the "next" column's source. */
  readonly upcoming: readonly {
    readonly id: string;
    readonly title: string;
    readonly date: string;
    readonly symbols: readonly string[];
  }[];
  readonly holdingsRead: boolean;
  readonly holdingsNote?: string;
  /** Per fund ticker, or a note saying why there is no market data at all. */
  readonly funds: { readonly byFund: ReadonlyMap<string, FundStats> } | { readonly note: string };
}

const COVERAGE_DEPTH_RANK: Record<CoverageDepth, number> = {
  researched: 0,
  held: 1,
  calendar: 2,
  events: 3,
  gap: 4,
};

/** H's one order, shared by the ring and the rows so the ring's arcs read as the list below. */
function hOrder(a: SectorCoverage, b: SectorCoverage): number {
  return (
    COVERAGE_DEPTH_RANK[a.depth] - COVERAGE_DEPTH_RANK[b.depth] ||
    b.researched.length - a.researched.length ||
    b.eventLedgers.length - a.eventLedgers.length ||
    a.sector.localeCompare(b.sector)
  );
}

const tone = (v: number): Tone => (v > 0 ? "pos" : v < 0 ? "neg" : "flat");
const signed = (v: number, digits: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;

function fundLine(stats: FundStats): NonNullable<CoverageRowJson["fundLine"]> {
  const pct = Math.round(stats.ret * 1000) / 10;
  const pts = stats.vsSpy === undefined ? undefined : Math.round(stats.vsSpy * 1000) / 10;
  return {
    ret: `${signed(pct, 1)}%`,
    retTone: tone(pct),
    ...(pts !== undefined ? { vsSpy: `${signed(pts, 1)} pts vs S&P`, vsSpyTone: tone(pts) } : {}),
    ...(stats.vol20 !== undefined ? { vol: `vol ${Math.round(stats.vol20 * 100)}%` } : {}),
  };
}

export function coverageJsonView(inputs: CoverageViewInputs): CoverageJson {
  const byFund = "byFund" in inputs.funds ? inputs.funds.byFund : undefined;
  const row = (s: SectorCoverage): CoverageRowJson => {
    const isSector = s.fund !== null;
    const next = isSector ? inputs.upcoming.find((e) => eventInSector(s.sector, e)) : undefined;
    const stats = s.fund ? byFund?.get(s.fund) : undefined;
    return {
      sector: s.sector,
      slug: isSector ? sectorSlug(s.sector) : null,
      fund: s.fund,
      depth: s.depth,
      researched: s.researched,
      calendar: s.calendar,
      held: s.held,
      macroReports: s.eventLedgers.length,
      next: next ? { title: next.title, date: next.date } : null,
      ...(stats ? { fundLine: fundLine(stats) } : {}),
    };
  };
  const ordered = [...inputs.map.sectors].sort(hOrder);
  // The as-of a member reads beside the numbers is the OLDEST fund's last bar: one stamp for the
  // column must never claim a fresher day than any number under it.
  const asOfs = byFund ? [...byFund.values()].map((s) => s.asOf).sort() : [];
  const funds: FundsJson =
    "note" in inputs.funds
      ? { available: false, note: inputs.funds.note }
      : asOfs[0]
        ? { available: true, window: "1M", asOf: asOfs[0] }
        : { available: false, note: "No sector-fund prices came back just now." };
  return {
    asOf: inputs.asOfIso.slice(0, 10),
    coveredCount: inputs.map.coveredCount,
    byName: inputs.map.sectors.filter((s) => s.researched.length > 0).length,
    byMacroOnly: inputs.map.sectors.filter(
      (s) => s.researched.length === 0 && s.eventLedgers.length > 0,
    ).length,
    gaps: ordered.filter((s) => s.depth === "gap").map((s) => s.sector),
    holdingsRead: inputs.holdingsRead,
    ...(inputs.holdingsNote ? { holdingsNote: inputs.holdingsNote } : {}),
    heldSectorCount: inputs.map.sectors.filter((s) => s.held.length > 0).length,
    sectors: ordered.map(row),
    unclassified: row(inputs.map.unclassified),
    funds,
  };
}
