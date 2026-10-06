/**
 * The numeric primitives every projection and render-profile needs. One owner, imported everywhere —
 * these were previously re-declared per module, which the duplication gate correctly flagged.
 */

/** Constrain `v` to [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Constrain `v` to [0, 1] — the normalized range most of the world model speaks in. */
export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/** Linear interpolation from `a` to `b` at `t` (unclamped: callers clamp when they mean to). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/*
 * The extremes of a series of any length. `Math.min(...values)` passes every value as a separate
 * argument, and V8 throws RangeError past ~121k of them — on a series that grows with stored
 * history (one value per equity sample, one per audited cycle) that is a 500 or a failed boot
 * waiting for the ledger to get long enough (#4612 slice 3, #4615). Folding through Math.min /
 * Math.max keeps their answers exactly: ±Infinity for an empty series, NaN if any value is NaN.
 */

/** The smallest value; `Infinity` when there are none. */
export function minOf(values: Iterable<number>): number {
  let low = Number.POSITIVE_INFINITY;
  for (const v of values) low = Math.min(low, v);
  return low;
}

/** The largest value; `-Infinity` when there are none. */
export function maxOf(values: Iterable<number>): number {
  let high = Number.NEGATIVE_INFINITY;
  for (const v of values) high = Math.max(high, v);
  return high;
}
