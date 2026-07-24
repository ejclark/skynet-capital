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
