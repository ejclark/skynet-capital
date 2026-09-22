import type { LineData } from "lightweight-charts";
import {
  type BollingerBand,
  bollingerBands,
  ema,
  INDICATOR_GLOSS,
  rsi,
  sma,
} from "../../../src/indicators/index";
import type { Bar } from "../live/bars";
import { barTime } from "./chart-data";

/**
 * The canned studies' PURE half (#2017 Phase 1 chart build-out, the studies slice) — bars → the
 * four `src/indicators/` series, the sparse line points `lightweight-charts` draws for each, and
 * the day-keyed lookup the legend reads. DOM-free for the same reason `chart-data.ts` is: the
 * library throws under happy-dom (`docs/ENGINEERING.md` → House gotchas), so this is the layer the
 * spec covers and the mount stays one deliberate smoke test.
 *
 * The math is `src/indicators/`'s, untouched — every function there hands back `undefined` for an
 * index whose trailing window isn't full yet, and this layer keeps that absence honest twice
 * over: a line series gets NO point for such a day (a sparse array, never a null/NaN placeholder),
 * and the legend prints `—` for it rather than a number nobody computed.
 */

export type StudyId = "sma" | "ema" | "bollinger" | "rsi";

export const STUDY_IDS: readonly StudyId[] = ["sma", "ema", "bollinger", "rsi"];

export const STUDY_LABELS: Readonly<Record<StudyId, string>> = {
  sma: "SMA",
  ema: "EMA",
  bollinger: "Bollinger",
  rsi: "RSI",
};

/** The one-line "how to read this" copy, verbatim from `src/indicators/`. */
export const STUDY_GLOSS: Readonly<Record<StudyId, string>> = INDICATOR_GLOSS;

/** SMA, Bollinger and RSI ride their ports' own defaults (20 / 20,2 / 14). `ema()` has no default
 *  — the source engine hardcodes a 9 (fast) and a 21 (slow) — and the chart takes the FAST one: a
 *  9-EMA over a 20-SMA is the textbook pairing, and the gap between them is what makes the EMA
 *  gloss ("reacts faster") legible on the frame instead of two lines drawn on top of each other. */
export const EMA_PERIOD = 9;

export interface StudySeries {
  readonly sma: readonly (number | undefined)[];
  readonly ema: readonly (number | undefined)[];
  readonly bollinger: readonly (BollingerBand | undefined)[];
  readonly rsi: readonly (number | undefined)[];
}

/** All four studies at once, one entry per bar in `bars`' own order — cheap enough that computing
 *  the inactive ones too beats a lazy-on-toggle cache (`chart-section.tsx` memoises on `bars`). */
export function computeStudies(bars: readonly Bar[]): StudySeries {
  const closes = bars.map((bar) => bar.c);
  return {
    sma: sma(closes),
    ema: ema(closes, EMA_PERIOD),
    bollinger: bollingerBands(closes),
    rsi: rsi(closes),
  };
}

/** Bars + a same-length value series → the points a line series draws, SKIPPING every index whose
 *  value is `undefined`. The library takes a sparse array — only the days that have a value — and a
 *  placeholder point would either draw a fabricated level or fail its parser. */
export function linePoints(
  bars: readonly Bar[],
  values: readonly (number | undefined)[],
): readonly LineData[] {
  const out: LineData[] = [];
  bars.forEach((bar, i) => {
    const value = values[i];
    if (value !== undefined) out.push({ time: barTime(bar.t), value });
  });
  return out;
}

export interface BollingerPoints {
  readonly upper: readonly LineData[];
  readonly middle: readonly LineData[];
  readonly lower: readonly LineData[];
}

/** The three Bollinger lines, each sparse on the same rule as `linePoints`. */
export function bollingerPoints(
  bars: readonly Bar[],
  bands: readonly (BollingerBand | undefined)[],
): BollingerPoints {
  return {
    upper: linePoints(
      bars,
      bands.map((b) => b?.upper),
    ),
    middle: linePoints(
      bars,
      bands.map((b) => b?.middle),
    ),
    lower: linePoints(
      bars,
      bands.map((b) => b?.lower),
    ),
  };
}

/** Every study's value on one day — each `undefined` where that study's window wasn't full. */
export interface StudyReading {
  readonly sma: number | undefined;
  readonly ema: number | undefined;
  readonly bollinger: BollingerBand | undefined;
  readonly rsi: number | undefined;
}

/** Index the readings by business day, the same `YYYY-MM-DD` key `indexBarsByDay` uses, so the
 *  legend finds "this study on this day" from the bar the crosshair already resolved. */
export function indexStudiesByDay(
  bars: readonly Bar[],
  studies: StudySeries,
): ReadonlyMap<string, StudyReading> {
  return new Map(
    bars.map((bar, i) => [
      barTime(bar.t),
      {
        sma: studies.sma[i],
        ema: studies.ema[i],
        bollinger: studies.bollinger[i],
        rsi: studies.rsi[i],
      },
    ]),
  );
}

const ABSENT = "—";
const price = (value: number): string => value.toFixed(2);

/** The legend cell for one study on one day: `181.20`, `58.3` for RSI (a 0-100 momentum reading
 *  never needs cents), `183.10 / 181.00 / 178.90` (upper / middle / lower) for Bollinger — and `—`
 *  wherever the reading is absent, never a fabricated number and never a dropped cell. */
export function studyCell(id: StudyId, reading: StudyReading | undefined): string {
  if (reading === undefined) return ABSENT;
  switch (id) {
    case "sma":
      return reading.sma === undefined ? ABSENT : price(reading.sma);
    case "ema":
      return reading.ema === undefined ? ABSENT : price(reading.ema);
    case "rsi":
      return reading.rsi === undefined ? ABSENT : reading.rsi.toFixed(1);
    case "bollinger": {
      const band = reading.bollinger;
      return band === undefined
        ? ABSENT
        : `${price(band.upper)} / ${price(band.middle)} / ${price(band.lower)}`;
    }
  }
}

/** Toggle one study's membership, handing back a NEW set — React state, so identity is the
 *  change signal the chart's effect re-mounts on. */
export function toggleStudy(active: ReadonlySet<StudyId>, id: StudyId): ReadonlySet<StudyId> {
  const next = new Set(active);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
