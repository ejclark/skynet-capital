import type { TicketPreview } from "../trading/order-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";
import { formatPrice, reviewLine } from "./desk-data.js";
import { formatCurrency } from "./render-atoms.js";

/**
 * THE SIZE OF THE BET, IN DOLLARS — the review screen's headline number.
 *
 * "BUY 100 MSFT" is not a quantity a person can feel; "≈ $51,250, leaving you ≈ $697,395" is.
 * A review step that can't say either has done half its job, and before this the screen could
 * only price a symbol the account already held — a first buy read "unknown until it fills",
 * and a limit or stop order ignored the price the trader had just typed.
 *
 * This module is PRESENTATION, deliberately: `src/trading/order-ticket.ts` owns order
 * construction and sizing, and its estimate is the one the refusal rules are computed from
 * (the position's mark, or nothing). Here we only ever *show* a number, so we can price off
 * the limit/stop price and off a fresh quote without touching the money-moving layer. When the
 * two bases disagree the screen shows both — the basis caption names the price this estimate
 * used, and the "Last known price" line above it stays exactly where it was.
 *
 * The one invariant: never invent a price. No price of any kind → the screen says the cost is
 * unknown until it fills, which is the truth and is what a paper desk owes a learner.
 */

/** Which price the estimate was struck off — each one carries a different promise. */
type EstimateBasis = "limit" | "stop" | "quote" | "mark";

export interface OrderEstimate {
  readonly basis: EstimateBasis;
  /** Per-share price the estimate used. */
  readonly price: number;
  /** Dollars out (buy) or in (sell), before any commission the broker doesn't charge here. */
  readonly notional: number;
  /** Settled cash after a fill at `price`. */
  readonly cashAfter: number;
}

/** The disclaimer every estimated figure on this screen points at with its asterisk. */
const ESTIMATE_DISCLAIMER =
  "Estimate only. Actual cost, proceeds, and resulting cash balance may vary depending on the execution price when the order fills.";

