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
  /** AT8: the 20-day band (average ± two standard deviations) and the close, in dollars. */
  readonly range: {
    readonly low: number;
    readonly mid: number;
    readonly high: number;
    readonly close: number;
  };
  /** AT12: the 20 closes the band is drawn from, oldest first, in dollars. */
  readonly trail: readonly number[];
}

export interface SectorsView {
  readonly source: string;
  readonly from: Readonly<Record<SectorPeriod, string>>;
  /** The first and last of the 20 sessions the band is drawn from. */
  readonly rangeSpan: { readonly from: string; readonly to: string };
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

/** AT3, revised (slice 1c): two views of the same numbers, Lines first. Bars were dropped as "fully
 *  redundant with the percentage change" (Eric, #7018 round 3), so a kept "bars" opens on Lines. */
export type SectorLook = "lines" | "tiles";
export const LOOKS: readonly (readonly [SectorLook, string])[] = [
  ["lines", "Lines"],
  ["tiles", "Tiles"],
];
export const DEFAULT_LOOK: SectorLook = "lines";

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

/** Where a close sits against its 20-day band (AT8). */
export type RangeZone = "above" | "within" | "below";

export interface RangeMark {
  readonly zone: RangeZone;
  /** Where to draw the mark across the track, 0–1: the band spans `BAND_FROM`–`BAND_TO`, and a close
   *  outside it sits in the margin beyond, pinned short of the edge. */
  readonly at: number;
  /** Words only at the extremes (AT8); inside the band the mark speaks for itself. */
  readonly word?: string;
  /** The whole reading for a screen reader, figures included. */
  readonly label: string;
}

export const BAND_FROM = 0.2;
export const BAND_TO = 0.8;
const MARGIN = 0.04;

const usd = (v: number): string => `$${v.toFixed(2)}`;

/**
 * The 20-day range mark (AT8). Its words describe where the price sits, never what to do about it:
 * "above its usual range", never "overbought" or "stretched" (the honesty line on AT8: a range mark
 * never reads as a buy or sell signal).
 */
export function rangeMark(range: SectorRow["range"]): RangeMark {
  const width = range.high - range.low;
  const b = width > 0 ? (range.close - range.low) / width : 0.5;
  const zone: RangeZone = b > 1 ? "above" : b < 0 ? "below" : "within";
  const at = Math.min(1 - MARGIN, Math.max(MARGIN, BAND_FROM + b * (BAND_TO - BAND_FROM)));
  const word =
    zone === "above"
      ? "above its usual range"
      : zone === "below"
        ? "below its usual range"
        : undefined;
  const part = b >= 2 / 3 ? "upper third" : b <= 1 / 3 ? "lower third" : "middle";
  const where = word ?? `in its usual range, ${part}`;
  return {
    zone,
    at,
    ...(word ? { word } : {}),
    label: `${where}: closed at ${usd(range.close)}, 20-day range ${usd(range.low)} to ${usd(range.high)}`,
  };
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
    // Without storage the overview opens on Lines next time.
  }
}

/** AT12's wide chart, in percent of its box: the 20 closes as points, the band's top and bottom,
 *  and the last close's dot. Y runs down the page, so a higher price has a smaller `y`. */
export interface TrailChart {
  readonly points: readonly { readonly x: number; readonly y: number }[];
  readonly bandTop: number;
  readonly bandBottom: number;
  readonly last: { readonly x: number; readonly y: number };
}

/** Room above and below the highest and lowest of band and closes, so neither touches the edge. */
const CHART_PAD = 10;

/**
 * Where to draw a row's 20 closes and their band (AT12, round 8 Q4 B: "the 20 closes inside the
 * band"). One scale per row, from the lower of its band's floor and its lowest close to the higher
 * of its band's ceiling and its highest close, so a close outside the band is drawn outside it and
 * never clipped. Rows are not on a shared scale: each one shows its own range, as the small mark does.
 */
export function trailChart(row: SectorRow): TrailChart {
  const lo = Math.min(row.range.low, ...row.trail);
  const hi = Math.max(row.range.high, ...row.trail);
  const span = hi - lo;
  const y = (v: number): number =>
    span > 0 ? CHART_PAD + ((hi - v) / span) * (100 - 2 * CHART_PAD) : 50;
  const n = row.trail.length;
  const points = row.trail.map((v, i) => ({
    x: n > 1 ? (i / (n - 1)) * 100 : 50,
    y: y(v),
  }));
  return {
    points,
    bandTop: y(row.range.high),
    bandBottom: y(row.range.low),
    last: points.at(-1) ?? { x: 100, y: 50 },
  };
}
