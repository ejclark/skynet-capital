import type { IvSample } from "./iv-record.js";

/**
 * IV RANK AND IV PERCENTILE — the pure reducer over an underlying's recorded IV history.
 *
 * They are DIFFERENT NUMBERS and both are expected; conflating them is the classic desk error.
 *
 *   - **IV rank** answers "where in the last year's RANGE does today sit?" — `(iv − low) /
 *     (high − low)`, over the trailing 52 weeks. It is a two-point statistic: a single spike a year
 *     ago sets the high and compresses every reading since.
 *   - **IV percentile** answers "what SHARE of history was cheaper than today?" — the share of
 *     recorded samples strictly below the current one, over the full recorded distribution. It is
 *     insensitive to a lone spike, which is exactly why a desk reads it next to the rank rather
 *     than instead of it.
 *
 * A name can print rank 20 and percentile 80 at the same instant (a compressed year punctuated by
 * one violent spike), and that disagreement is signal — so this module never collapses them.
 *
 * PURE: no I/O, no clock. The caller supplies `nowIso`.
 *
 * ABSENCE IS A FIRST-CLASS ANSWER. Every honesty guard below returns an `absent` metric with a
 * NAMED reason rather than a number, because the failure mode this instrument exists to avoid is a
 * confident-looking rank computed off history that cannot support it. A member who sees "IV rank
 * 12 — premium is cheap" and sells a strangle has been told something by this number; it had
 * better be true.
 */

/** IV rank's window: 52 weeks, the desk convention. */
export const IV_WINDOW_DAYS = 365;

/**
 * The longest silence tolerated inside the window before the metrics go ABSENT. A month is the
 * honest ceiling for a series meant to be sampled daily: a bigger hole means the "52-week high" is
 * really "the high of whatever we happened to record", and nothing here can tell the difference.
 */
export const MAX_SAMPLE_GAP_DAYS = 31;

/** Calendar days → milliseconds. A conversion, not a re-declared constant (the dupe gate's point). */
const daysToMs = (days: number): number => days * 24 * 60 * 60 * 1000;

/** Why a metric has no honest value. Named, so a renderer can say which — never just a blank. */
export type IvAbsence =
  /** History doesn't reach back a full window; a partial-window rank would understate the range. */
  | "short-history"
  /** The window has a hole (or the instrument went stale) wider than `MAX_SAMPLE_GAP_DAYS`. */
  | "gapped-history"
  /** Every reading is identical: `(iv − low) / (high − low)` is 0/0, and 0 or 50 would be invented. */
  | "flat-range";

export type IvMetric =
  | { readonly kind: "value"; readonly value: number }
  | { readonly kind: "absent"; readonly reason: IvAbsence };

export interface IvReading {
  readonly symbol: string;
  /** The timestamp of the sample this reading is OF — not `nowIso`. A reader can see it age. */
  readonly at: string;
  /** Latest recorded at-the-money IV, annualized decimal. Always present: a reading needs a sample. */
  readonly currentIv: number;
  /** 0–100. Where `currentIv` sits in the trailing 52-week range. */
  readonly rank: IvMetric;
  /** 0–100. Share of the full recorded distribution strictly below `currentIv`. */
  readonly percentile: IvMetric;
  /** The 52-week low/high the rank was measured against — absent whenever the rank is. */
  readonly windowLow?: number;
  readonly windowHigh?: number;
}

const absent = (reason: IvAbsence): IvMetric => ({ kind: "absent", reason });
const measured = (value: number): IvMetric => ({ kind: "value", value });

const byTime = (samples: readonly IvSample[]): IvSample[] =>
  [...samples].sort((a, b) => a.at.localeCompare(b.at));

/**
 * The window has no silence wider than `MAX_SAMPLE_GAP_DAYS` — checked from the window's OPENING
 * edge through to `now`, not just between samples. That is what makes a stale instrument (sampled
 * faithfully for eleven months, then stopped) fail this test rather than pass it on the strength of
 * its own dense past.
 */
function isContinuous(
  inWindow: readonly IvSample[],
  windowStartMs: number,
  nowMs: number,
): boolean {
  const maxGap = daysToMs(MAX_SAMPLE_GAP_DAYS);
  let previous = windowStartMs;
  for (const sample of inWindow) {
    const at = Date.parse(sample.at);
    if (at - previous > maxGap) return false;
    previous = at;
  }
  return nowMs - previous <= maxGap;
}

/**
 * Whether the recorded history can support a windowed metric at all: it must reach back past the
 * window's start AND cover it without a hole. Returns the named reason it can't, or `undefined`.
 */
function windowFailure(
  sorted: readonly IvSample[],
  inWindow: readonly IvSample[],
  windowStartMs: number,
  nowMs: number,
): IvAbsence | undefined {
  const earliest = sorted[0];
  if (!earliest || Date.parse(earliest.at) > windowStartMs) return "short-history";
  return isContinuous(inWindow, windowStartMs, nowMs) ? undefined : "gapped-history";
}

/** Extremes of a non-empty series. */
function extremes(samples: readonly IvSample[]): { low: number; high: number } | undefined {
  const values = samples.map((s) => s.atmIv);
  if (values.length === 0) return undefined;
  return { low: Math.min(...values), high: Math.max(...values) };
}

/**
 * One underlying's reading as of `nowIso`. `undefined` when the symbol has no sample at or before
 * `nowIso` at all — there is no current IV to report, so there is no reading, not a zeroed one.
 */
export function ivReading(
  symbol: string,
  samples: readonly IvSample[],
  nowIso: string,
): IvReading | undefined {
  const nowMs = Date.parse(nowIso);
  const sorted = byTime(samples.filter((s) => s.symbol === symbol && Date.parse(s.at) <= nowMs));
  const current = sorted[sorted.length - 1];
  if (!current) return undefined;

  const windowStartMs = nowMs - daysToMs(IV_WINDOW_DAYS);
  const inWindow = sorted.filter((s) => Date.parse(s.at) >= windowStartMs);
  const failure = windowFailure(sorted, inWindow, windowStartMs, nowMs);
  const base = { symbol, at: current.at, currentIv: current.atmIv };
  if (failure) return { ...base, rank: absent(failure), percentile: absent(failure) };

  const band = extremes(inWindow);
  const spread = band ? band.high - band.low : 0;
  const rank =
    band && spread > 0
      ? measured((100 * (current.atmIv - band.low)) / spread)
      : absent("flat-range");

  // Percentile reads the FULL recorded distribution (the issue's definition), not just the window —
  // three years of history is three years of context, and throwing two of them away to match the
  // rank's window would make the two numbers say the same thing twice.
  const below = sorted.filter((s) => s.atmIv < current.atmIv).length;
  const allBand = extremes(sorted);
  const percentile =
    allBand && allBand.high > allBand.low
      ? measured((100 * below) / sorted.length)
      : absent("flat-range");

  return rank.kind === "value" && band
    ? { ...base, rank, percentile, windowLow: band.low, windowHigh: band.high }
    : { ...base, rank, percentile };
}

/**
 * A reading per underlying present in `samples`, sorted by symbol so a board renders in a stable
 * order. Symbols with nothing recorded at or before `nowIso` are omitted — absent, not zeroed.
 */
export function ivReadings(samples: readonly IvSample[], nowIso: string): readonly IvReading[] {
  const symbols = [...new Set(samples.map((s) => s.symbol))].sort();
  const readings: IvReading[] = [];
  for (const symbol of symbols) {
    const reading = ivReading(symbol, samples, nowIso);
    if (reading) readings.push(reading);
  }
  return readings;
}
