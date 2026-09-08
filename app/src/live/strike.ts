/**
 * URL-SAFE STRIKE SHAPE (#2017 Phase 0 task 4e) — mirrors `symbol.ts` one-for-one: a narrow,
 * defensive check so a hand-typed or stale `?strike=` in the URL can't render garbage into the
 * ticket. Not a copy of any server-side authority — the server re-validates the strike on every
 * review/submit regardless of what the route carries.
 */

/** Trims and parses a candidate strike, returning `undefined` for anything not numeric or not a
 *  positive value — and otherwise the CANONICAL string form (`String(parsed)`), so `"040.00"` and
 *  `"40"` both normalize to `"40"` rather than the URL carrying redundant representations of the
 *  same strike. Accepts a `number` as well as a `string`: the router JSON-parses search values, so
 *  a purely-numeric `?strike=40` arrives as the NUMBER `40` on a fresh load (same fact `?play=`
 *  already accounts for in `trade.tsx`'s `validateSearch`) — only a genuinely non-numeric shape
 *  (an object, a boolean, `null`/`undefined`) is rejected outright. */
export function normalizeStrike(raw: unknown): string | undefined {
  if (typeof raw !== "string" && typeof raw !== "number") return undefined;
  const candidate = typeof raw === "string" ? raw.trim() : raw;
  if (candidate === "") return undefined;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : undefined;
}
