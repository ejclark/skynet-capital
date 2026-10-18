import type { SymbolOutlook } from "../../../src/research/symbol-outlook-shape";

/**
 * THE SYMBOL SUMMARY, LIGHT (#4807 slice 4) — `/api/research/outlook?symbol=A,B`, the same
 * `symbolOutlook()` the Guidance tab's market read carries, without the broker. A position row, an
 * R&D symbol and a playbook ticker row read it so the recap card shows wherever a symbol appears.
 * It renders as served; nothing here reshapes the summary.
 */
export interface OutlookAnswer {
  readonly outlooks: Readonly<Record<string, SymbolOutlook>>;
}

export async function fetchOutlooks(symbols: readonly string[]): Promise<OutlookAnswer> {
  const url = `/api/research/outlook?symbol=${encodeURIComponent(symbols.join(","))}`;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const raw = (await res.json()) as Partial<OutlookAnswer>;
  return { outlooks: raw.outlooks ?? {} };
}

/** One answer per symbol: the key is the symbol alone, so a list of rows shares a cache. A
 *  summary is a function of the calendar day, so an hour is fresh. */
export function outlookQuery(symbol: string, enabled = true) {
  return {
    queryKey: ["outlook", symbol] as const,
    queryFn: async () => (await fetchOutlooks([symbol])).outlooks[symbol] ?? null,
    enabled: enabled && symbol !== "",
    staleTime: 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  };
}
