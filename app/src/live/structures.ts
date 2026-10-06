import type { Outlook } from "../../../src/options/outlook";
import type { Recommendation } from "../../../src/options/recommend";

/**
 * THE OUTLOOK PANE'S DATA (#3407, slice 4). One read per stated view: the route assembles the
 * chain on the member's own credential and ranks against it, so everything the pane renders —
 * including every structure it could NOT rank, with its reason — arrives in one answer.
 *
 * Not refetched on focus, and only on an explicit ask: a load is up to 22 broker calls
 * (`structures-route.ts` states the budget), and a view stated a minute ago has not changed its
 * mind. The query is keyed by the whole view, so switching direction or horizon is a new read while
 * flipping back to one already seen is a cache hit.
 */

export type StructuresAnswer =
  | { readonly asOf: string; readonly spot: number; readonly recommendation: Recommendation }
  | { readonly note: string };

export async function fetchStructures(outlook: Outlook): Promise<StructuresAnswer> {
  const query = new URLSearchParams({
    symbol: outlook.symbol,
    direction: outlook.direction,
    magnitude: outlook.magnitude,
    horizon: String(outlook.horizonDays),
  });
  const url = `/api/trade/structures?${query.toString()}`;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as StructuresAnswer;
}

export const structuresKey = (outlook: Outlook) =>
  [
    "structures",
    outlook.symbol,
    outlook.direction,
    outlook.magnitude,
    outlook.horizonDays,
  ] as const;

export function structuresQuery(outlook: Outlook, enabled: boolean) {
  return {
    queryKey: structuresKey(outlook),
    queryFn: () => fetchStructures(outlook),
    enabled: enabled && outlook.symbol !== "",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  };
}
