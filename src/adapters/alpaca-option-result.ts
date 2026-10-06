import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";
import type { OptionLegFill, OrderIntent, OrderResult } from "../domain/types.js";

/**
 * What a bot's option order became, from the broker's last read of it (#4642 slice 5). PURE.
 *
 * A result is `filled` only on a quantity the broker confirmed filled; `unfilled` when it ended with
 * nothing traded (the limit was not reached, and the bot canceled it); `rejected` when the broker
 * refused it; and `working` when it is still live — a cancel that was not confirmed — so the caller
 * keeps it pending and rechecks it next cycle. Never a guess in either direction.
 */

/** Alpaca statuses after which an order can never fill again. */
const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  "filled",
  "canceled",
  "expired",
  "rejected",
  "done_for_day",
  "replaced",
]);

export function isTerminalOrder(order: AlpacaOrder): boolean {
  return TERMINAL_STATUSES.has(order.status);
}

/** A broker number that is really there: `null`, `""` and junk stay absent, never a fake 0. */
function brokerNumber(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** What filled. A `filled` status is the broker confirming the whole quantity, so a payload that
 *  omits `filled_qty` on one still reads as its `qty`. */
export function filledQuantityOf(order: AlpacaOrder): number {
  const filled = brokerNumber(order.filled_qty) ?? 0;
  return filled === 0 && order.status === "filled" ? (brokerNumber(order.qty) ?? 0) : filled;
}

/**
 * Per share, in Alpaca's sign for a spread (+ debit paid, − credit received): the parent's own
 * `filled_avg_price` when it reports one, else Σ legs (buy +, sell −) × ratio × leg fill price —
 * and nothing at all when any leg's price is missing, rather than a net built from part of it.
 */
export function netFillPrice(order: AlpacaOrder): number | undefined {
  const parent = brokerNumber(order.filled_avg_price);
  if (parent !== undefined) return parent;
  const legs = order.legs ?? [];
  if (legs.length === 0) return undefined;
  let net = 0;
  for (const leg of legs) {
    const price = brokerNumber(leg.filled_avg_price);
    if (price === undefined) return undefined;
    net += (leg.side === "buy" ? 1 : -1) * (brokerNumber(leg.ratio_qty) ?? 1) * price;
  }
  // Sums of per-share fills drift in the 15th decimal.
  return Math.round(net * 1e6) / 1e6;
}

/** Each contract's own fill: the broker's legs for a spread, the order itself for one leg. A
 *  spread leg keeps its own order id, because the account reports the leg's fill under it. */
function legFillsOf(order: AlpacaOrder, intent: OrderIntent): readonly OptionLegFill[] | undefined {
  const fill = (occSymbol: string, from: AlpacaOrder, orderId?: string): OptionLegFill => {
    const price = brokerNumber(from.filled_avg_price);
    return {
      occSymbol,
      filledQuantity: filledQuantityOf(from),
      ...(price !== undefined ? { filledPrice: price } : {}),
      ...(orderId ? { orderId } : {}),
    };
  };
  if (order.legs && order.legs.length > 0) {
    return order.legs.map((leg) =>
      fill(leg.symbol, leg, leg.id && leg.id !== order.id ? leg.id : undefined),
    );
  }
  const [only, second] = intent.option?.legs ?? [];
  return only && !second ? [fill(only.occSymbol, order)] : undefined;
}

/** A limit in words: a spread's credit reads as one, never as a negative price. */
function limitWords(limitPrice: number): string {
  return `$${Math.abs(limitPrice).toFixed(2)}${limitPrice < 0 ? " credit" : ""}`;
}

export function settledOptionResult(
  intent: OrderIntent,
  order: AlpacaOrder,
  waitedMs: number,
): OrderResult {
  const base = { intent, orderId: order.id };
  const filled = filledQuantityOf(order);
  if (filled > 0 && isTerminalOrder(order)) {
    const price = netFillPrice(order);
    const legFills = legFillsOf(order, intent);
    return {
      ...base,
      status: "filled",
      filledQuantity: filled,
      ...(price !== undefined ? { filledPrice: price } : {}),
      ...(legFills ? { legFills } : {}),
      ...(filled < intent.quantity ? { reason: "partial fill; remainder canceled" } : {}),
    };
  }
  if (order.status === "rejected") return { ...base, status: "rejected", reason: "order rejected" };
  if (isTerminalOrder(order)) {
    const limit = limitWords(intent.option?.limitPrice ?? 0);
    const seconds = Math.round(waitedMs / 1000);
    return {
      ...base,
      status: "unfilled",
      reason: `limit ${limit} not reached in ${seconds}s; ${order.status.replaceAll("_", " ")}`,
    };
  }
  return { ...base, status: "working", reason: "cancel not confirmed — rechecked next cycle" };
}
