/**
 * The pre-trade gate's client model (#738 phase 2e) — types mirror `TicketPreview` and
 * `DeskTradeResult` on the server. The client renders what the server said, verbatim; the review
 * is a courtesy and the SERVICE is the gate, so nothing here decides anything.
 */

import { type MarketSessionView, waitsForOpen } from "./market-session";
import { postJson } from "./post";
import { questOfPage } from "./quest-link";

/** The order classes the desk can actually place today. Mirrors the server's `TicketOrderType`
 *  (`src/trading/order-ticket.ts`) exactly — a value this list can produce is a value the broker
 *  client can send, which is the whole reason it is spelled out here rather than left as string.
 *  `stop_limit` is offered only to a session the exit-at-entry setting admits (`orderTypesFor`). */
export type TicketOrderType = "market" | "limit" | "stop" | "stop_limit";

/** Mirrors the server's `TicketTimeInForce` — Day or GTC, the two the desk shows (#3407 P1). */
export type TicketTimeInForce = "day" | "gtc";

export interface TicketDraft {
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: "buy" | "sell";
  readonly orderType?: TicketOrderType;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly timeInForce?: TicketTimeInForce;
  /** A take-profit and stop the broker holds with the entry (#8249); a missing price is left out
   *  and the server refuses it in words. */
  readonly exit?: { readonly takeProfit?: number; readonly stop?: number };
}

/** The exit as the server reviewed it — mirrors `ExitPreview` (`src/trading/order-exit.ts`). Each
 *  leg's dollars are measured against the limit by `previewOrder`, never here. */
export interface TicketExitPreview {
  readonly takeProfit: number;
  readonly stop: number;
  readonly takeProfitDollars?: number;
  readonly stopDollars?: number;
}

export interface TicketPreview {
  readonly ok: boolean;
  readonly action: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  /** What will be sent — the server always says, even when the draft left it blank. */
  readonly timeInForce: TicketTimeInForce;
  readonly exit?: TicketExitPreview;
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
      readonly timeInForce?: string;
      /** A bracket's take-profit and stop as the broker echoed them (#8249) — the receipt's words. */
      readonly exits?: { readonly takeProfit: number; readonly stop: number };
    }
  | { readonly ok: false; readonly refusals: readonly string[] };

export const reviewTicket = (draft: TicketDraft): Promise<{ preview: TicketPreview }> =>
  postJson("/api/trade/review", draft);

/** Sends the order with the quest the ticket was opened from, if any (#7028 slice 6). */
export const submitTicket = (draft: TicketDraft): Promise<TicketResult> =>
  postJson("/api/trade/submit", { ...draft, ...questOfPage() });

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
  /** The member's own pick; undefined until they touch the control, and then the ticket shows
   *  `defaultTimeInForce` pressed and sends nothing — the server previews the default it will
   *  use, so what is shown is always what is sent (#3407 P1). */
  readonly timeInForce?: TicketTimeInForce;
  /** The exit the member opened with "Add an exit" (#8249): raw text, both empty until typed —
   *  never prefilled. Undefined while no exit is added. */
  readonly exit?: { readonly takeProfit: string; readonly stop: string };
}

export const ORDER_TYPE_LABELS: Record<TicketOrderType, string> = {
  market: "Market",
  limit: "Limit",
  stop: "Stop-Market",
  stop_limit: "Stop-Limit",
};

/** The order types the form offers. With the exit-at-entry setting off for this session (#8249),
 *  exactly the three it offered before; admitted, Stop-Limit joins them. */
export function orderTypesFor(exitAtEntry: boolean): readonly TicketOrderType[] {
  const types: TicketOrderType[] = ["market", "limit", "stop"];
  return exitAtEntry ? [...types, "stop_limit"] : types;
}

/** Whether this ticket can carry an exit: a limit buy, the one entry the server takes one on
 *  (`src/trading/order-exit.ts`). The server still judges it; this only decides what to offer. */
export function exitFits(fields: Pick<TicketFields, "action" | "orderType">): boolean {
  return fields.action === "buy" && fields.orderType === "limit";
}

