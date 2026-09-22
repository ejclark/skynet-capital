/**
 * The Symbol field's tier-2 client model (Phase 0.8b) — a live Alpaca lookup for a curated-
 * directory miss. Same doctrine as `quote.ts`/`bars.ts`: the client renders what the server said,
 * verbatim, and a miss is always an empty `hits` array, never an error the field needs to handle.
 */

export interface SymbolHit {
  readonly symbol: string;
  readonly name: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export const fetchSymbolSearch = (
  query: string,
): Promise<{ readonly hits: readonly SymbolHit[] }> =>
  getJson(`/api/symbols/search?q=${encodeURIComponent(query)}`);
