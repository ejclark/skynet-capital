/**
 * Market-day bucketing — the one place an instant becomes a trading day.
 *
 * A "day" that splits a session is a wrong number, so anything keyed by day (realized P/L by close
 * date, the equity history's day-over-day changes) resolves the calendar day in *market* time
 * rather than slicing a UTC string: a trade closed at 3:55pm ET belongs to that day, not the next.
 * Pure and total — no clock, no I/O, and an unparseable input degrades to its leading date
 * characters instead of throwing.
 */

import { cachedDateTimeFormat } from "./intl-format.js";

/** The exchange wall clock every day key is measured against unless a caller says otherwise. */
export const MARKET_TIMEZONE = "America/New_York";

/**
 * `YYYY-MM-DD` for `iso` in the given IANA timezone — lexically sortable, which day strips need.
 *
 * The formatter is the shared cached one (`intl-format.ts`): building one per call held ~27 KB of
 * native memory per instant, and keying a desk's whole history that way OOM-killed the 512 MB
 * server (#4612 slice 1, #4613). A caller keying many instants in one zone takes `marketDayKeyer`.
 */
export function marketDayKey(iso: string, timezone: string = MARKET_TIMEZONE): string {
  return marketDayKeyer(timezone)(iso);
}

/**
 * `marketDayKey` bound to one zone — for a loop over a history (every 5-minute sample a desk ever
 * recorded, on each Pulse view): the shared formatter is resolved once, not once per instant. Same
 * answers and the same fallbacks: junk input keeps its leading date characters, and a zone the
 * runtime doesn't know degrades to the UTC date rather than throwing.
 */
export function marketDayKeyer(timezone: string = MARKET_TIMEZONE): (iso: string) => string {
  let format: ((at: number) => string) | undefined;
  try {
    // en-CA renders ISO-shaped YYYY-MM-DD, which sorts lexically — the property the strip needs.
    format = cachedDateTimeFormat("en-CA", { timeZone: timezone }).format;
  } catch {
    format = undefined;
  }
  // Epoch ms straight into the bound `format`: no Date per instant on a 60k-sample walk.
  return (iso) => {
    const at = Date.parse(iso);
    if (Number.isNaN(at)) return iso.slice(0, 10);
    return format ? format(at) : new Date(at).toISOString().slice(0, 10);
  };
}

/**
 * True when `iso` (an instant — a fill, "now") falls on the same market day as `dateOnly` (a plain
 * `YYYY-MM-DD`, e.g. an option's own expiration) — the one place "is this zero-DTE?" is answered,
 * shared by the ladder's earn derivation (#1671: a same-day option fill also earns 501) and the
 * server-side gate that refuses opening one while 501 is locked.
 */
export function isSameMarketDay(
  iso: string,
  dateOnly: string,
  timezone: string = MARKET_TIMEZONE,
): boolean {
  return marketDayKey(iso, timezone) === dateOnly;
}
