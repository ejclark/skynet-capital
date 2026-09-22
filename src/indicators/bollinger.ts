/**
 * Bollinger Bands — a moving-average middle band with upper/lower bands offset by a multiple of
 * the trailing standard deviation, i.e. the price's normal recent range.
 *
 * Ported (not imported — see `index.ts`'s header) from the login-canvas market engine's
 * `smaA`/`bU`/`bL` in `src/server/auth/authenticator.ts`: a 20-period SMA as the middle band,
 * upper/lower at +/-2 standard deviations. Standard parameters (20, 2) are this function's own
 * defaults, not hardcoded — a caller can override either.
 *
 * POPULATION STDDEV, ON PURPOSE. The source's `sd(a,m)` divides by `a.length` (population), not
 * `a.length - 1` (sample) — preserved exactly here. Confirm before ever "fixing" this: it would
 * silently disagree with the source and every existing usage this port is meant to match.
 */

export interface BollingerBand {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
}

/**
 * @param values price series, oldest first.
 * @param period trailing window size for the middle SMA and the stddev. Default 20.
 * @param stdDevMultiplier how many standard deviations the upper/lower bands sit from the middle.
 *   Default 2.
 * @returns one band (or `undefined`) per input index; `undefined` for indices `< period - 1`.
 */
export function bollingerBands(
  values: readonly number[],
  period = 20,
  stdDevMultiplier = 2,
): readonly (BollingerBand | undefined)[] {
  const out: (BollingerBand | undefined)[] = new Array(values.length);
  if (period < 1) return out.fill(undefined);

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out[i] = undefined;
      continue;
    }
    const start = i - period + 1;
    let sum = 0;
    for (let j = start; j <= i; j++) sum += values[j] as number;
    const middle = sum / period;

    let variance = 0;
    for (let j = start; j <= i; j++) {
      const d = (values[j] as number) - middle;
      variance += d * d;
    }
    // Population standard deviation — see the header note above.
    const stdDev = Math.sqrt(variance / period);

    out[i] = {
      middle,
      upper: middle + stdDevMultiplier * stdDev,
      lower: middle - stdDevMultiplier * stdDev,
    };
  }
  return out;
}

/** How to read it, in the house's plain-language, no-hype voice. */
export const BOLLINGER_GLOSS =
  "the price's normal recent range — a squeeze often precedes a big move; a tag of the band isn't automatically a reversal.";
