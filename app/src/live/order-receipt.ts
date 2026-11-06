import { humanizeOptionSymbol } from "../../../src/trading/option-symbols";
import type { DeskOrderEvent } from "./desk-events";
import { type MarketSessionView, waitsForOpen } from "./market-session";
import type { DeskOrderRow, DeskOrderState, DeskOrders } from "./orders";
import { money, orderTypeLabel, tifLabel } from "./ticket";

/**
 * THE ORDER RECEIPT'S MODEL — what a sent ticket says about its order, in words (Eric, 2026-11-06,
 * after placing orders by hand: the form's entries persisting "sends signals that the trade didn't
 * execute", and the done line — "Order 2ebcf855-… pending_new — CRWV270115P00062500" — was a UUID,
 * the broker's raw status word and a raw contract symbol). The ticket now gives way to a receipt
 * (`shell/order-receipt.tsx`); this file is everything it states, pure, so each sentence is specced.
 *
 * Three sources can say where the order stands, and the furthest-along one wins:
 *  - the broker's order list (`/api/trade/orders`, the store of record, re-read on every stream
 *    frame and on a slow poll) — `followRow` tracks the order through a modify's new id;
 *  - the desk's event stream frame for this order (#3407 P4 slice 2);
 *  - the submit's own echo.
 * HONESTY RULES carried over from the done line this replaces (`fill-headline.ts`, #6257, #6330,
 * #6529): "filled" is a word the broker's list or the stream earns, never the passing of time; a
 * partial fill reads as one; a terminal status ends the wait and says what filled; a member's
 * cancel arrives as a status-less audit frame and reads "cancel requested" — anything already
 * filled stays filled — and any other status-less frame earns nothing.
 */

/** The order as the ticket sent it — the receipt's floor until the broker's list names it. */
export interface SentOrder {
  readonly orderId: string;
  /** The submit echo's status — the broker's word at the moment it accepted the order. */
  readonly status: string;
  /** The broker's symbol: a ticker, or an option contract's OCC symbol. */
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly unit: "shares" | "contracts";
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly timeInForce?: string;
}

/** Where the order stands: the order list's own states, plus a cancel the broker hasn't confirmed. */
export type ReceiptState = DeskOrderState | "cancel-requested";

export interface ReceiptRead {
  readonly state: ReceiptState;
  /** How much has filled, when a source said. */
  readonly filled?: number;
  /** The average fill price, when a source said. */
  readonly price?: number;
}

/** The broker's status words, mapped as the order list maps them (`desk-orders-view.ts`). */
const STATUS: Record<string, DeskOrderState> = {
  filled: "filled",
  partially_filled: "partial",
  replaced: "replaced",
  canceled: "cancelled",
  cancelled: "cancelled",
  done_for_day: "cancelled",
  rejected: "rejected",
  expired: "expired",
};

const statusState = (status: string): DeskOrderState => STATUS[status] ?? "working";

/** How far along each state is — the furthest-along source wins, so a stale read never
 *  un-fills an order the stream already reported. */
const RANK: Record<ReceiptState, number> = {
  working: 0,
  partial: 1,
  "cancel-requested": 2,
  filled: 3,
  cancelled: 3,
  rejected: 3,
  expired: 3,
  replaced: 3,
};

