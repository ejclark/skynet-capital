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
 * Uses the shared formatter (`intl-format.ts`); a loop over many instants takes `marketDayKeyer`.
 */
export function marketDayKey(iso: string, timezone: string = MARKET_TIMEZONE): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return iso.slice(0, 10);
  const format = dayFormat(timezone);
  return format ? format(at) : utcDay(at);
}

/** The zone's shared `YYYY-MM-DD` formatter, or undefined for a zone the runtime doesn't know. */
function dayFormat(timezone: string): ((at: number) => string) | undefined {
  try {
    // en-CA renders ISO-shaped YYYY-MM-DD, which sorts lexically — the property the strip needs.
    return cachedDateTimeFormat("en-CA", { timeZone: timezone }).format;
  } catch {
    return undefined;
  }
}

const utcDay = (at: number): string => new Date(at).toISOString().slice(0, 10);

const HOUR_MS = 3_600_000;
/** The largest epoch ms a Date can hold; an hour's end past it would make `format` throw. */
const MAX_DATE_MS = 8.64e15;
/** `Date.prototype.toISOString()`'s shape for years 0000–9999 — what every stored sample carries. */
const CANONICAL = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z$/;

/**
 * `marketDayKey` bound to one zone, for a walk over a history in time order. Same answers and the
 * same fallbacks: junk input keeps its leading date characters, and a zone the runtime doesn't
 * know degrades to the UTC date rather than throwing.
 *
 * Formatting is the walk's cost — at 180 days a desk holds ~60k five-minute samples and one Pulse
 * request spent ~60% of its compute here (#4612 slice 7). So when a second instant lands later in
 * the same UTC hour as the last one formatted, the keyer formats that hour's last millisecond once:
 * if it falls on the same day, every instant between them does too, and the rest of the hour reuses
 * the key — two calls an hour instead of twelve, and never more than one per instant for sparse
 * input. That holds unless a zone moves its clock back across midnight and forward past it again
 * inside one hour, which no zone's rules do. Input out of time order still answers correctly; it
 * just reuses less. Inside a checked hour a stored `toISOString()` instant is recognised by its
 * text — same hour prefix, not earlier — so the walk skips even `Date.parse` (~10 ms at 60k).
 */
export function marketDayKeyer(timezone: string = MARKET_TIMEZONE): (iso: string) => string {
  const format = dayFormat(timezone);
  // The last instant formatted, its day, and the end of its UTC hour.
  let last = Number.NaN;
  let lastKey = "";
  let hourEnd = Number.NaN;
  // Once checked: through `hourEnd`, every instant from `last` on is on `lastKey`.
  let checked = false;
  // `last` as canonical `toISOString()` text and its UTC hour prefix, or "" in any other shape.
  let lastIso = "";
  let lastHour = "";
  return (iso) => {
    // Same-length canonical UTC text orders lexically, and its first 13 characters are the hour.
    if (checked && lastIso && iso >= lastIso && iso.startsWith(lastHour) && CANONICAL.test(iso))
      return lastKey;
    const at = Date.parse(iso);
    if (Number.isNaN(at)) return iso.slice(0, 10);
    if (!format) return utcDay(at);
    if (at >= last && at <= hourEnd) {
      if (checked) return lastKey;
      checked = true;
      if (format(hourEnd) === lastKey) return lastKey;
      hourEnd = Number.NaN;
    }
    last = at;
    lastIso = CANONICAL.test(iso) ? iso : "";
    lastHour = lastIso.slice(0, 13);
    lastKey = format(at);
    const end = (Math.floor(at / HOUR_MS) + 1) * HOUR_MS - 1;
    hourEnd = end <= MAX_DATE_MS ? end : Number.NaN;
    checked = false;
    return lastKey;
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
