/**
 * Exponential moving average — like SMA, but each new price gets more weight than the ones before
 * it, so it tracks a fresh move faster.
 *
 * Ported (not imported — see `index.ts`'s header) from the login-canvas market engine's incremental
 * `pf + kf*(np - pf)` update in `src/server/auth/authenticator.ts`, where `kf = 2/(N+1)` is the
 * standard smoothing factor. The source hardcodes two EMAs inline (`kf=2/10` → N=9 "fast",
 * `ks=2/22` → N=21 "slow"); this is one parameterized function instead — a future caller runs it
 * twice, with 9 and 21, to get the same pair.
 *
 * DEVIATION FROM THE SOURCE — EMA seeding. The source seeds its very first EMA value with the raw
 * first price (`pf=emaF.length?emaF[...]:np`), a reasonable shortcut for an ambient animation that
 * starts from nothing. A real chart already has the full history up front, so this port seeds the
 * EMA at index `period - 1` with the SMA of the first `period` values instead — the standard,
 * textbook EMA-seeding convention, and a more accurate first value than an unweighted single price.
 */
export function ema(values: readonly number[], period: number): readonly (number | undefined)[] {
  const out: (number | undefined)[] = new Array(values.length);
  if (period < 1) return out.fill(undefined);

  const k = 2 / (period + 1);
  let prev: number | undefined;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out[i] = undefined;
      continue;
    }
    if (i === period - 1) {
      // Seed: the SMA of the first `period` values (see the deviation note above).
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += values[j] as number;
      prev = sum / period;
      out[i] = prev;
      continue;
    }
    const next = (prev as number) + k * ((values[i] as number) - (prev as number));
    out[i] = next;
    prev = next;
  }
  return out;
}

/** How to read it, in the house's plain-language, no-hype voice. */
export const EMA_GLOSS =
  "like SMA but weights recent prices more — reacts faster to a new move, at the cost of more noise.";
