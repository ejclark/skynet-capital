import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Quote } from "./quote";

/**
 * THE QUOTE'S PUSH CHANNEL (#3407 P4) — the SSE → Query seam for one symbol's underlying quote,
 * the same idea as `desk-events.ts` for a desk's order lifecycle. The server pushes the whole
 * answer (`/api/trade/quote-stream`) and this side writes it into the `["quote", symbol]` query
 * every ticket surface already reads. What it replaces is not a poll: `quote-query.ts` fetches once
 * when the symbol commits and names no refetch interval, so until now the price on a ticket was
 * frozen at the moment the ticker was typed.
 *
 * It differs from the desk channel in one deliberate way: a frame here CARRIES the quote rather
 * than invalidating a query, because a tick-triggered re-read would be hundreds of REST reads a
 * minute on a liquid name. The honesty property that rule exists to protect still holds — the
 * server computed every field (tone and the day change included, in `src/trading/quote-view.ts`),
 * this side only paints it, and a dropped frame costs a slightly older price, never a wrong one.
 *
 * Where the server declines — no hub, no linked session, an OAuth link with no key/secret pair, the
 * symbol budget full — it answers JSON instead of a stream, the EventSource errors once, and the
 * surface shows the commit-time price exactly as it did before. Nothing here has to know which case
 * it was.
 */

/** A pushed frame: the REST answer's own shape, plus when the feed made the tick behind it. */
export interface StreamedQuote extends Quote {
  readonly asOf: string;
}

/** Open the channel for one symbol or a set of them — one connection either way, because a browser
 *  allows six `EventSource`s per origin and a watchlist row each would starve the seventh name
 *  (#4332). Returns the disposer the caller owns (a React effect). */
export function connectQuoteStream(
  queryClient: QueryClient,
  symbols: string | readonly string[],
): () => void {
  if (typeof EventSource === "undefined") return () => undefined;
  const asked = (typeof symbols === "string" ? [symbols] : symbols).join(",");
  const source = new EventSource(`/api/trade/quote-stream?symbol=${encodeURIComponent(asked)}`, {
    withCredentials: true,
  });
  source.addEventListener("quote", (raw) => {
    const quote = JSON.parse((raw as MessageEvent<string>).data) as StreamedQuote;
    // The server's OWN symbol field decides which query this lands in — never the caller's prop,
    // the same rule `quote-header.tsx` renders by. A frame for another symbol is not this one's.
    queryClient.setQueryData(["quote", quote.symbol], quote);
  });
  return () => source.close();
}

/** Mount the channel while a surface is showing a committed symbol; nothing for an empty one, and
 *  nothing when the surface was handed its quote by someone else (`QuoteHeader`'s `provided`). */
export function useQuoteStream(symbol: string, enabled = true): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (symbol === "" || !enabled) return undefined;
    return connectQuoteStream(queryClient, symbol);
  }, [queryClient, symbol, enabled]);
}

/**
 * Mount ONE channel for a whole set of symbols — the watchlist's rows (#4332). Keyed on the joined
 * set rather than the array, so a re-render that hands back an equal list does not tear the socket
 * down and build it again (a new array literal every render would otherwise reconnect on every
 * paint, and each reconnect costs the hub a fresh REST snapshot per symbol).
 */
export function useQuoteStreamSet(symbols: readonly string[]): void {
  const queryClient = useQueryClient();
  const key = symbols.join(",");
  useEffect(() => {
    if (key === "") return undefined;
    return connectQuoteStream(queryClient, key.split(","));
  }, [queryClient, key]);
}
