/**
 * Seeded RNG — the reason the fortress looks hewn rather than machined, and looks the SAME every
 * time. Determinism is load-bearing here: screenshot verification only catches real visual
 * regressions if the geometry doesn't reshuffle between runs.
 *
 * Pure math, no Babylon — unit-testable without a browser.
 */

/** A deterministic 0..1 source. Same seed ⇒ same sequence, forever. */
export interface Rng {
  /** Next value in [0, 1). */
  next(): number;
  /** Symmetric jitter in [-amount/2, +amount/2). */
  jitter(amount: number): number;
  /** Value in [min, max). */
  range(min: number, max: number): number;
  /** True with probability `p` (0..1). */
  chance(p: number): boolean;
}

/** The classic Numerical-Recipes LCG constants — cheap, adequate for visual jitter. */
const MULTIPLIER = 1_664_525;
const INCREMENT = 1_013_904_223;
const MASK = 0x7fffffff;

/**
 * Build a deterministic RNG. The default seed (1337) reproduces the original spike's fortress, so a
 * port can be verified by screenshot parity.
 */
export function createRng(seed = 1337): Rng {
  let state = Math.trunc(seed) & MASK;
  const next = (): number => {
    state = (state * MULTIPLIER + INCREMENT) & MASK;
    return state / MASK;
  };
  return {
    next,
    jitter: (amount) => (next() - 0.5) * amount,
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
  };
}
