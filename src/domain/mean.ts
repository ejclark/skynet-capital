/**
 * The arithmetic mean, in one place (`dupe:scan`: four files each kept their own `mean`).
 *
 * An empty list has no mean, so this returns `NaN` rather than a made-up 0; callers that want a
 * different empty-case answer say so under their own name (`meanOrZero`, a rounded dollar mean)
 * instead of each redefining `mean` with a different meaning.
 */
export const mean = (xs: readonly number[]): number =>
  xs.reduce((sum, x) => sum + x, 0) / xs.length;

/** The mean, or 0 for an empty list — for a surface that renders a zero rather than a gap. */
export const meanOrZero = (xs: readonly number[]): number => (xs.length === 0 ? 0 : mean(xs));
