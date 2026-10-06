import type { OptionOrderIntent, OrderIntent, OrderResult } from "../domain/types.js";
import { OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { formatPrice } from "./desk-data.js";

/**
 * What a bot's filled option order cost or brought in, in dollars (#4642 criterion 8). The broker
 * quotes an option per SHARE, so "filled at $2.05" undersells a sold put by 100x: one contract is
 * 100 shares, and the cash that moved was $205. A spread is one order whose legs pay and receive at
 * once, so it is netted into the one number that left or reached the account.
 *
 * Each leg's own fill is preferred (its side says which way the cash went, unambiguously); a spread
 * with no leg prices falls back to the broker's signed net, + paid and − received — the convention
 * the order flow sends its limit in. Nothing is returned for an order that did not fill, or whose
 * fill price was never confirmed: an unknown cost is left unsaid, never shown as $0.
 */

export interface OptionFillCost {
  /** The cash that moved for the whole order, never negative. */
  readonly dollars: number;
  readonly direction: "paid" | "received";
  /** Contracts filled — for a spread, how many of the whole spread. */
  readonly quantity: number;
  /** Per share: the contract's fill price, or a spread's net. Never negative. */
  readonly perShare: number;
  readonly spread: boolean;
}

const sign = (side: "buy" | "sell"): number => (side === "buy" ? 1 : -1);

/** Paid (+) or received (−) per share, for one of the whole order. */
function signedPerShare(
  option: OptionOrderIntent,
  result: OrderResult,
  quantity: number,
): number | undefined {
  const fills = option.legs.map((leg) => ({
    leg,
    fill: result.legFills?.find((f) => f.occSymbol === leg.occSymbol),
  }));
  const [only, second] = fills;
  if (only && !second) {
    const price = only.fill?.filledPrice ?? result.filledPrice;
    return price === undefined ? undefined : sign(only.leg.side) * Math.abs(price);
  }
  if (fills.every(({ fill }) => fill?.filledPrice !== undefined && fill.filledQuantity > 0)) {
    // Each leg's cash over the spreads filled — a 1:2 ratio leg counts twice per spread.
    const total = fills.reduce(
      (sum, { leg, fill }) =>
        sum + sign(leg.side) * (fill?.filledPrice ?? 0) * (fill?.filledQuantity ?? 0),
      0,
    );
    return total / quantity;
  }
  return result.filledPrice;
}

export function optionFillCost(
  intent: OrderIntent,
  result: OrderResult | undefined,
): OptionFillCost | undefined {
  const option = intent.option;
  if (!option || result?.status !== "filled") return undefined;
  const quantity = result.filledQuantity ?? 0;
  if (!(quantity > 0)) return undefined;
  const perShare = signedPerShare(option, result, quantity);
  if (perShare === undefined || !Number.isFinite(perShare)) return undefined;
  return costOf(perShare, quantity, option.legs.length > 1);
}

/** Cents, so a net summed from per-share legs never prints a float's tail. */
function costOf(signedPerShare: number, quantity: number, spread: boolean): OptionFillCost {
  const dollars = Math.round(Math.abs(signedPerShare) * OPTION_MULTIPLIER * quantity * 100) / 100;
  return {
    dollars,
    direction: signedPerShare < 0 ? "received" : "paid",
    quantity,
    perShare: Math.abs(signedPerShare),
    spread,
  };
}

/** One leg of a spread as the account filled it: a bought leg paid, a sold one received —
 *  `"$510.00 paid — 1 contract × 100 shares × $5.10"` once worded. Undefined with nothing filled or
 *  no price, never a $0. */
export function optionLegCost(
  side: "buy" | "sell",
  perShare: number | undefined,
  contracts: number,
): OptionFillCost | undefined {
  if (perShare === undefined || !Number.isFinite(perShare) || !(contracts > 0)) return undefined;
  return costOf(sign(side) * Math.abs(perShare), contracts, false);
}

/** `"$205.00 received — 1 contract × 100 shares × $2.05"` ·
 *  `"$340.00 paid — 1 spread × 100 shares × $3.40 net"`: the sum shown, so the ×100 is learned. */
export function optionFillCostWords(cost: OptionFillCost): string {
  const unit = cost.spread ? "spread" : "contract";
  const count = `${cost.quantity} ${unit}${cost.quantity === 1 ? "" : "s"}`;
  const net = cost.spread ? " net" : "";
  return `${formatPrice(cost.dollars)} ${cost.direction} — ${count} × ${OPTION_MULTIPLIER} shares × ${formatPrice(cost.perShare)}${net}`;
}
