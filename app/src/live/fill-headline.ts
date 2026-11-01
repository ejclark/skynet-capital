import type { DeskOrderEvent } from "./desk-events";
import { type MarketSessionView, waitsForOpen } from "./market-session";
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

/**
 * A frame with no status is the app's own audit line, not the broker's report (#6529): a member's
 * cancel reaches the ticket as `order.submitted` with `intent: "cancel"`, usually after the
 * broker's own `canceled` update, so it is the frame the ticket keeps. The broker accepted the
 * cancel but has not confirmed it in this frame, and any part already filled stays filled — so it
 * reads "cancel requested", never "filled". Any other status-less frame earns nothing.
 */
function cancelRequested(fill: DeskOrderEvent): boolean {
  return typeof fill.payload.status !== "string" && fill.payload.intent === "cancel";
}

export function fillHeadline(order: SubmittedOrder, fill: DeskOrderEvent | undefined): string {
  const tif = tifLabel(order.timeInForce);
  const echo = `Order ${order.orderId} ${order.status} — ${order.symbol}${tif ? ` · ${tif}` : ""}`;
  if (!fill || fill.orderId !== order.orderId) return echo;
  if (cancelRequested(fill)) return `Order ${order.orderId} cancel requested — ${order.symbol}`;
  const status = typeof fill.payload.status === "string" ? fill.payload.status : undefined;
  if (fill.eventType !== "order.filled" && status === undefined) return echo;
  const word = fill.eventType === "order.filled" ? "filled" : (status ?? "").replace(/_/g, " ");
  const quantity = numberField(fill.payload, "filledQuantity");
  const price = numberField(fill.payload, "price");
  const symbol = typeof fill.payload.symbol === "string" ? fill.payload.symbol : order.symbol;
  const size = quantity !== undefined ? `${quantity} ` : "";
  return `Order ${order.orderId} ${word} — ${size}${symbol}${price !== undefined ? ` @ ${money(price)}` : ""}`;
}

/**
 * The done note's first sentence (#6257): "simulated fill" is a word the stream earns, exactly as
 * "filled" is in the headline — until a fill for this order arrives, the order is queued, and
 * outside the session the note names the open it waits for. A frame that carries no filled
 * quantity earns nothing — and one whose status is terminal (canceled, rejected, expired) ends the
 * wait: the note says so instead of "queued" (#6330), agreeing with the headline from that frame.
 */
const TERMINAL = new Set(["canceled", "cancelled", "rejected", "expired"]);

export function doneNote(fill: DeskOrderEvent | undefined, market: MarketSessionView): string {
  const filled =
    fill !== undefined &&
    (fill.eventType === "order.filled" || (numberField(fill.payload, "filledQuantity") ?? 0) > 0);
  if (filled) return "SIM account — simulated fill, real discipline.";
  if (fill && cancelRequested(fill)) {
    return "Cancel requested at the paper broker — anything already filled stays filled.";
  }
  const status = typeof fill?.payload.status === "string" ? fill.payload.status : "";
  if (TERMINAL.has(status)) {
    const word =
      status === "cancelled" ? "Canceled" : status.charAt(0).toUpperCase() + status.slice(1);
    return `${word} at the paper broker — nothing filled.`;
  }
  const open = waitsForOpen(market);
  return open
    ? `Queued — nothing fills before ${open}.`
    : "Queued at the paper broker — the fill lands here the moment it reports one.";
}
