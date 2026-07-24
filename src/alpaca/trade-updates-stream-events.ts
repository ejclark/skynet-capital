import type { ObservatoryEvent } from "../observatory/events.js";

/**
 * A decoded message from Alpaca's account `trade_updates` stream. Frames arrive as
 * binary-wrapped JSON; only the fields we consume are typed. A fill looks like:
 * `{ stream: "trade_updates", data: { event: "fill", price, qty, order: {...} } }`.
 */
export interface TradeUpdateMessage {
  readonly stream?: string;
  readonly data?: {
    readonly event?: string;
    readonly price?: string | number;
    readonly qty?: string | number;
    readonly timestamp?: string;
    readonly order?: {
      readonly symbol?: string;
      readonly side?: string;
      readonly filled_qty?: string;
      readonly filled_avg_price?: string;
    };
  };
}

function toNumber(value: string | number | undefined): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * Normalize a trade-update into a `fill` observatory event, or `null` if it isn't a fill we
 * can act on. Only (partial) fills with a symbol, side, positive quantity and price count —
 * lifecycle events like `new`/`canceled` are ignored. Pure, so the stream's wire shape is
 * pinned in tests without a socket.
 */
export function fillEventFromMessage(
  message: TradeUpdateMessage,
  participantId: string,
): ObservatoryEvent | null {
  if (message.stream !== "trade_updates" || !message.data) {
    return null;
  }
  const data = message.data;
  if (data.event !== "fill" && data.event !== "partial_fill") {
    return null;
  }
  const order = data.order;
  if (!order?.symbol || (order.side !== "buy" && order.side !== "sell")) {
    return null;
  }

  const quantity = toNumber(data.qty ?? order.filled_qty);
  const price = toNumber(data.price ?? order.filled_avg_price);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    type: "fill",
    participantId,
    symbol: order.symbol,
    side: order.side,
    quantity,
    price,
    at: data.timestamp ?? new Date().toISOString(),
  };
}
