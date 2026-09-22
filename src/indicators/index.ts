/**
 * Technical indicators — SMA, EMA, Bollinger Bands, RSI — for the `/trade` cockpit's analytical
 * chart (#2017 Phase 1 chart section, the extraction slice).
 *
 * PORTED, NOT IMPORTED. This math already exists, working, inline inside
 * `src/server/auth/authenticator.ts`'s login-canvas ambient market engine (`avg`/`sd`/`rsi` and the
 * `pushPrice` EMA/Bollinger update, ~line 893). That block is client JS served to the browser as a
 * TypeScript template-literal *string*, not real TypeScript — it cannot be imported as a module, and
 * this repo's own "no backticks or `${}` inside that block, ever" gotcha
 * (`docs/ENGINEERING.md` -> House gotchas) means it must never be edited in passing either. Every
 * function here is a faithful re-typed, re-shaped PORT of that source's formulas, not a copy-paste
 * and not a redesign: same math, same parameters, reshaped from the source's incremental
 * single-point update (built for a live streaming tick) into a batch/series function (a real chart
 * works off a full historical bar array, computed once).
 *
 * TWO DELIBERATE, DOCUMENTED DEVIATIONS FROM THE SOURCE — everything else matches exactly:
 *
 * 1. Absence over a fabricated placeholder. The source's `rsi()` returns a fabricated neutral `50`
 *    when there isn't enough history yet — fine for a cosmetic animation, not for anything
 *    analytical (this repo's standing doctrine — see `alpaca-options-client.ts`'s
 *    `greek()`/`barVolume()`, `earnings-chain-badge.ts`'s absence rule). Every function here returns
 *    `undefined` instead, for any index where the trailing window genuinely isn't full yet. See each
 *    function's own doc comment for specifics.
 * 2. EMA seeded with the initial SMA, not the raw first price. The source seeds its very first EMA
 *    value with the first price it happens to see, because the ambient animation starts from
 *    nothing. A real chart has full history up front, so `ema()` seeds at `period - 1` with the SMA
 *    of the first `period` values instead — the standard, textbook convention. See `ema.ts`.
 */

import { BOLLINGER_GLOSS, type BollingerBand, bollingerBands } from "./bollinger.js";
import { EMA_GLOSS, ema } from "./ema.js";
import { RSI_GLOSS, rsi } from "./rsi.js";
import { SMA_GLOSS, sma } from "./sma.js";

export {
  BOLLINGER_GLOSS,
  type BollingerBand,
  bollingerBands,
  EMA_GLOSS,
  ema,
  RSI_GLOSS,
  rsi,
  SMA_GLOSS,
  sma,
};

/** All four "how to read this" lines in one place, keyed by indicator name. */
export const INDICATOR_GLOSS = {
  sma: SMA_GLOSS,
  ema: EMA_GLOSS,
  bollinger: BOLLINGER_GLOSS,
  rsi: RSI_GLOSS,
} as const;
