import { percentTone, signedPercent } from "../ui";
import { dayLabel } from "./book-events";

/**
 * The whole market on the landing page, client side (#7077 slice 1b) — mirrors `SectorsView` in
 * `src/domain/edition-sectors.ts`, which works each move out of checked-in closes. This file holds
 * the words, the order and the member's choice of view; `shell/sector-overview.tsx` draws them.
 */

export type SectorPeriod = "day" | "week" | "month" | "ytd";

export interface SectorRow {
  readonly name: string;
  readonly fund: string;
  readonly market?: true;
  /** Percent change, close to close. */
  readonly moves: Readonly<Record<SectorPeriod, number>>;
}

export interface SectorsView {
  readonly source: string;
  readonly from: Readonly<Record<SectorPeriod, string>>;
  readonly rows: readonly SectorRow[];
}

/** AT2: Day · Week · Month · YTD, Week first. */
export const PERIODS: readonly (readonly [SectorPeriod, string])[] = [
  ["day", "Day"],
  ["week", "Week"],
  ["month", "Month"],
  ["ytd", "YTD"],
];
export const DEFAULT_PERIOD: SectorPeriod = "week";

/** AT3: three views of the same numbers, Bars first (round 3's members' pick). */
export type SectorLook = "bars" | "lines" | "tiles";
export const LOOKS: readonly (readonly [SectorLook, string])[] = [
  ["bars", "Bars"],
  ["lines", "Lines"],
  ["tiles", "Tiles"],
];
export const DEFAULT_LOOK: SectorLook = "bars";

/** One decimal everywhere on the overview, so a shape and its figure always agree. */
const DIGITS = 1;

/** Keyed by `percentTone`, the twin of `signedPercent`, so a shape and its figure never disagree. */
const SHAPES = {
  pos: { glyph: "▲", word: "up" },
  neg: { glyph: "▼", word: "down" },
  flat: { glyph: "▬", word: "level" },
} as const;

/** A move's shape and its word (AT1: ▲ ▼ ▬). A move that rounds to 0.0% is level, never "up". */
export function moveShape(percent: number): { readonly glyph: string; readonly word: string } {
  return SHAPES[percentTone(percent, DIGITS)];
}

/** The figure beside a row: "+4.9%", "−12.0%", "0.0%". */
export const moveFigure = (percent: number): string => signedPercent(percent, DIGITS);

/** What the period's numbers count from, said plainly: "since the Fri, Oct 30 close". */
export const sinceLine = (view: SectorsView, period: SectorPeriod): string =>
  `since the ${dayLabel(view.from[period])} close`;

/** The S&P 500's row, and the sectors ranked by the period's move, biggest gain first, so "which
 *  sector fell most" is the last row in every view (round 3's task T1). */
export function ranked(
  view: SectorsView,
  period: SectorPeriod,
): { readonly market: SectorRow | undefined; readonly sectors: readonly SectorRow[] } {
  return {
    market: view.rows.find((r) => r.market),
    sectors: view.rows
      .filter((r) => !r.market)
      .sort((a, b) => b.moves[period] - a.moves[period] || a.name.localeCompare(b.name)),
  };
}

/** The largest move in the period, the bars' full half-width. Never zero, so a level day draws. */
export const scaleOf = (view: SectorsView, period: SectorPeriod): number =>
  Math.max(0.1, ...view.rows.map((r) => Math.abs(r.moves[period])));

const LOOK_KEY = "skynet.landing.sector-look";

/** AT3: the view the member picked last, in this browser. A way of looking, never a record. */
export function storedLook(): SectorLook {
  try {
    const v = window.localStorage.getItem(LOOK_KEY);
    return LOOKS.some(([k]) => k === v) ? (v as SectorLook) : DEFAULT_LOOK;
  } catch {
    return DEFAULT_LOOK;
  }
}

export function rememberLook(look: SectorLook): void {
  try {
    window.localStorage.setItem(LOOK_KEY, look);
  } catch {
    // Without storage the overview opens on Bars next time.
  }
}
