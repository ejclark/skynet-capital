import type { TicketPreview } from "../trading/order-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";
import { renderShell } from "./dashboard-shell.js";
import { formatPrice } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskHref } from "./desk-tabs.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatCurrency } from "./render-atoms.js";

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

function line(label: string, value: string, cls?: string): string {
  return `<div class="review-line"><span>${escapeHtml(label)}</span><span${
    cls ? ` class="${cls}"` : ""
  }>${escapeHtml(value)}</span></div>`;
}

function confirmForm(preview: TicketPreview, backHref: string): string {
  const verb = preview.action === "buy" ? "Buy" : "Sell";
  if (!preview.ok) {
    return `<div class="review-actions"><a class="btn" href="${backHref}">← Back to your positions</a></div>`;
  }
  return `<form class="review-actions" method="post" action="/trade">
      <input type="hidden" name="symbol" value="${escapeHtml(preview.symbol)}">
      <input type="hidden" name="quantity" value="${preview.quantity}">
      <input type="hidden" name="action" value="${escapeHtml(preview.action)}">
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
            ? "Nothing has been sent yet. Check the numbers, then confirm — a market order fills at whatever the market says when it lands, so the figures below are estimates."
            : "This order can't be sent. Here's exactly why."
        }</p>
      </div>
    </header>
    <section class="panel review">
      ${line("Account", snapshot.displayName)}
      ${line("Order", `${verb.toUpperCase()} ${preview.quantity.toLocaleString("en-US")} ${preview.symbol} · market`)}
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
      ${preview.warnings.map((warning) => `<p class="note-warn">${escapeHtml(warning)}</p>`).join("")}
      ${preview.refusals.map((refusal) => `<p class="note-stop">${escapeHtml(refusal)}</p>`).join("")}
      ${confirmForm(preview, backHref)}
    </section>
    <p class="caveat"><b>Paper account.</b> This is simulated capital on a paper brokerage — real prices, real mechanics, no real money. ${
      preview.action === "sell" ? "Selling books the gain or loss for real in your record." : ""
    }</p>
  </section>`,
    asOf,
  );
}
