import type { TradeActivityRecord } from "../observatory/activity-store.js";
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
      readonly id?: string;
      readonly symbol?: string;
      readonly side?: string;
      readonly qty?: string;
      readonly status?: string;
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

/** The first finite number among candidates, else undefined — stream payloads are stringly-typed. */
function firstFinite(...candidates: Array<string | number | undefined>): number | undefined {
  for (const candidate of candidates) {
    if (candidate === undefined) continue;
    const value = toNumber(candidate);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

/**
 * Normalize a trade-update into a durable activity-ledger line, or `null` when the message
 * carries no identifiable order. Deliberately wider than `fillEventFromMessage`: lifecycle
 * events (`new`, `canceled`, `rejected`) are journaled too, so the ledger shows an order's whole
 * life — `collapseActivity` folds the lines back to one row per order. Pure, like its sibling,
 * so the wire shape is pinned in tests without a socket.
 */
export function activityFromMessage(
  message: TradeUpdateMessage,
  participantId: string,
): TradeActivityRecord | null {
  if (message.stream !== "trade_updates" || !message.data) {
    return null;
  }
  const data = message.data;
  const order = data.order;
  if (!(order?.id && order.symbol) || (order.side !== "buy" && order.side !== "sell")) {
    return null;
  }

  const filledQuantity = firstFinite(order.filled_qty) ?? 0;
  const quantity = firstFinite(order.qty, data.qty, order.filled_qty);
  if (quantity === undefined || quantity <= 0) {
    return null;
  }
  const price = firstFinite(order.filled_avg_price, data.price);
  return {
    orderId: order.id,
    participantId,
    symbol: order.symbol,
    side: order.side,
    quantity,
    filledQuantity: Math.max(0, filledQuantity),
    ...(price !== undefined && price > 0 ? { price } : {}),
    status: order.status ?? data.event ?? "unknown",
    at: data.timestamp ?? new Date().toISOString(),
    source: "stream",
  };
}
