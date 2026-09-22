/**
 * URL-SAFE SYMBOL SHAPE (#2017 cockpit plan, red-team finding) — a narrow, defensive check so a
 * hand-typed or stale `?symbol=` in the URL can't render garbage into the ticket. The server's
 * `UNDERLYING_PATTERN` (`src/trading/option-symbols.ts`) stays the one authority on every API
 * call — this is not a second copy of that contract, only a client-side guard on what the route
 * state accepts before the gate ever sees it.
 */

const SYMBOL_SHAPE = /^[A-Z0-9.-]{1,12}(\/[A-Z0-9]{2,6})?$/;

/** Trims and uppercases a candidate symbol, returning `undefined` for anything not string-shaped
 *  or not matching the accepted shape — equities (including a class suffix like `BRK.B`) and
 *  Alpaca-style crypto pairs (`BTC/USD`). */
export function normalizeSymbol(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const candidate = raw.trim().toUpperCase();
  return SYMBOL_SHAPE.test(candidate) ? candidate : undefined;
}
