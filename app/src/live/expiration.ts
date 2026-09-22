/**
 * `?exp=` — an option expiration as route state (#3407, Workbench slice 4a). The chain pane and
 * the ticket are two tools of one bench; the strike a member taps on one only means the contract
 * they saw if the expiration travels with it. ISO `YYYY-MM-DD` and nothing else: a hand-typed or
 * stale value that doesn't match is dropped, the same posture as `normalizeSymbol` / `normalizeStrike`.
 */
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function normalizeExpiration(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const candidate = raw.trim();
  return ISO_DATE.test(candidate) ? candidate : undefined;
}