function usablePrice(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Price the ticket for display. Precedence is "the price this order actually references":
 * a limit order is struck at its limit, a stop order at its trigger, and a market order at the
 * best market price we have — the held position's mark, else a quote the route fetched.
 * Undefined means no price was available anywhere, and the caller must say so out loud.
 */
export function estimateOrder(
  preview: TicketPreview,
  cash: number,
  quotePrice?: number,
): OrderEstimate | undefined {
  const { quantity } = preview;
  if (!Number.isFinite(quantity) || quantity <= 0) return undefined;

  const limit = preview.orderType === "limit" ? usablePrice(preview.limitPrice) : undefined;
  const stop = preview.orderType === "stop" ? usablePrice(preview.stopPrice) : undefined;
  const mark = usablePrice(preview.estPrice);
  const quote = usablePrice(quotePrice);

  const [price, basis]: [number | undefined, EstimateBasis] =
    limit !== undefined
      ? [limit, "limit"]
      : stop !== undefined
        ? [stop, "stop"]
        : mark !== undefined
          ? [mark, "mark"]
          : [quote, "quote"];
  if (price === undefined) return undefined;

  const notional = price * quantity;
  return {
    basis,
    price,
    notional,
    cashAfter: cash + (preview.action === "sell" ? notional : -notional),
  };
}

/** The sentence under the headline number: how many shares, at which price, and what that
 *  price does and does not promise. A stop's caption is the loudest, because a stop price is
 *  the one figure a learner is most likely to mistake for a fill price. */
function basisCaption(preview: TicketPreview, estimate: OrderEstimate): string {
  const shares = `${preview.quantity.toLocaleString("en-US")} share${preview.quantity === 1 ? "" : "s"}`;
  const at = formatPrice(estimate.price);
  if (estimate.basis === "limit") {
    return `${shares} at your limit price of ${at} — the fill could come in better than this, and an unfilled limit order costs nothing at all.`;
  }
  if (estimate.basis === "stop") {
    return `${shares} at your ${at} stop trigger — the trigger only starts a market order, so the real fill lands wherever the market is when it goes off.`;
  }
  return `${shares} at the latest market price of ${at}.`;
}

/** The headline figure: label, big number, and the caption that says what it's struck off. */
function estimateHeadline(preview: TicketPreview, estimate: OrderEstimate): string {
  const label = preview.action === "buy" ? "Estimated cost" : "Estimated proceeds";
  return `<div class="review-estimate">
      <div class="review-estimate-k">${label}<sup>*</sup></div>
      <div class="review-estimate-v">≈ ${escapeHtml(formatCurrency(estimate.notional))}</div>
      <div class="review-estimate-basis">${escapeHtml(basisCaption(preview, estimate))}</div>
    </div>`;
}

/**
 * The one `previewOrder` warning a fetched quote makes UNTRUE. It fires whenever the ticket
 * layer has no position mark to price from — precisely the case this screen now covers with a
 * live quote — and leaving it up would have the screen state a price and deny having one in the
 * same breath. Only a real market price retires it: a limit or stop order on an unheld symbol
 * still has no market quote, so the warning is still true there and stays.
 *
 * Matched on the upstream clause and fail-safe by construction: if that wording ever changes,
 * the filter simply stops matching and the warning stays on screen (the conservative direction),
 * while `order-estimate.spec.ts` goes red so the drift is caught rather than shipped.
 */
const NO_PRICE_WARNING = "No recent price for this symbol";

/**
 * The mirror duty: an estimate can also make a warning NECESSARY that the ticket layer never
 * raised. `previewOrder` only refuses "costs more than your cash" when it had a mark to price
 * from, so a buy of an unheld symbol — or one struck at a limit above the mark — can reach the
 * screen as a confirmable order that plainly drains the account past zero. Nothing here refuses
 * it (that is the money-moving layer's call, and this module is presentation), but the screen
 * must never render a negative "cash after" in silence. Skipped when the order is already
 * refused: a blocked order does not need a second voice telling it so.
 */
function overspendWarning(preview: TicketPreview, estimate: OrderEstimate): string | undefined {
  if (preview.action !== "buy" || preview.refusals.length > 0 || estimate.cashAfter >= 0) {
    return undefined;
  }
  return `Estimated cost is about ${formatCurrency(-estimate.cashAfter)} more than your available cash. Nothing here refuses it, but the broker won't fill an order the account can't fund.`;
}

/** The preview's warnings, minus any the live quote has already answered, plus any the estimate
 *  itself makes necessary. What the screen says about a number must match the number. */
export function liveWarnings(
  preview: TicketPreview,
  estimate: OrderEstimate | undefined,
): readonly string[] {
  if (!estimate) return preview.warnings;
  const kept =
    estimate.basis === "quote"
      ? preview.warnings.filter((warning) => !warning.startsWith(NO_PRICE_WARNING))
      : preview.warnings;
  const overspend = overspendWarning(preview, estimate);
  return overspend === undefined ? kept : [...kept, overspend];
}

/**
 * The whole money block of the review screen: what the trade is worth, what cash is on hand,
 * what cash is left after, and the asterisk that keeps all three honest. With no price
 * available it degrades to the old, truthful "unknown until it fills" — one line, no headline,
 * and no cash-after claim we can't stand behind.
 */
export function renderOrderEstimate(
  preview: TicketPreview,
  cash: number,
  estimate: OrderEstimate | undefined,
): string {
  if (!estimate) {
    return `${reviewLine(
      preview.action === "buy" ? "Estimated cost" : "Estimated proceeds",
      "unknown until it fills",
    )}${reviewLine("Cash now", formatCurrency(cash))}`;
  }
  return `${estimateHeadline(preview, estimate)}
      ${reviewLine("Cash now", formatCurrency(cash))}
      ${reviewLine("Estimated cash after order*", `≈ ${formatCurrency(estimate.cashAfter)}`)}
      <p class="review-fineprint">* ${escapeHtml(ESTIMATE_DISCLAIMER)}</p>`;
}
