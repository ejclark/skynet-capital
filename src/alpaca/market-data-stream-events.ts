import type { ObservatoryEvent } from "../observatory/events.js";

/**
 * A raw message from Alpaca's market-data websocket. Only the fields we consume are
 * typed; the stream carries many more. A trade tick has `T: "t"`.
 */
export interface AlpacaMarketMessage {
  readonly T?: string;
  readonly S?: string;
  readonly p?: number;
  readonly t?: string;
  /** NBBO bid price, on a quote message (`T: "q"`). */
  readonly bp?: number;
  /** NBBO ask price, on a quote message. */
  readonly ap?: number;
}

/**
 * One streamed NBBO quote (#3407 P4, the quote stream) — what a `T: "q"` message carries that the
 * trade surface reads. Deliberately NOT an `ObservatoryEvent`: the bot loop's event vocabulary has
 * one price shape (a trade tick) and a bid/ask pair is not it, so this rides its own callback and
 * nothing downstream of the eval loop changes.
 *
 * The pair is passed through raw — a `0` bid, a missing ask, an inverted book. Judging whether a
 * book is good enough to price against already lives in exactly one place
 * (`src/trading/quote-view.ts`'s `nbboView`), and a second opinion here is how the two would drift.
 */
export interface MarketQuoteTick {
  readonly symbol: string;
  readonly bid: number;
  readonly ask: number;
  readonly at: string;
}

/** Normalize a quote message into a `MarketQuoteTick`, or `null` when it isn't one. */
export function quoteTickFromMessage(message: AlpacaMarketMessage): MarketQuoteTick | null {
  if (message.T !== "q" || !message.S) return null;
  if (typeof message.bp !== "number" || typeof message.ap !== "number") return null;
  return {
    symbol: message.S,
    bid: message.bp,
    ask: message.ap,
    at: message.t ?? new Date().toISOString(),
  };
}

/**
 * Normalize a market-data message into a `price` observatory event, or `null` if it isn't
 * a usable trade tick. Keeping this pure means we can pin the stream's wire shape in tests
 * without a socket — the websocket client just forwards decoded JSON here.
 */
export function priceEventFromMessage(message: AlpacaMarketMessage): ObservatoryEvent | null {
  if (message.T !== "t" || !message.S || typeof message.p !== "number") {
    return null;
  }
  return {
    type: "price",
    symbol: message.S,
    price: message.p,
    at: message.t ?? new Date().toISOString(),
  };
}