export const TIF_LABELS: Record<TicketTimeInForce, string> = { day: "Day", gtc: "GTC" };

/** Mirrors the server's own fallback (`order-ticket.ts` → `defaultTimeInForce`): a market order
 *  is for today; a held order outlives the session it was placed in. */
export function defaultTimeInForce(orderType: TicketOrderType): TicketTimeInForce {
  return orderType === "market" ? "day" : "gtc";
}

/** "Day" / "GTC" for the server's echo; an unrecognized value renders as itself, never a guess. */
export function tifLabel(tif: string | undefined): string | undefined {
  if (tif === undefined) return undefined;
  return TIF_LABELS[tif as TicketTimeInForce] ?? tif.toUpperCase();
}

/** One sentence on what the pick means, stated before the order is placed. After the close a Day
 *  order belongs to the NEXT session, so "today's session" would name one it never trades in. */
export function tifNote(
  tif: TicketTimeInForce,
  market: MarketSessionView,
  timeZone?: string,
): string {
  if (tif === "gtc") return "GTC: stays working across sessions until it fills or you cancel it.";
  const open = market.state === "closed" ? waitsForOpen(market, timeZone) : undefined;
  return open
    ? `Day: waits for ${open}; anything unfilled is cancelled when that session closes.`
    : "Day: anything unfilled is cancelled when today's session closes.";
}

/** The server echoes the type back as a plain string; anything unrecognized renders as itself
 *  rather than as a guess, so a class this build doesn't know about can never be mislabeled. */
export function orderTypeLabel(orderType: string): string {
  return ORDER_TYPE_LABELS[orderType as TicketOrderType] ?? orderType;
}

/** What a share ticket hands the next one when the member flips Buy ⇄ Sell (the flip remounts the
 *  ticket on the other rung). The count always goes. The order type and its limit go once the
 *  member chose them (`priced`); an untouched ticket re-seeds at the mid, as any fresh one does.
 *  A stop price never goes: a buy stop sits above the market and a sell stop below it, so the same
 *  number on the other side would fire at once. */
export interface TicketCarry {
  /** The symbol the count and price were typed for — a carry is only ever offered back to a ticket
   *  for this same symbol (a count and a limit typed for NVDA must never pre-fill an AAPL sell). */
  readonly symbol: string;
  readonly quantity: string;
  readonly priced?: Pick<TicketFields, "orderType" | "limitPrice">;
  readonly timeInForce?: TicketTimeInForce;
}

export function carryAcrossSide(fields: TicketFields, priced: boolean): TicketCarry {
  // A stop-limit's limit is set against its stop, which never goes (#8249): neither half carries,
  // and the other side re-seeds as a fresh ticket does.
  const carriesPrice = priced && fields.orderType !== "stop_limit";
  return {
    symbol: fields.symbol.trim().toUpperCase(),
    quantity: fields.quantity,
    ...(carriesPrice
      ? { priced: { orderType: fields.orderType, limitPrice: fields.limitPrice } }
      : {}),
    ...(fields.timeInForce ? { timeInForce: fields.timeInForce } : {}),
  };
}

/** Which price this order class needs from the member — undefined when it needs none, or when it
 *  needs two (a stop-limit: `priceFieldsFor`). */
export function priceFieldFor(orderType: TicketOrderType): "limitPrice" | "stopPrice" | undefined {
  if (orderType === "limit") return "limitPrice";
  if (orderType === "stop") return "stopPrice";
  return undefined;
}

/** Every price this order class needs, in the order the form asks for them: a stop-limit's stop
 *  first (it is what triggers the order), then its limit. */
export function priceFieldsFor(
  orderType: TicketOrderType,
): readonly ("limitPrice" | "stopPrice")[] {
  if (orderType === "stop_limit") return ["stopPrice", "limitPrice"];
  const one = priceFieldFor(orderType);
  return one === undefined ? [] : [one];
}

