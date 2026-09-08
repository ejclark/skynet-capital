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
