import type { AlpacaAccount } from "../alpaca/alpaca-trading-client.js";

/**
 * Seeds the daily-loss breaker's baseline from Alpaca's own record of the day's opening equity,
 * instead of "whatever the first `recordEquity` call happens to read" — the source of a real gap
 * (2026-08-26/27): `SafetyController` is constructed fresh on every process boot, so a mid-day
 * restart quietly re-anchors the breaker to that moment's equity, forgiving the day's drawdown so
 * far. Alpaca's account payload reports `last_equity` (equity as of the previous trading day's
 * close) independent of restarts — the correct reference point survives them.
 *
 * Pure parsing only; the impure read lives in the wiring script (`run-autonomous.ts`), which
 * already owns every other Alpaca client construction.
 */

/** `account.last_equity` as a finite number, or `null` if absent/malformed — never throws. */
export function parseDayOpenEquity(account: AlpacaAccount): number | null {
  const raw = account.last_equity;
  // `Number("")` coerces to 0, not NaN — an empty/whitespace string must fail explicitly, or a
  // malformed payload could seed the breaker with a false $0 baseline instead of falling back.
  if (raw === undefined || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Sum per-bot day-open equities into the fleet total `SafetyController.seedBaseline` expects —
 * mirrors `fleetEquity`'s shared-baseline shape in `equity-watch.ts`. `null` entries (a read that
 * failed or came back unparseable) drop the WHOLE seed rather than silently undercounting the
 * fleet: a partial baseline is a wrong baseline, and the safe direction is to fall back to the
 * existing first-reading behavior instead of arming the breaker on an understated number.
 */
export function fleetDayOpenEquity(perBot: readonly (number | null)[]): number | null {
  if (perBot.length === 0) return null;
  let sum = 0;
  for (const value of perBot) {
    if (value === null) return null;
    sum += value;
  }
  return sum;
}
