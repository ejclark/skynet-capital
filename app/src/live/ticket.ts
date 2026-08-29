/**
 * The pre-trade gate's client model (#738 phase 2e) — types mirror `TicketPreview` and
 * `DeskTradeResult` on the server. The client renders what the server said, verbatim; the review
 * is a courtesy and the SERVICE is the gate, so nothing here decides anything.
 */

import { postJson } from "./post";

/** The order classes the desk can actually place today. Mirrors the server's `TicketOrderType`
 *  (`src/trading/order-ticket.ts`) exactly — a value this list can produce is a value the broker
 *  client can send, which is the whole reason it is spelled out here rather than left as string. */
export type TicketOrderType = "market" | "limit" | "stop";

export interface TicketDraft {
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: "buy" | "sell";
  readonly orderType?: TicketOrderType;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

export interface TicketPreview {
  readonly ok: boolean;
  readonly action: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly estPrice?: number;
  readonly estNotional?: number;
  readonly estCashAfter?: number;
  readonly positionAfter?: number;
  readonly refusals: readonly string[];
  readonly warnings: readonly string[];
}

export type TicketResult =
  | {
      readonly ok: true;
      readonly orderId: string;
      readonly status: string;
      readonly symbol: string;
    }
  | { readonly ok: false; readonly refusals: readonly string[] };

export const reviewTicket = (draft: TicketDraft): Promise<{ preview: TicketPreview }> =>
  postJson("/api/trade/review", draft);

export const submitTicket = (draft: TicketDraft): Promise<TicketResult> =>
  postJson("/api/trade/submit", draft);

/** The dollars formatted client-side ONLY for the submit button's label — every displayed figure
 *  in the gate body comes from the server's own numbers. */
export const money = (value: number | undefined): string =>
  value === undefined ? "—" : value.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * ORDER TYPE — the ticket's raw form state and the four pure decisions taken on it (#716).
 *
 * The names are the member's ask, and they are deliberately not the broker's: a stop order is
 * shown as **Stop-Market**, never bare "Stop", because "stop" alone hides the one fact that
 * matters about it — once triggered it fills at the market price, whatever that has become. That
 * ambiguity is exactly what a Stop-Limit exists to remove, so the label has to carry the
 * distinction before the second class arrives.
 */
export interface TicketFields {
  readonly symbol: string;
  readonly quantity: string;
  readonly action: "buy" | "sell";
  readonly orderType: TicketOrderType;
  /** Raw input text, still unparsed — the server is the arbiter of whether a price is usable. */
  readonly limitPrice: string;
  readonly stopPrice: string;
}

export const ORDER_TYPE_LABELS: Record<TicketOrderType, string> = {
  market: "Market",
  limit: "Limit",
  stop: "Stop-Market",
};

/** The server echoes the type back as a plain string; anything unrecognized renders as itself
 *  rather than as a guess, so a class this build doesn't know about can never be mislabeled. */
export function orderTypeLabel(orderType: string): string {
  return ORDER_TYPE_LABELS[orderType as TicketOrderType] ?? orderType;
}

/** Which price this order class needs from the member — undefined when it needs none. */
export function priceFieldFor(orderType: TicketOrderType): "limitPrice" | "stopPrice" | undefined {
  if (orderType === "limit") return "limitPrice";
  if (orderType === "stop") return "stopPrice";
  return undefined;
}

/** How this class actually fills, in one sentence, stated before the order is placed rather than
 *  discovered afterwards. Honesty first: the Stop-Market line leads with the cost of the guarantee
 *  it gives (it will fill — at an unknown price), not with the reassurance. */
export function orderTypeNote(orderType: TicketOrderType): string {
  if (orderType === "limit") {
    return "Fills at your limit price or better, or not at all — a limit order can sit open indefinitely if the price never comes to you.";
  }
  if (orderType === "stop") {
    return "Stays dormant until the stop price trades, then turns into a plain market order. It will fill — but at whatever the market is paying at that moment, which in a fast move can be well past your stop.";
  }
  return "Fills immediately at the best price the market is currently offering.";
}

const parsePrice = (raw: string): number | undefined => {
  const value = Number(raw.trim());
  return raw.trim() !== "" && Number.isFinite(value) ? value : undefined;
};

/**
 * Form state → the draft that goes over the wire. Only the price the chosen class actually uses
 * is carried: a stop price left over from a previous edit must never ride along on a market
 * order, where the server would have no reason to look at it and the member no way to see it.
 */
export function buildDraft(participantId: string, fields: TicketFields): TicketDraft {
  const field = priceFieldFor(fields.orderType);
  const price = field === undefined ? undefined : parsePrice(fields[field]);
  return {
    participantId,
    symbol: fields.symbol.trim().toUpperCase(),
    quantity: Number(fields.quantity),
    action: fields.action,
    ...(fields.orderType !== "market" ? { orderType: fields.orderType } : {}),
    ...(field !== undefined && price !== undefined ? { [field]: price } : {}),
  };
}
