import { humanizeOptionSymbol } from "../trading/option-symbols.js";
import type { OptionTicketPreview } from "../trading/option-ticket.js";
import type { TicketPreview } from "../trading/order-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";
import { renderShell } from "./dashboard-shell.js";
import { formatPrice, reviewLine as line, reviewNotices } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskHref } from "./desk-tabs.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatCurrency } from "./render-atoms.js";
import { payoffSvg } from "./ticket-charts.js";

/**
 * THE REVIEW SCREEN — the step between intent and execution.
 *
 * Nothing is sent from a click on the blotter. The order is restated in full ("SELL 10 AAPL,
 * about $1,200, leaving you $9,400 and no position"), warnings are raised, and only a second,
 * explicit confirm submits it. This is the single most valuable UX pattern in retail brokerage and
 * it costs one page: it converts a mis-keyed quantity from a filled order into a corrected one.
 *
 * A refused order renders *here*, with its reasons, instead of throwing or bouncing — being told
 * plainly why an order can't go is part of the education this app exists for.
 */

/** The order line's trailing clause and the confirm form's price — one number, one meaning,
 *  read off whichever field the order type actually uses. */
function orderTypeLabel(preview: TicketPreview): string {
  if (preview.orderType === "limit" && preview.limitPrice !== undefined) {
    return `limit ${formatPrice(preview.limitPrice)}/sh`;
  }
  if (preview.orderType === "stop" && preview.stopPrice !== undefined) {
    return `stop ${formatPrice(preview.stopPrice)}/sh`;
  }
  return "market";
}

function orderTypeExplainer(preview: TicketPreview): string {
  if (preview.orderType === "limit") {
    return "This holds until the market reaches your limit price or better, then fills — the figures below are estimates.";
  }
  if (preview.orderType === "stop") {
    return "This holds until the market reaches your stop price, then sends a market order — the stop price triggers the order, it doesn't guarantee the fill price.";
  }
  return "A market order fills at whatever the market says when it lands, so the figures below are estimates.";
}

function confirmForm(preview: TicketPreview, backHref: string): string {
  const verb = preview.action === "buy" ? "Buy" : "Sell";
  if (!preview.ok) {
    return `<div class="review-actions"><a class="btn" href="${backHref}">← Back to your positions</a></div>`;
  }
  const price = preview.limitPrice ?? preview.stopPrice;
  return `<form class="review-actions" method="post" action="/trade">
      <input type="hidden" name="symbol" value="${escapeHtml(preview.symbol)}">
      <input type="hidden" name="quantity" value="${preview.quantity}">
      <input type="hidden" name="action" value="${escapeHtml(preview.action)}">
      <input type="hidden" name="ordertype" value="${escapeHtml(preview.orderType)}">
      ${price !== undefined ? `<input type="hidden" name="price" value="${price}">` : ""}
      <input type="hidden" name="confirm" value="1">
      <button class="btn btn-primary" type="submit">Confirm — ${verb.toLowerCase()} ${preview.quantity} ${escapeHtml(preview.symbol)}</button>
      <a class="btn" href="${backHref}">Cancel</a>
    </form>`;
}

