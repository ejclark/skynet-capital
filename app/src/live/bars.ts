/**
 * The chart section's client model (#2017 cockpit plan, Phase 1 chart build-out) — the REST
 * backfill of daily OHLC+volume bars, mirroring the server's `Bar`. Same doctrine as `quote.ts`:
 * the client renders what the server said, verbatim. An empty `bars` array is a real answer (the
 * feed had nothing for this window) and is never read as a failure — a failure arrives as a
 * `barsNote` sentence.
 */

export interface Bar {
  readonly t: string;
  readonly o: number;
  readonly h: number;
  readonly l: number;
  readonly c: number;
  readonly v: number;
}

export interface Bars {
  readonly symbol: string;
  readonly bars: readonly Bar[];
}

/** The honest degrade: no linked client, or a feed that couldn't be reached — a sentence. */
export type BarsAnswer = Bars | { readonly barsNote: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

/** `days` is a calendar-day lookback ending today; the server clamps it to [1, 1825]. */
export const fetchBars = (symbol: string, days = 180): Promise<BarsAnswer> =>
  getJson(`/api/trade/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`);
