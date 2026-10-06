import type { OptionLegFill, OptionLegOrder, OrderResult } from "./types.js";

/**
 * What an order a bot left `working` turned out to be, once the broker ended it (#4650, plan
 * #4642 slice 8). A day limit whose cancel was not confirmed, or a share order queued for the open,
 * is recorded `working` at submit; the broker may fill it afterwards. The decision record is the
 * audit trail of what was known at the time, so it is never rewritten: the outcome is kept beside
 * it, keyed by the broker's order id, and read through the decision wherever its result is shown or
 * scored (`settledResult`). PURE.
 */

/** How a `working` order ended: traded at least once, or never. A share order that ended with
 *  nothing filled reads `rejected`, exactly as one that ended inside the submit's own poll does. */
export type SettledStatus = "filled" | "unfilled" | "rejected";
export const SETTLED_STATUSES: readonly SettledStatus[] = ["filled", "unfilled", "rejected"];

/** One contract of a settled option order, as the broker reported it. */
export interface SettlementLeg {
  readonly occSymbol: string;
  /** A spread leg's own broker order id — the id the account's fill for it carries. Absent on a
   *  one-leg order, whose id is the order's. */
  readonly orderId?: string;
  /** Contracts this leg filled. */
  readonly filledQuantity: number;
  /** Per share, as the broker reported the leg. */
  readonly filledPrice?: number;
}

export interface OrderSettlement {
  /** The broker's order id — the key; one order settles once. */
  readonly orderId: string;
  /** The bot's own stamp, for an option order whose broker id the decision never learned. */
  readonly clientOrderId?: string;
  readonly status: SettledStatus;
  /** 0 when nothing filled. For a spread, whole spreads. */
  readonly filledQuantity: number;
  /** Per share; a spread's signed net (+ paid, − received). Absent when nothing filled or the
   *  broker never confirmed a price. */
  readonly filledPrice?: number;
  /** An option order's contracts; absent for shares. */
  readonly legs?: readonly SettlementLeg[];
  /** ISO-8601 — when the bot saw the order had ended. */
  readonly settledAt: string;
}

/** The legs a decision named, as fills — a contract it never placed is never joined to it. */
function legFillsOf(
  settlement: OrderSettlement,
  result: OrderResult,
): { legFills?: readonly OptionLegFill[] } {
  const named = new Set(result.intent.option?.legs.map((leg) => leg.occSymbol) ?? []);
  const legFills = (settlement.legs ?? [])
    .filter((leg) => named.has(leg.occSymbol))
    .map(
      (leg): OptionLegFill => ({
        occSymbol: leg.occSymbol,
        filledQuantity: leg.filledQuantity,
        ...(leg.filledPrice !== undefined ? { filledPrice: leg.filledPrice } : {}),
      }),
    );
  return legFills.length > 0 ? { legFills } : {};
}

/** A spread's leg order ids, from the settlement, for the legs the decision named — what a result
 *  carries when the submit never learned them (its answer listed no legs, or was lost). */
function legOrdersOf(
  settlement: OrderSettlement,
  result: OrderResult,
): { legOrders?: readonly OptionLegOrder[] } {
  if (result.legOrders) return { legOrders: result.legOrders };
  const named = result.intent.option?.legs ?? [];
  if (named.length < 2) return {};
  const legOrders = named.flatMap((leg): OptionLegOrder[] => {
    const id = settlement.legs?.find((l) => l.occSymbol === leg.occSymbol)?.orderId;
    return id && id !== settlement.orderId ? [{ occSymbol: leg.occSymbol, orderId: id }] : [];
  });
  return legOrders.length > 0 ? { legOrders } : {};
}

/**
 * A result read through its settlement. Only a `working` result is ever replaced — one the submit
 * already settled is returned untouched, whatever a settlement says — so a decision that ended on
 * time reads exactly as it was written. A spread keeps the leg order ids its result carried, or
 * takes the settlement's: a copy of the store that first sees this result already settled maps its
 * legs from them.
 */
export function settledResult(
  result: OrderResult,
  settlement: OrderSettlement | undefined,
): OrderResult {
  if (!settlement || result.status !== "working") return result;
  const filled = settlement.status === "filled" && settlement.filledQuantity > 0;
  return {
    intent: result.intent,
    status: settlement.status,
    orderId: result.orderId ?? settlement.orderId,
    ...(filled ? { filledQuantity: settlement.filledQuantity } : {}),
    ...(filled && settlement.filledPrice !== undefined
      ? { filledPrice: settlement.filledPrice }
      : {}),
    ...(filled ? legFillsOf(settlement, result) : {}),
    ...legOrdersOf(settlement, result),
  };
}
