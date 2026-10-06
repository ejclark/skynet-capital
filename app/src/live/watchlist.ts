import type { WatchedSymbol } from "../../../src/trading/watchlist";

/**
 * THE WATCHLIST'S DATA (#3407 P4, #4332) — the member's own names, read and toggled.
 *
 * Every answer carries the WHOLE list, so a toggle writes the server's reply straight into the
 * query rather than patching a local copy: the cap and the dedupe rules live on the server
 * (`src/trading/watchlist.ts`), and a client that guessed at them would eventually disagree with
 * the list the next reader loads. Same doctrine as `options.ts` — render what the server said.
 *
 * `available: false` is a real answer, not an error: an unwired deployment has nowhere to keep a
 * name, and the pane says so in the server's own words instead of accepting taps that vanish.
 */

export interface WatchlistAnswer {
  readonly available: boolean;
  readonly limit: number;
  readonly watching: readonly WatchedSymbol[];
  readonly reason?: string;
}

export type WatchlistResult =
  | { readonly ok: true; readonly watching: readonly WatchedSymbol[] }
  | {
      readonly ok: false;
      readonly refusals: readonly string[];
      readonly watching: readonly WatchedSymbol[];
    };

const PATH = "/api/trade/watchlist";

export async function fetchWatchlist(): Promise<WatchlistAnswer> {
  const res = await fetch(PATH, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${PATH} → ${res.status}`);
  return (await res.json()) as WatchlistAnswer;
}

/** Ask for a name to be watched or unwatched. `watching` is the desired STATE, so a double tap
 *  lands on the state the member meant rather than undoing itself (`watchlist-route.ts`). */
export async function setWatching(symbol: string, watching: boolean): Promise<WatchlistResult> {
  const res = await fetch(PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ symbol, watching }),
  });
  if (!res.ok) throw new Error(`POST ${PATH} → ${res.status}`);
  return (await res.json()) as WatchlistResult;
}

export const watchlistKey = ["watchlist"] as const;

export const watchlistQuery = {
  queryKey: watchlistKey,
  queryFn: fetchWatchlist,
  staleTime: 30_000,
};
