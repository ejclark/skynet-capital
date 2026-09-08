/**
 * THE QUOTE HEADER'S PURE MATH — last price, day $ change, day % change, and the tone that
 * paints them, computed once here so client and server never disagree. The server computes the
 * tone (house idiom, `app/src/live/desk.ts`'s `Tone`); the client only paints it — never re-derives
 * pos/neg/flat from a raw number.
 */

export type QuoteTone = "pos" | "neg" | "flat";

export interface QuoteView {
  readonly symbol: string;
  readonly last: number;
  readonly change: number;
  readonly changePct: number;
  readonly tone: QuoteTone;
}

/** Round to two decimal places, round-half-up — same idiom as `alpaca-options-client.ts`'s
 *  `toCents`, kept as its own small local helper (a tiny local copy, not exported) rather than a
 *  cross-module import for one line of math. Serves both the dollar change (a cent) and the
 *  percent change (2dp) — they're the same rounding. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** `(symbol, { last, prevClose })` → the view the header renders. A non-positive `prevClose`
 *  (no honest prior session to compare against) reports a flat, zeroed change rather than a
 *  divide-by-zero or a fabricated swing. */
export function quoteView(
  symbol: string,
  { last, prevClose }: { readonly last: number; readonly prevClose: number },
): QuoteView {
  if (prevClose <= 0) {
    return { symbol, last, change: 0, changePct: 0, tone: "flat" };
  }
  const change = round2(last - prevClose);
  const changePct = round2(((last - prevClose) / prevClose) * 100);
  const tone: QuoteTone = change > 0 ? "pos" : change < 0 ? "neg" : "flat";
  return { symbol, last, change, changePct, tone };
}
