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
 *  client can send, which is the whole reason it is spelled out here rather than left as string. */
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
  /** A take-profit and stop sent with a limit buy as one bracket (#8249) — only an admitted session. */
  readonly exit?: { readonly takeProfit?: number; readonly stop?: number };
}

/** The server's exit echo on a preview: both prices and each leg's dollars against the limit. */
export interface ExitPreview {
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
  readonly exit?: ExitPreview;
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
      /** A bracket's exits as the BROKER echoed them (#8249) — what the receipt names. */
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
  /** "Add an exit" is on (#8249). Undefined on a ticket that never offered it. */
  readonly withExit?: boolean;
  /** The exit's raw prices — empty until the member types them; nothing is ever prefilled. */
  readonly takeProfit?: string;
  readonly exitStop?: string;
}

export const ORDER_TYPE_LABELS: Record<TicketOrderType, string> = {
  market: "Market",
  limit: "Limit",
  stop: "Stop-Market",
  stop_limit: "Stop-Limit",
};

/** The classes the select offers. Stop-Limit only to a session the exit-at-entry setting admits
 *  (#8249); every other session sees exactly the three it saw before, in the same order. */
export function orderTypesFor(exitAtEntry: boolean): readonly TicketOrderType[] {
  return exitAtEntry ? ["market", "limit", "stop", "stop_limit"] : ["market", "limit", "stop"];
}

/** Whether this ticket may carry an exit: an admitted session, a limit BUY (#8249). */
export const exitAllowed = (exitAtEntry: boolean, fields: TicketFields): boolean =>
  exitAtEntry && fields.action === "buy" && fields.orderType === "limit";

/** The panel's subtitle names the order types the select actually offers. */
export function panelSubtitle(exitAtEntry: boolean): string {
  return exitAtEntry
    ? "Paper account · market, limit, stop or stop-limit, and an exit on a limit buy · the gate reviews before anything is sent"
    : "Paper account · market, limit or stop · the gate reviews before anything is sent";
}

/** The one sentence on when a bracket's exits act — Alpaca's own rule, stated before the order. */
export const EXIT_HOURS_NOTE =
  "Guards regular hours only: the take-profit and stop don't act between 4pm and 9:30am ET.";

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
  return {
    symbol: fields.symbol.trim().toUpperCase(),
    quantity: fields.quantity,
    // A stop-limit's limit is tied to its stop, which never crosses sides: neither goes (#8249).
    ...(priced && fields.orderType !== "stop_limit"
      ? { priced: { orderType: fields.orderType, limitPrice: fields.limitPrice } }
      : {}),
    ...(fields.timeInForce ? { timeInForce: fields.timeInForce } : {}),
  };
}

/** Which price this order class needs from the member — undefined when it needs none. */
export function priceFieldFor(orderType: TicketOrderType): "limitPrice" | "stopPrice" | undefined {
  if (orderType === "limit") return "limitPrice";
  if (orderType === "stop") return "stopPrice";
  return undefined;
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
    return `${wait}Stays dormant until the stop price trades, then becomes a limit order at your limit price — it fills at that price or better, or not at all. Unlike Stop-Market, it can be left unfilled in a fast move.`;
  }
  return `${wait}Stays dormant until the stop price trades, then turns into a plain market order. It will fill — but at whatever the market is paying at that moment, which in a fast move can be well past your stop.`;
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
export function buildDraft(
  participantId: string,
  fields: TicketFields,
  exitAtEntry = false,
): TicketDraft {
  const field = priceFieldFor(fields.orderType);
  const price = field === undefined ? undefined : parsePrice(fields[field]);
  return {
    participantId,
    symbol: fields.symbol.trim().toUpperCase(),
    quantity: Number(fields.quantity),
    action: fields.action,
    ...(fields.orderType !== "market" ? { orderType: fields.orderType } : {}),
    ...(field !== undefined && price !== undefined ? { [field]: price } : {}),
    ...stopLimitPrices(fields),
    ...(fields.timeInForce ? { timeInForce: fields.timeInForce } : {}),
    ...(exitAtEntry ? exitOf(fields) : {}),
  };
}

/** A stop-limit carries both prices (#8249); an unparsable one is left out for the server to name. */
function stopLimitPrices(fields: TicketFields): Pick<TicketDraft, "stopPrice" | "limitPrice"> {
  if (fields.orderType !== "stop_limit") return {};
  const stop = parsePrice(fields.stopPrice);
  const limit = parsePrice(fields.limitPrice);
  return {
    ...(stop !== undefined ? { stopPrice: stop } : {}),
    ...(limit !== undefined ? { limitPrice: limit } : {}),
  };
}

/** The exit rides only a limit buy with "Add an exit" on; a price left blank goes as absent, and
 *  the server refuses it in words rather than this form guessing one. */
function exitOf(fields: TicketFields): Pick<TicketDraft, "exit"> {
  if (!fields.withExit || fields.action !== "buy" || fields.orderType !== "limit") return {};
  const takeProfit = parsePrice(fields.takeProfit ?? "");
  const stop = parsePrice(fields.exitStop ?? "");
  return {
    exit: {
      ...(takeProfit !== undefined ? { takeProfit } : {}),
      ...(stop !== undefined ? { stop } : {}),
    },
  };
}

/** One line per exit, from the server's preview — the dollars are the server's, signed in words as
 *  well as by sign, so neither hue nor a minus sign carries the meaning alone. The stop's is
 *  "about": once triggered it sells at the market. */
export function exitLines(exit: ExitPreview): readonly string[] {
  const vs = (dollars: number | undefined, about: boolean): string => {
    if (dollars === undefined) return "";
    const word = dollars >= 0 ? "gained" : "lost";
    return ` · ${about ? "about " : ""}${money(Math.abs(dollars))} ${word} against your limit`;
  };
  return [
    `Take-profit ${money(exit.takeProfit)}${vs(exit.takeProfitDollars, false)}`,
    `Stop ${money(exit.stop)}, sells at market${vs(exit.stopDollars, true)}`,
  ];
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
