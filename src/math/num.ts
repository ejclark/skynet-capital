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