function numberField(payload: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** A stream frame's read, or nothing when the frame earns nothing (#6529). */
function frameRead(fill: DeskOrderEvent, quantity: number): ReceiptRead | undefined {
  const status = typeof fill.payload.status === "string" ? fill.payload.status : undefined;
  if (status === undefined && fill.payload.intent === "cancel")
    return { state: "cancel-requested" };
  const filled = numberField(fill.payload, "filledQuantity");
  const price = numberField(fill.payload, "price");
  const amounts = {
    ...(filled === undefined ? {} : { filled }),
    ...(price === undefined ? {} : { price }),
  };
  if (fill.eventType === "order.filled") {
    const partial = status === "partially_filled" || (filled !== undefined && filled < quantity);
    return { state: partial ? "partial" : "filled", ...amounts };
  }
  return status === undefined ? undefined : { state: statusState(status), ...amounts };
}

/** The order's row on the broker's list, followed through a modify: a `replaced` row points at
 *  its successor, and the successor is the order now. Stops at the last row the list holds. */
export function followRow(
  orders: DeskOrders | undefined,
  orderId: string,
): DeskOrderRow | undefined {
  if (!orders?.available) return undefined;
  const rows = [...orders.working, ...orders.recent];
  const seen = new Set<string>();
  let row = rows.find((r) => r.id === orderId);
  while (row?.state === "replaced" && row.replacedBy && !seen.has(row.id)) {
    seen.add(row.id);
    const next = rows.find((r) => r.id === row?.replacedBy);
    if (!next) break;
    row = next;
  }
  return row;
}

/** Where the order stands — the furthest-along of the list's row, the stream's frame and the echo. */
export function readReceipt(
  order: SentOrder,
  row: DeskOrderRow | undefined,
  fill: DeskOrderEvent | undefined,
): ReceiptRead {
  const listed: ReceiptRead | undefined = row
    ? {
        state: row.state,
        filled: row.filledQuantity,
        ...(row.avgFillPrice === undefined ? {} : { price: row.avgFillPrice }),
      }
    : undefined;
  const ownFrame = fill && fill.orderId === (row?.id ?? order.orderId) ? fill : undefined;
  const pushed = ownFrame ? frameRead(ownFrame, row?.quantity ?? order.quantity) : undefined;
  const echo: ReceiptRead = { state: statusState(order.status) };
  const reads = [listed, pushed, echo].filter((r): r is ReceiptRead => r !== undefined);
  const lead = reads.reduce((best, r) => (RANK[r.state] > RANK[best.state] ? r : best));
  const filled = lead.filled ?? reads.find((r) => r.filled !== undefined)?.filled;
  const price = lead.price ?? reads.find((r) => r.price !== undefined)?.price;
  return {
    state: lead.state,
    ...(filled === undefined ? {} : { filled }),
    ...(price === undefined ? {} : { price }),
  };
}

/** "1 contract", "20 contracts", "1 share". */
function countWords(count: number, unit: SentOrder["unit"]): string {
  const word = unit === "contracts" ? "contract" : "share";
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The terms an order carries — the sent ticket's, or the broker row's once a modify changed them. */
type Terms = Pick<
  SentOrder,
  "side" | "quantity" | "orderType" | "limitPrice" | "stopPrice" | "timeInForce"
>;

/** The receipt's two lines: the instrument in words, then the terms —
 *  "CRWV $62.50 PUT · 15 JAN 27" over "Sell to open · 20 contracts · Limit $20.00 · Day". */
export function orderWords(
  order: SentOrder,
  terms: Terms = order,
): { readonly instrument: string; readonly terms: string } {
  const option = order.unit === "contracts";
  const side = terms.side === "sell" ? "Sell" : "Buy";
  const { stopPrice: stop, limitPrice: limit } = terms;
  // One price reads beside its order type ("Limit $20.00"); a stop-limit names both.
  const price =
    stop !== undefined && limit !== undefined
      ? ` · stop ${money(stop)} · limit ${money(limit)}`
      : stop !== undefined || limit !== undefined
        ? ` ${money(stop ?? limit)}`
        : "";
  const tif = tifLabel(terms.timeInForce);
  return {
    instrument: option ? humanizeOptionSymbol(order.symbol) : order.symbol,
    terms: [
      option ? `${side} to open` : side,
      countWords(terms.quantity, order.unit),
      `${orderTypeLabel(terms.orderType)}${price}`,
      ...(tif ? [tif] : []),
    ].join(" · "),
  };
}

/** The receipt's headline: what happened, in a word or two, then the numbers. */
export function receiptHeadline(
  read: ReceiptRead,
  quantity: number,
  unit: SentOrder["unit"],
): string {
  const at = read.price !== undefined ? ` @ ${money(read.price)}` : "";
  const some = read.filled !== undefined && read.filled > 0;
  const partly = `${read.filled} of ${countWords(quantity, unit)} filled`;
  switch (read.state) {
    case "filled":
      return `Filled — ${countWords(read.filled ?? quantity, unit)}${at}`;
    case "partial":
      return `Partly filled — ${partly}${at}`;
    case "cancel-requested":
      return "Cancel requested — waiting for the broker";
    case "cancelled":
      return some ? `Cancelled — ${partly} first` : "Cancelled — nothing filled";
    case "rejected":
      return "Rejected by the broker — nothing filled";
    case "expired":
      return some ? `Expired — ${partly} first` : "Expired — nothing filled";
    case "replaced":
      return "Change sent — the broker is replacing the order";
    default:
      return "Order placed — not filled yet";
  }
}

/** The receipt's note: what happens next, with the open a closed market waits for (#6257). */
export function receiptNote(read: ReceiptRead, market: MarketSessionView): string {
  const some = read.filled !== undefined && read.filled > 0;
  switch (read.state) {
    case "filled":
      return "SIM account — simulated fill, real discipline.";
    case "partial":
      return "SIM account — simulated fill, real discipline. The rest is still working.";
    case "cancel-requested":
      return "Cancel requested at the paper broker — anything already filled stays filled.";
    case "cancelled":
    case "rejected":
    case "expired": {
      const word = read.state.charAt(0).toUpperCase() + read.state.slice(1);
      return `${word} at the paper broker — ${some ? "what filled stays filled" : "nothing filled"}.`;
    }
    case "replaced":
      return "The broker cancels the old order and answers with the changed one — this updates when it does.";
    default: {
      const open = waitsForOpen(market);
      return open
        ? `Queued — nothing fills before ${open}.`
        : "Working at the paper broker — this updates the moment it fills.";
    }
  }
}

/** The GateHead tone for a state — the words carry the meaning; the dot only echoes it. */
export function receiptTone(state: ReceiptState): string {
  if (state === "filled" || state === "partial") return "filled";
  if (state === "rejected") return "refused";
  if (state === "cancelled" || state === "expired") return "draft";
  return "checks";
}

/** Still live at the broker — the states a member can still change or cancel. */
export const isLive = (state: ReceiptState): boolean => state === "working" || state === "partial";
