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
  /** The NBBO and its midpoint (#3407 slice 6, the ticket's limit-at-mid default) — present only
   *  when the feed gave a live bid AND ask with ask ≥ bid; an inverted or half-missing book is no
   *  price to seed a limit from. `mid` is rounded to the cent, the same cent the ticket sends. */
  readonly bid?: number;
  readonly ask?: number;
  readonly mid?: number;
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
  {
    last,
    prevClose,
    bid,
    ask,
  }: {
    readonly last: number;
    readonly prevClose: number;
    readonly bid?: number;
    readonly ask?: number;
  },
): QuoteView {
  const nbbo = nbboView(bid, ask);
  if (prevClose <= 0) {
    return { symbol, last, change: 0, changePct: 0, tone: "flat", ...nbbo };
  }
  const raw = last - prevClose;
  const change = round2(raw);
  const changePct = round2((raw / prevClose) * 100);
  // Tone reads the RAW delta's sign, not the rounded-to-cent `change` — a sub-cent move on a
  // cheap ticker can round to $0.00 while still being a real decline (or gain).
  const tone: QuoteTone = raw > 0 ? "pos" : raw < 0 ? "neg" : "flat";
  return { symbol, last, change, changePct, tone, ...nbbo };
}

/** bid · ask · mid, or nothing: a limit seeded from half a book, or an inverted one, would be a
 *  guess dressed as a quote. */
function nbboView(
  bid: number | undefined,
  ask: number | undefined,
): Pick<QuoteView, "bid" | "ask" | "mid"> {
  if (bid === undefined || ask === undefined || bid <= 0 || ask < bid) return {};
  return { bid, ask, mid: round2((bid + ask) / 2) };
}