/** How this class actually fills, in one sentence, stated before the order is placed rather than
 *  discovered afterwards. Honesty first: the Stop-Market line leads with the cost of the guarantee
 *  it gives (it will fill — at an unknown price), not with the reassurance.
 *
 *  The market clock comes first (#6257): outside the regular session nothing fills, so a market
 *  order never says "immediately" — it says which open it waits for — and the other classes lead
 *  with the same fact before their own rule. The server says the same in the review's warning
 *  (`src/trading/order-ticket.ts`); this says it before the member has to ask for a review. */
export function orderTypeNote(
  orderType: TicketOrderType,
  market: MarketSessionView,
  timeZone?: string,
): string {
  const open = waitsForOpen(market, timeZone);
  const lead = market.state === "pre" ? "Pre-market" : "Market closed";
  if (orderType === "market") {
    return open
      ? `${lead} — this order waits for ${open}, then fills at the best price on offer.`
      : "Fills immediately at the best price the market is currently offering.";
  }
  const wait = open ? `${lead} — nothing fills before ${open}. ` : "";
  if (orderType === "limit") {
    return `${wait}Fills at your limit price or better, or not at all — a limit order can sit open indefinitely if the price never comes to you.`;
  }
  if (orderType === "stop_limit") {
    return `${wait}Stays dormant until the stop price trades, then becomes a limit order at your limit price. It fills at that price or better, or not at all — in a fast move it can be left behind unfilled.`;
  }
  return `${wait}Stays dormant until the stop price trades, then turns into a plain market order. It will fill — but at whatever the market is paying at that moment, which in a fast move can be well past your stop.`;
}

const parsePrice = (raw: string): number | undefined => {
  const value = Number(raw.trim());
  return raw.trim() !== "" && Number.isFinite(value) ? value : undefined;
};

/** The exit's prices as typed; a blank or unreadable one is left out for the server to name. */
function exitDraft(exit: NonNullable<TicketFields["exit"]>): NonNullable<TicketDraft["exit"]> {
  const takeProfit = parsePrice(exit.takeProfit);
  const stop = parsePrice(exit.stop);
  return {
    ...(takeProfit !== undefined ? { takeProfit } : {}),
    ...(stop !== undefined ? { stop } : {}),
  };
}

/** Whether the draft carries the member's exit: they added one, the setting admits them, and the
 *  entry is one an exit can ride. An exit added and then left behind by a switch to Sell or Market
 *  is not sent — the form hides it there too. */
export function carriesExit(fields: TicketFields, exitAtEntry: boolean): boolean {
  return exitAtEntry && fields.exit !== undefined && exitFits(fields);
}

/**
 * Form state → the draft that goes over the wire. Only the prices the chosen class actually uses
 * are carried: a stop price left over from a previous edit must never ride along on a market
 * order, where the server would have no reason to look at it and the member no way to see it.
 * The same rule keeps an exit off any draft that can't carry one (`carriesExit`); a draft with an
 * exit sends no time in force, since the server sends it GTC and the form says so (`ticket-exit.ts`).
 */
export function buildDraft(
  participantId: string,
  fields: TicketFields,
  exitAtEntry = false,
): TicketDraft {
  const prices: { limitPrice?: number; stopPrice?: number } = {};
  for (const field of priceFieldsFor(fields.orderType)) {
    const price = parsePrice(fields[field]);
    if (price !== undefined) prices[field] = price;
  }
  const exit = carriesExit(fields, exitAtEntry) && fields.exit ? exitDraft(fields.exit) : undefined;
  return {
    participantId,
    symbol: fields.symbol.trim().toUpperCase(),
    quantity: Number(fields.quantity),
    action: fields.action,
    ...(fields.orderType !== "market" ? { orderType: fields.orderType } : {}),
    ...prices,
    ...(fields.timeInForce && !exit ? { timeInForce: fields.timeInForce } : {}),
    ...(exit ? { exit } : {}),
  };
}

/** Whether a carry was typed for this ticket's symbol — the only case it may be offered back. */
export function carryFits(
  carry: { readonly symbol: string } | undefined,
  symbol: string | undefined,
): boolean {
  return (
    carry !== undefined &&
    carry.symbol !== "" &&
    carry.symbol === (symbol ?? "").trim().toUpperCase()
  );
}
