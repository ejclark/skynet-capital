/**
 * Simple moving average — the plain average price over a trailing window.
 *
 * Ported (not imported — see `index.ts`'s header) from the login-canvas market engine's `avg(win)`
 * in `src/server/auth/authenticator.ts`, reshaped from a single running value into a full-series
 * batch function. `undefined` wherever the trailing window isn't full yet — never a fabricated
 * placeholder (see `index.ts`).
 */

/**
 * @param values price series, oldest first.
 * @param period trailing window size. Default 20 (the source's own Bollinger-middle window).
 * @returns one value per input index; `undefined` for indices `< period - 1`, where the window
 *   doesn't have `period` prices behind it yet.
 */
export function sma(values: readonly number[], period = 20): readonly (number | undefined)[] {
  const out: (number | undefined)[] = new Array(values.length);
  if (period < 1) return out.fill(undefined);

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] as number;
    if (i >= period) sum -= values[i - period] as number;
    out[i] = i >= period - 1 ? sum / period : undefined;
  }
  return out;
}

/** How to read it, in the house's plain-language, no-hype voice. */
export const SMA_GLOSS =
  "the average price over the window — a slower, smoother read on trend than the raw price.";
