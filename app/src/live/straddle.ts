import type { ChainRow } from "./options";

/**
 * THE STRADDLE VIEW'S ARITHMETIC (#1481, slice 1) — pure, so the table stays dumb and this stays
 * testable. A straddle view is one expiration's chain with the strike down the centre, calls to
 * the left and puts to the right (Eric, 2026-09-05: "the base view centralizes strike price with
 * premiums for short/long call on the left and the short/long puts on right"). Everything here is
 * shape — which rows, where the current-price divider goes, what's in the money — and nothing
 * here is a price: bid, ask and spot arrive from the server and are drawn verbatim.
 */

export interface StraddleRow {
  readonly strike: number;
  readonly call?: ChainRow;
  readonly put?: ChainRow;
}

/** Union both sides by strike, ascending. A strike listed on one side only keeps its other cell empty. */
export function mergeStraddle(
  calls: readonly ChainRow[],
  puts: readonly ChainRow[],
): StraddleRow[] {
  const byStrike = new Map<number, { call?: ChainRow; put?: ChainRow }>();
  for (const call of calls) byStrike.set(call.strike, { ...byStrike.get(call.strike), call });
  for (const put of puts) byStrike.set(put.strike, { ...byStrike.get(put.strike), put });
  return [...byStrike.entries()]
    .sort(([a], [b]) => a - b)
    .map(([strike, sides]) => ({ strike, ...sides }));
}

/**
 * Where the "Current price" divider sits: the number of rows at or below spot, i.e. the index the
 * divider is drawn BEFORE. Undefined when there is no spot to split on — the table then has no
 * divider rather than a guessed one.
 */
export function dividerIndex(
  rows: readonly StraddleRow[],
  spot: number | undefined,
): number | undefined {
  if (spot === undefined || !Number.isFinite(spot)) return undefined;
  return rows.filter((row) => row.strike <= spot).length;
}

/**
 * The phone window: `radius` strikes either side of the divider (#1481's open question, default
 * ±8). A chain that already fits is returned whole; `hidden` says how many rows a "show all" would
 * add back. With no spot there is no divider, so the window centres on the middle of the listed
 * strikes instead and `centred` says so (#3407 P0; a no-spot chain used to render every strike —
 * a 200-row wall at 390px with no "show all" and no way to find the money).
 */
export function windowRows(
  rows: readonly StraddleRow[],
  spot: number | undefined,
  radius = 8,
): {
  readonly rows: readonly StraddleRow[];
  readonly hidden: number;
  readonly centred: "spot" | "middle";
} {
  const split = dividerIndex(rows, spot);
  const centred = split === undefined ? "middle" : "spot";
  if (rows.length <= radius * 2) return { rows, hidden: 0, centred };
  const centre = split ?? Math.floor(rows.length / 2);
  const start = Math.max(0, Math.min(centre - radius, rows.length - radius * 2));
  const kept = rows.slice(start, start + radius * 2);
  return { rows: kept, hidden: rows.length - kept.length, centred };
}

/** Calendar days from `now`'s date to the expiration date (`YYYY-MM-DD`), never negative. */
export function daysToExpiry(expiration: string, now: Date): number {
  const [y, m, d] = expiration.split("-").map(Number);
  if (!(y && m && d)) return 0;
  const exp = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((exp - today) / 86_400_000));
}

/** "Expires today" · "Expires in 1 day" · "Expires in N days" — the theta lesson in one line. */
export function expiresIn(days: number): string {
  if (days <= 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

/** "Sep 23, 2026" — month/day lead, year trails (Eric, 2026-09-22: "users care about the month
 *  and day in this context... the only time users care about the year is long leaps at which
 *  point they've already scrolled to the year they want and proceed to look at the month/day").
 *  ISO's year-first order optimizes for lexicographic sort, not how a member scans a pick list.
 *  Invalid input passes through unchanged rather than printing a fabricated date. */
export function formatExpiration(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!(y && m && d)) return iso;
  const month = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${month} ${d}, ${y}`;
}

/** In the money: a call below spot, a put above it. Neither without a spot. */
export function inTheMoney(
  strike: number,
  spot: number | undefined,
  side: "call" | "put",
): boolean {
  if (spot === undefined) return false;
  return side === "call" ? strike < spot : strike > spot;
}
