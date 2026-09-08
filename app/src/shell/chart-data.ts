import type { BusinessDay, CandlestickData, HistogramData, Time } from "lightweight-charts";
import type { Bar } from "../live/bars";

/**
 * The chart section's PURE half (#2017 Phase 1 chart build-out, the mount slice) — bars → the
 * shapes `lightweight-charts` draws, kept free of the DOM so it can be specced without mounting a
 * chart (`docs/ENGINEERING.md` → House gotchas: the library throws under happy-dom, so the
 * data-mapping layer is what the spec covers and the mount itself is a single deliberate smoke
 * test).
 *
 * Two doctrines ride along. `bars.ts`'s: a bar is what the server said, so nothing here rounds,
 * fills gaps or drops a day — the chart draws the feed verbatim. And `docs/BRAND.md`'s: the
 * up/down hue on a candle or a volume bar is SUPPLEMENTARY — the legend (`chart-section.tsx`)
 * carries the same fact as words, and `withAlpha` below only softens the volume band so candles
 * stay the primary mark, never encoding anything on its own.
 */

/** The two hues a series needs, resolved once per mount from `--pos` / `--neg` (`theme.css`). */
export interface ChartTone {
  readonly pos: string;
  readonly neg: string;
}

export interface BarsSeriesData {
  readonly candles: readonly CandlestickData[];
  readonly volume: readonly HistogramData[];
}

/** Daily bars carry a business day, never a timestamp — `t` is an ISO string whose first ten
 *  characters are the date, so `2026-09-04T00:00:00Z` and `2026-09-04` both draw on the same day. */
export const barTime = (t: string): string => t.slice(0, 10);

/** `#rrggbb` → `#rrggbb80` (50% alpha), the library's own `#RRGGBBAA` form. Anything that isn't a
 *  6-digit hex is handed back untouched rather than guessed at — a wrong alpha suffix on an `rgb()`
 *  string would fail the library's parser and take the whole chart down with it. */
export function withAlpha(color: string, alphaHex = "80"): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alphaHex}` : color;
}

/** A close at or above the open is an up day — the same convention every candlestick chart uses,
 *  and the one the volume band mirrors so the two marks never disagree about a day's direction. */
export const isUpBar = (bar: Bar): boolean => bar.c >= bar.o;

export function barsToSeriesData(bars: readonly Bar[], tone: ChartTone): BarsSeriesData {
  const up = withAlpha(tone.pos);
  const down = withAlpha(tone.neg);
  return {
    candles: bars.map((bar) => ({
      time: barTime(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    })),
    volume: bars.map((bar) => ({
      time: barTime(bar.t),
      value: bar.v,
      color: isUpBar(bar) ? up : down,
    })),
  };
}

/** The crosshair hands back whichever `Time` shape the data was set with — a `YYYY-MM-DD` string
 *  here, but the type admits a `BusinessDay` object or a UTC timestamp too, and all three fold to
 *  the same `YYYY-MM-DD` key so a legend lookup never depends on which one the library chose. */
export function timeKey(time: Time): string {
  if (typeof time === "string") return time;
  if (typeof time === "number") return new Date(time * 1000).toISOString().slice(0, 10);
  const { year, month, day } = time as BusinessDay;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Index bars by business day for the legend's crosshair lookup. */
export function indexBarsByDay(bars: readonly Bar[]): ReadonlyMap<string, Bar> {
  return new Map(bars.map((bar) => [barTime(bar.t), bar]));
}

/** `1234567` → `1.2M`, `845000` → `845K`, `950` → `950` — the compact volume readout every
 *  platform's legend uses. One decimal at M/B, none at K (a thousands digit is already precise
 *  enough, and `845.0K` reads as a rounding artifact). */
export function compactVolume(volume: number): string {
  const abs = Math.abs(volume);
  if (abs >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${Math.round(volume / 1e3)}K`;
  return String(Math.round(volume));
}
