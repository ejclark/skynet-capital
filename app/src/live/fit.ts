import type { FitAnswer } from "../../../src/playbooks/fit-finder";

/**
 * THE FIT FINDER, LIGHT (#4469 slice 4) — `/api/research/fit?symbol=X`: which strategies one ticker
 * fits, from the pair table and the calendar alone (no broker). It renders as served; the row's
 * status, glyph and word are the server's, so the finder and the Store's card read one table.
 */
export async function fetchFit(symbol: string): Promise<FitAnswer> {
  const url = `/api/research/fit?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const raw = (await res.json()) as Partial<FitAnswer>;
  return { symbol: raw.symbol ?? symbol, fits: raw.fits ?? [] };
}

/** A verdict is a function of the table and the calendar day, so an hour is fresh. */
export function fitQuery(symbol: string, enabled = true) {
  return {
    queryKey: ["fit", symbol] as const,
    queryFn: () => fetchFit(symbol),
    enabled: enabled && symbol !== "",
    staleTime: 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  };
}
