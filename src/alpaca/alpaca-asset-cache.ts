import type { AlpacaAssetRow } from "./alpaca-options-client.js";

export interface AssetHit {
  readonly symbol: string;
  readonly name: string;
}

/** Refresh cadence for the cached asset list — the tradable universe barely moves day to day, so
 *  six hours keeps the fallback fresh without hammering `/v2/assets` on every miss. */
const TTL_MS = 21_600_000;

/** Same tiered ranking as `ticker-directory/index.ts`'s `tierOf` — a deliberate small duplication
 *  (two call sites, not worth a shared abstraction yet per this repo's own convention). Lower is
 *  better; -1 means no match. */
function tierOf(hit: AssetHit, upperQuery: string, lowerQuery: string): number {
  const symbolUpper = hit.symbol.toUpperCase();
  if (symbolUpper === upperQuery) return 0;
  if (symbolUpper.startsWith(upperQuery)) return 1;
  const nameLower = hit.name.toLowerCase();
  if (nameLower.split(/\s+/).some((word) => word.startsWith(lowerQuery))) return 2;
  if (nameLower.includes(lowerQuery)) return 3;
  return -1;
}

let cache: { data: AssetHit[]; fetchedAt: number } | undefined;

/**
 * Rank Alpaca's live asset list against a query, the tier-2 fallback for `searchTickers`'s
 * curated-directory miss. Fetched and cached at module scope (NOT per-requester — the tradable
 * asset universe isn't participant-specific), refreshed lazily on a stale read, same shape as
 * `server/auth/live-allow-set.ts`. A fetch failure keeps whatever the cache last held (or an empty
 * list on a cold first failure) — never throws.
 */
export async function assetSearch(
  fetchAssets: () => Promise<AlpacaAssetRow[] | undefined>,
  query: string,
  limit = 8,
  now: () => number = Date.now,
): Promise<AssetHit[]> {
  const trimmed = query.trim();
  if (trimmed === "") return [];

  const t = now();
  if (!cache || t - cache.fetchedAt >= TTL_MS) {
    try {
      const rows = await fetchAssets();
      if (rows !== undefined) {
        cache = {
          data: rows.map((row) => ({ symbol: row.symbol, name: row.name?.trim() || row.symbol })),
          fetchedAt: t,
        };
      } else if (!cache) {
        cache = { data: [], fetchedAt: t };
      }
      // A stale-but-nonempty cache on a failed refresh keeps its old `fetchedAt` implicitly stale
      // (never bumped here), so the NEXT read tries again rather than waiting out a fresh TTL.
    } catch {
      if (!cache) cache = { data: [], fetchedAt: t };
    }
  }

  const upperQuery = trimmed.toUpperCase();
  const lowerQuery = trimmed.toLowerCase();
  const tiers: AssetHit[][] = [[], [], [], []];
  for (const hit of cache.data) {
    const tier = tierOf(hit, upperQuery, lowerQuery);
    if (tier >= 0) tiers[tier]?.push(hit);
  }
  return tiers.flat().slice(0, limit);
}