export function renderTradeReviewBody(
  snapshot: ParticipantSnapshot,
  preview: TicketPreview,
  options: DeskViewOptions = {},
): string {
  const asOf = options.generatedAt ?? new Date().toISOString();
  const backHref = deskHref(snapshot.id, "positions");
  const verb = preview.action === "buy" ? "Buy" : "Sell";
  const notional =
    preview.estNotional === undefined
      ? "unknown until it fills"
      : formatCurrency(preview.estNotional);

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    <header class="desk-head">
      <div>
        <div class="desk-eyebrow">Review order</div>
        <h1 class="desk-title">${escapeHtml(verb)} ${preview.quantity.toLocaleString("en-US")} ${escapeHtml(preview.symbol)}</h1>
        <p class="desk-sub">${
          preview.ok
            ? `Nothing has been sent yet. Check the numbers, then confirm — ${orderTypeExplainer(preview)}`
            : "This order can't be sent. Here's exactly why."
        }</p>
      </div>
    </header>
    <section class="panel review">
      ${line("Account", snapshot.displayName)}
      ${line("Order", `${verb.toUpperCase()} ${preview.quantity.toLocaleString("en-US")} ${preview.symbol} · ${orderTypeLabel(preview)}`)}
      ${preview.estPrice !== undefined ? line("Last known price", formatPrice(preview.estPrice)) : ""}
      ${line(preview.action === "buy" ? "Estimated cost" : "Estimated proceeds", notional)}
      ${line("Cash now", formatCurrency(snapshot.cash))}
      ${preview.estCashAfter !== undefined ? line("Cash after (est.)", formatCurrency(preview.estCashAfter)) : ""}
      ${
        preview.positionAfter !== undefined
          ? line(
              "Position after",
              `${preview.positionAfter.toLocaleString("en-US")} share${preview.positionAfter === 1 ? "" : "s"}`,
            )
          : ""
      }
      ${reviewNotices(preview.warnings, preview.refusals)}
      ${confirmForm(preview, backHref)}
    </section>
    <p class="caveat"><b>Paper account.</b> This is simulated capital on a paper brokerage — real prices, real mechanics, no real money. ${
      preview.action === "sell" ? "Selling books the gain or loss for real in your record." : ""
    }</p>
  </section>`,
    asOf,
  );
}

/**
 * THE OPTIONS REVIEW SCREEN — the option ticket's step between intent and execution. The order is restated in full broker language with its plain gloss
 * ("SELL 2 × MSFT $420 PUT · limit $10.70 · day — you collect $2,140 and set aside $84,000"),
 * the payoff shape is drawn, warnings are raised, and only the explicit confirm sends it. A
 * refused order renders here with its reasons — being told plainly why a promise can't be made
 * is the education.
 */

/** One line of broker grammar for the order: side, count, contract, price, life span. */
function orderSentence(preview: OptionTicketPreview): string {
  const contract = preview.occSymbol
    ? humanizeOptionSymbol(preview.occSymbol)
    : `${preview.underlying} ${String(preview.optionType ?? "").toUpperCase()}`;
  const price =
    preview.orderType === "limit" && preview.limitPrice !== undefined
      ? `limit ${formatPrice(preview.limitPrice)}/sh`
      : "market";
  return `${preview.side.toUpperCase()} ${preview.contracts} × ${contract} · ${price} · day`;
}

function optionConfirmForm(preview: OptionTicketPreview, backHref: string): string {
  if (!preview.ok) {
    return `<div class="review-actions"><a class="btn" href="${backHref}">← Back to the ticket</a></div>`;
  }
  const fields: [string, string][] =
    preview.code === "close"
      ? [
          ["close", preview.occSymbol ?? ""],
          ["contracts", String(preview.contracts)],
        ]
      : [
          ["play", preview.code],
          ["symbol", preview.underlying],
          ["contracts", String(preview.contracts)],
          ["strike", String(preview.strike ?? "")],
          ["exp", preview.expiration ?? ""],
          ["ordertype", preview.orderType],
          ["limit", preview.limitPrice === undefined ? "" : String(preview.limitPrice)],
        ];
  const hidden = fields
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
    .join("");
  return `<form class="review-actions" method="post" action="/trade">
      ${hidden}
      <input type="hidden" name="confirm" value="1">
      <button class="btn btn-primary" type="submit">Confirm — ${escapeHtml(orderSentence(preview).toLowerCase())}</button>
      <a class="btn" href="${backHref}">Cancel</a>
    </form>`;
}

export function renderOptionReviewBody(
  snapshot: ParticipantSnapshot,
  preview: OptionTicketPreview,
  options: DeskViewOptions & { backHref?: string } = {},
): string {
  const asOf = options.generatedAt ?? new Date().toISOString();
  const backHref = options.backHref ?? deskHref(snapshot.id, "positions");
  const isCredit = preview.side === "sell";

  const notionalLabel =
    preview.code === "close"
      ? isCredit
        ? "Estimated proceeds"
        : "Estimated cost to close"
      : isCredit
        ? "Premium you'd collect (est.)"
        : "Premium you'd pay (est.)";

  const maxProfit =
    preview.maxProfit === undefined
      ? undefined
      : preview.maxProfit === "uncapped"
        ? "uncapped ↑"
        : `+${formatCurrency(preview.maxProfit)}`;

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    <header class="desk-head">
      <div>
        <div class="desk-eyebrow">Review order</div>
        <h1 class="desk-title">${escapeHtml(orderSentence(preview))}</h1>
        <p class="desk-sub">${
          preview.ok
            ? "Nothing has been sent yet. Check the numbers, then confirm. Premium figures are indicative — the fill settles at the market."
            : "This order can't be sent. Here's exactly why."
        }</p>
      </div>
    </header>
    <section class="panel review">
      ${line("Account", snapshot.displayName)}
      ${line("Order", orderSentence(preview))}
      ${preview.estPremium !== undefined ? line("Premium per share (est.)", formatPrice(preview.estPremium)) : ""}
      ${preview.estNotional !== undefined ? line(notionalLabel, formatCurrency(preview.estNotional)) : ""}
      ${preview.collateral !== undefined ? line("Cash set aside (the “secured”)", formatCurrency(preview.collateral)) : ""}
      ${preview.sharesCommitted !== undefined ? line("Shares committed (the “covered”)", preview.sharesCommitted.toLocaleString("en-US")) : ""}
      ${maxProfit !== undefined ? line("Max profit", maxProfit, "pl-pos") : ""}
      ${preview.maxLoss !== undefined ? line("Max loss", `−${formatCurrency(preview.maxLoss)}`, "pl-neg") : ""}
      ${preview.breakeven !== undefined ? line("Breakeven at expiration", formatPrice(preview.breakeven)) : ""}
      ${line("Cash now", formatCurrency(snapshot.cash))}
      ${reviewNotices(preview.warnings, preview.refusals)}
      ${optionConfirmForm(preview, backHref)}
    </section>
    ${preview.ok && preview.code !== "close" ? `<section class="panel"><div class="desk-k" style="margin-bottom:8px">At expiration · P/L vs stock price</div>${payoffSvg(preview)}</section>` : ""}
    <p class="caveat"><b>Paper account.</b> Simulated capital on a paper brokerage — real prices, real mechanics, no real money. Options orders on Alpaca are day-only; unfilled orders expire with the session.</p>
  </section>`,
    asOf,
  );
}
