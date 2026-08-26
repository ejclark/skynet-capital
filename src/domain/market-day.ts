/**
 * Market-day bucketing — the one place an instant becomes a trading day.
 *
 * A "day" that splits a session is a wrong number, so anything keyed by day (realized P/L by close
 * date, the equity history's day-over-day changes) resolves the calendar day in *market* time
 * rather than slicing a UTC string: a trade closed at 3:55pm ET belongs to that day, not the next.
 * Pure and total — no clock, no I/O, and an unparseable input degrades to its leading date
 * characters instead of throwing.
 */

/** The exchange wall clock every day key is measured against unless a caller says otherwise. */
export const MARKET_TIMEZONE = "America/New_York";

/** `YYYY-MM-DD` for `iso` in the given IANA timezone — lexically sortable, which day strips need. */
export function marketDayKey(iso: string, timezone: string = MARKET_TIMEZONE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  try {
    // en-CA renders ISO-shaped YYYY-MM-DD, which sorts lexically — the property the strip needs.
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
