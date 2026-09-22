import type { DeskOrderEvent } from "./desk-events";
import { money, tifLabel } from "./ticket";

/**
 * The ticket's done headline (#3407 P4 slice 2): the broker's echo at submit ("accepted"), then
 * — the moment the desk's own event stream carries a fill for THIS order — the fill itself, in
 * the frame's own numbers: contracts or shares filled, the symbol, the price when the feed
 * reported one. "filled" is a word the stream earns; the echo's status never gets promoted by
 * time passing. A partial fill reads as one, in the payload's status word.
 */

export interface SubmittedOrder {
  readonly orderId: string;
  readonly status: string;
  readonly symbol: string;
  readonly timeInForce?: string;
}

function numberField(payload: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function fillHeadline(order: SubmittedOrder, fill: DeskOrderEvent | undefined): string {
  if (!fill || fill.orderId !== order.orderId) {
    const tif = tifLabel(order.timeInForce);
    return `Order ${order.orderId} ${order.status} — ${order.symbol}${tif ? ` · ${tif}` : ""}`;
  }
  const status = typeof fill.payload.status === "string" ? fill.payload.status : "filled";
  const word = fill.eventType === "order.filled" ? "filled" : status.replace(/_/g, " ");
  const quantity = numberField(fill.payload, "filledQuantity");
  const price = numberField(fill.payload, "price");
  const symbol = typeof fill.payload.symbol === "string" ? fill.payload.symbol : order.symbol;
  const size = quantity !== undefined ? `${quantity} ` : "";
  return `Order ${order.orderId} ${word} — ${size}${symbol}${price !== undefined ? ` @ ${money(price)}` : ""}`;
}
