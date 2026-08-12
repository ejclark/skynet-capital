/**
 * The timezone options `/add` offers, and the only values the server accepts. Previously a free
 * text input — nothing stopped a typo ("Amercia/Chicago") or a non-IANA string from being stored
 * and silently failing to format anywhere it's used (`toLocaleString`/`Intl.DateTimeFormat`
 * swallow an invalid zone rather than throwing, so a bad value would sit unnoticed). A controlled
 * field prevents the bad data from ever landing rather than trying to catch it after the fact.
 *
 * Scoped to the continental US zones this group actually lives in, plus UTC as the neutral
 * fallback — not the full ~400-zone IANA database, which would turn a two-second choice into a
 * search. Add a zone here when someone outside this list joins.
 */
export interface TimezoneOption {
  readonly value: string;
  readonly label: string;
}

export const ALLOWED_TIMEZONES: readonly TimezoneOption[] = [
  { value: "America/New_York", label: "Eastern — America/New_York" },
  { value: "America/Chicago", label: "Central — America/Chicago" },
  { value: "America/Denver", label: "Mountain — America/Denver" },
  { value: "America/Phoenix", label: "Mountain, no DST — America/Phoenix" },
  { value: "America/Los_Angeles", label: "Pacific — America/Los_Angeles" },
  { value: "America/Anchorage", label: "Alaska — America/Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii — Pacific/Honolulu" },
  { value: "UTC", label: "UTC" },
];

const VALID = new Set(ALLOWED_TIMEZONES.map((t) => t.value));

/** True only for a value from the controlled list — the server-side half of the guard. */
export function isAllowedTimezone(value: string): boolean {
  return VALID.has(value);
}
