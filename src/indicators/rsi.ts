/**
 * RSI (Relative Strength Index) — momentum on a 0-100 scale, from the ratio of average up-moves to
 * average down-moves over a trailing window.
 *
 * Ported (not imported — see `index.ts`'s header) from the login-canvas market engine's `rsi(a,n)`
 * in `src/server/auth/authenticator.ts`, `n=14`. This is the source's SIMPLE windowed-average RSI,
 * not Wilder's smoothed RSI most real platforms use (a different, recursive formula) — preserved
 * exactly, on purpose, not silently upgraded: a "fix" here would make the ported version disagree
 * with the login canvas's own already-shipped RSI if the two are ever compared side by side. Over
 * the trailing `period`-length window, up-moves sum as `gains`, down-moves sum as positive
 * `losses`, then `rs = (gains/period) / (losses/period)` and `rsi = 100 - 100/(1+rs)`.
 *
 * The `losses <= 0 -> 100` case (no losses at all in the window) is preserved as-is: RSI
 * mathematically approaches 100 there, a real answer, not a fabricated one.
 *
 * DEVIATION FROM THE SOURCE — absence over a fabricated placeholder. The source falls back to a
 * neutral `50` when there isn't enough history yet (`if(a.length<n+1) return 50`) — harmless for a
 * cosmetic ambient animation where a plausible-looking number never has to be true, but this repo's
 * doctrine for anything analytical is that a confident value nobody actually computed never ships
 * (see `alpaca-options-client.ts`'s `greek()`/`barVolume()`, `earnings-chain-badge.ts`'s absence
 * rule). This port returns `undefined` instead, for every index where the window can't be filled.
 */

/**
 * @param values price series, oldest first.
 * @param period trailing window size. Default 14.
 * @returns one value per input index; `undefined` for indices `< period` (need `period` deltas,
 *   i.e. `period + 1` trailing prices, which the source's own `a.length < n+1` guard also required).
 */
export function rsi(values: readonly number[], period = 14): readonly (number | undefined)[] {
  const out: (number | undefined)[] = new Array(values.length);
  if (period < 1) return out.fill(undefined);

  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      out[i] = undefined;
      continue;
    }
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const delta = (values[j] as number) - (values[j - 1] as number);
      if (delta >= 0) gains += delta;
      else losses -= delta;
    }
    if (losses <= 0) {
      out[i] = 100;
      continue;
    }
    const rs = gains / period / (losses / period);
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

/** How to read it, in the house's plain-language, no-hype voice. */
export const RSI_GLOSS =
  "momentum on a 0-100 scale — traditionally read overbought above 70, oversold below 30, but it can stay extreme through a strong trend.";
