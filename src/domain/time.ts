/**
 * Shared time constants — one definition of a day in milliseconds, imported by every layer that
 * does date arithmetic instead of each file pasting its own copy (`dupe:scan`, DAY_MS had 14).
 *
 * A plain 24-hour day: UTC-anchored callers (`Date.parse("…T00:00:00Z")` differences) are exact;
 * callers that need wall-clock/DST-aware days must use the market calendar instead.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
