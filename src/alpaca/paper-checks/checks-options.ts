/**
 * The options-side paper checks (#8256): 6 options-extended-hours, 7 same-day-options,
 * 8 mleg-stock-leg. Every option buy is $0.01 on a contract whose indicative ask is $0.50 or more,
 * and check 8's net debit is 30% of one SPY share, so nothing here can fill.
 */
import { shiftDate } from "../../domain/market-clock.js";
import { type CheckAnswer, sayAll, verdict } from "./answer.js";
import {
  type Attempt,
  classify,
  type Desk,
  lastTrade,
  placeOrder,
  pricedCall,
  unfillableBuy,
} from "./desk.js";
import { etDate } from "./windows.js";

const optionBuy = (symbol: string, qty: number, extendedHours = false) => ({
  symbol,
  qty: String(qty),
  side: "buy",
  type: "limit",
  limit_price: 0.01,
  time_in_force: "day",
  position_intent: "buy_to_open",
  ...(extendedHours ? { extended_hours: true } : {}),
});

/**
 * Check 6 — the asset flag on the campaign's 15 names, then one extended-hours option bid. With no
 * name flagged there is nothing to bid on, so the row stays `not in window` (never `refused`: the
 * broker refused nothing) and a later run answers it.
 */
export async function optionsExtendedHours(desk: Desk): Promise<CheckAnswer> {
  const reads: Attempt[] = [];
  let flagged: string | undefined;
  for (const symbol of desk.campaignSymbols) {
    const response = await desk.trading.get(`/v2/assets/${encodeURIComponent(symbol)}`);
    const flag = (response.body as Record<string, unknown> | null)?.has_options_extended_hours;
    const said = typeof flag === "boolean" ? String(flag) : "absent";
    reads.push({ ...classify(`${symbol} has_options_extended_hours`, response), message: said });
    if (flag === true && flagged === undefined) flagged = symbol;
  }
  const fields = reads.map((r) => `${r.label.split(" ")[0]} ${r.message}`).join(", ");
  if (!flagged) {
    return {
      outcome: "not in window",
      answer: `no campaign name has has_options_extended_hours set yet (${fields}); no order sent`,
      attempts: reads,
    };
  }
  const contract = await pricedCall(desk, flagged, `expiration_date_gte=${etDate(desk.now())}`);
  if (!contract) {
    return {
      outcome: "error",
      answer: `${flagged} is flagged, but no call has an ask of $0.50 or more to bid under (${fields})`,
      attempts: reads,
    };
  }
  const sent = await placeOrder(
    desk,
    "options-extended-hours",
    `extended_hours option limit on ${flagged}`,
    optionBuy(contract.symbol, 1, true),
  );
  return {
    outcome: verdict([sent]),
    answer: `${sayAll([sent])}; flags: ${fields}`,
    attempts: [...reads, sent],
  };
}

/** Check 7 — a same-day SPY call bought to open, 1 contract and then `--same-day-qty`. */
export async function sameDayOptions(desk: Desk): Promise<CheckAnswer> {
  const today = etDate(desk.now());
  const contract = await pricedCall(desk, "SPY", `expiration_date=${today}`);
  if (!contract) {
    return {
      outcome: "not in window",
      answer: `SPY has no call expiring ${today} with an ask of $0.50 or more`,
      attempts: [],
    };
  }
  const one = await placeOrder(
    desk,
    "same-day-options",
    "1 contract expiring today",
    optionBuy(contract.symbol, 1),
  );
  const many = await placeOrder(
    desk,
    "same-day-options",
    `${desk.sameDayQty} contracts expiring today`,
    optionBuy(contract.symbol, desk.sameDayQty),
  );
  return { outcome: verdict([one, many]), answer: sayAll([one, many]), attempts: [one, many] };
}

/** Check 8 — one `mleg` order: 100 SPY shares bought and 1 SPY call sold, at a net that can't fill. */
export async function mlegStockLeg(desk: Desk): Promise<CheckAnswer> {
  const last = await lastTrade(desk, "SPY");
  const week = shiftDate(etDate(desk.now()), 7);
  const call = await pricedCall(
    desk,
    "SPY",
    `expiration_date_gte=${week}&strike_price_gte=${Math.ceil(last)}`,
  );
  if (!call) {
    return {
      outcome: "error",
      answer: "no SPY call a week or more out to sell against",
      attempts: [],
    };
  }
  const sent = await placeOrder(desk, "mleg-stock-leg", "mleg: 100 SPY bought, 1 call sold", {
    order_class: "mleg",
    qty: "1",
    type: "limit",
    limit_price: unfillableBuy(last),
    time_in_force: "day",
    legs: [
      { symbol: "SPY", ratio_qty: "100", side: "buy", position_intent: "buy_to_open" },
      { symbol: call.symbol, ratio_qty: "1", side: "sell", position_intent: "sell_to_open" },
    ],
  });
  return { outcome: verdict([sent]), answer: sayAll([sent]), attempts: [sent] };
}
