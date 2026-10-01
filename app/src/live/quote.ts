/**
 * The quote header's client model (#2017 cockpit plan, Phase 0.9) — mirrors the server's
 * `QuoteView`. Same doctrine as `options.ts`: the client renders what the server said, verbatim;
 * the server computes tone, this module never re-derives pos/neg/flat from a raw number.
 */

export type QuoteTone = "pos" | "neg" | "flat";

export interface Quote {
  readonly symbol: string;
  readonly last: number;
  readonly change: number;
  readonly changePct: number;
  readonly tone: QuoteTone;
  /** The NBBO and its cent-rounded mid (#3407 slice 6) — only when the server had a live book. */
  readonly bid?: number;
  readonly ask?: number;
  readonly mid?: number;
  /** When the feed made the tick this answer was built from — set ONLY on a pushed frame
   *  (`quote-stream.ts`, #3407 P4). Its presence is what licenses the header to say anything about
   *  freshness at all; the one-shot REST answer still makes no such claim. */
  readonly asOf?: string;
}

/** The honest degrade: no linked client, no quote right now, or a feed failure — a sentence. */
export type QuoteAnswer = Quote | { readonly quoteNote: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export const fetchQuote = (symbol: string): Promise<QuoteAnswer> =>
  getJson(`/api/trade/quote?symbol=${encodeURIComponent(symbol)}`);
