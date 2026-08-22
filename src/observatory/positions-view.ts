import { humanizeOptionSymbol, isOccSymbol } from "../trading/option-symbols.js";
import { ROLL_UNAVAILABLE_REASON } from "../trading/order-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import { formatPrice } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { type DeskNotice, deskFrame, deskNoticeBanner } from "./desk-tabs.js";
import { participantInvested, participantUnrealized } from "./participant-card.js";
import {
  costBasis,
  dayPl,
  type ParticipantSnapshot,
  type PositionView,
  unrealizedPl,
} from "./participant-snapshot.js";
import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";

/**
 * ACTIVE TRADES — the blotter, and the only desk view that can *change* something.
 *
 * The row is the unit of interaction: what you hold, what it's worth, what it's done, and the
 * actions that act on it, all on one line with nothing hidden behind a menu. Every action is a
 * form POST that lands on a **review screen** before anything is sent (see
 * `trading/order-ticket.ts`) — the pattern every brokerage converges on, because the review step is
 * where a mis-keyed quantity dies.
 *
 * Two honesty rules bind this view:
 *  - **Roll is rendered disabled with its real reason**, not hidden and not faked. This account
 *    path trades shares; there is no options leg to roll. Showing a working-looking Roll button
 *    would imply a capability the app doesn't have, which `docs/BRAND.md` forbids outright.
 *  - **Trading off is stated, not implied.** When the desk's execution flag is off, the ticket
 *    still renders — visibly disabled, with the reason — so the surface is honest about being a
 *    preview rather than silently inert.
 */

export interface DeskViewOptions extends DashboardViewOptions {
  readonly isSelf?: boolean;
  readonly generatedAt?: string;
  /** Member-initiated orders are switched on for this deployment (owner's call; off by default). */
  readonly tradingEnabled?: boolean;
  /** Result of the action that redirected back here. */
  readonly notice?: DeskNotice;
}

function blotterRow(
  position: PositionView,
  invested: number,
  options: { isSelf: boolean; tradingEnabled: boolean },
): string {
  const pl = unrealizedPl(position);
  const basis = costBasis(position);
  const returnPct = basis > 0 ? (pl / basis) * 100 : 0;
  const day = dayPl(position);
  const mark = position.quantity !== 0 ? position.marketValue / position.quantity : 0;
  const weight = invested > 0 ? (Math.max(0, position.marketValue) / invested) * 100 : 0;
  const symbol = escapeHtml(position.symbol);

  return `<tr>
      <td>
        <span class="sym" title="${symbol}">${escapeHtml(humanizeOptionSymbol(position.symbol))}</span>
        <span class="weight-bar" title="${weight.toFixed(1)}% of invested capital"><i style="width:${Math.min(100, Math.max(2, weight)).toFixed(1)}%"></i></span>
      </td>
      <td class="num">${position.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatPrice(position.avgPrice)}</td>
      <td class="num">${formatPrice(mark)}</td>
      <td class="num">${formatPrice(basis)}</td>
      <td class="num">${formatCurrency(position.marketValue)}</td>
      <td class="num ${plClass(day.amount)}">${formatSigned(day.amount)}</td>
      <td class="num ${plClass(day.amount)}">${day.pct === null ? "—" : pct(day.pct)}</td>
      <td class="num ${plClass(pl)}">${formatSigned(pl)}</td>
      <td class="num ${plClass(pl)}">${pct(returnPct)}</td>
      <td class="num">${rowActions(position, options)}</td>
    </tr>`;
}

/** Per-row actions: trim a partial quantity, close the lot, or the honestly-disabled roll. */
function rowActions(
  position: PositionView,
  options: { isSelf: boolean; tradingEnabled: boolean },
): string {
  if (!options.isSelf) return `<span class="desk-note">—</span>`;
  const symbol = escapeHtml(position.symbol);
  const disabled = options.tradingEnabled ? "" : " disabled";
  if (isOccSymbol(position.symbol)) {
    // Option rows close in the right DIRECTION automatically: a long sells to close, a short
    // (a put/call you wrote) buys to close — the route reads the held sign, not this form.
    const held = Math.abs(position.quantity);
    const verb = position.quantity < 0 ? "Buy to close" : "Sell to close";
    return `<form class="rowform" method="post" action="/trade">
        <input type="hidden" name="close" value="${symbol}">
        <label class="visually-hidden" for="qty-${symbol}">Contracts of ${symbol} to close</label>
        <input class="qty" id="qty-${symbol}" name="contracts" type="number" min="1" step="1" max="${held}" value="${held}" inputmode="numeric"${disabled}>
        <button class="btn btn-sell" type="submit"${disabled}>${verb}</button>
        <button class="btn" type="button" disabled title="${escapeHtml(ROLL_UNAVAILABLE_REASON)}">Roll</button>
      </form>`;
  }
  return `<form class="rowform" method="post" action="/trade">
        <input type="hidden" name="symbol" value="${symbol}">
        <input type="hidden" name="action" value="sell">
        <label class="visually-hidden" for="qty-${symbol}">Shares of ${symbol} to sell</label>
        <input class="qty" id="qty-${symbol}" name="quantity" type="number" min="1" step="1" max="${position.quantity}" value="${position.quantity}" inputmode="numeric"${disabled}>
        <button class="btn btn-sell" type="submit"${disabled}>Sell</button>
        <button class="btn" type="button" disabled title="${escapeHtml(ROLL_UNAVAILABLE_REASON)}">Roll</button>
      </form>`;
}

function blotter(
  snapshot: ParticipantSnapshot,
  options: { isSelf: boolean; tradingEnabled: boolean },
): string {
  const invested = participantInvested(snapshot);
  if (snapshot.positions.length === 0) {
    return `<div class="blotter-wrap"><p class="desk-empty">No open positions — waiting is a position. Cash on the sidelines is ${formatCurrency(
      snapshot.cash,
    )}.</p></div>`;
  }
  const rows = [...snapshot.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((position) => blotterRow(position, invested, options))
    .join("");
  return `<div class="blotter-wrap">
      <table class="blotter">
        <thead><tr>
          <th>Symbol</th>
          <th class="num">Qty</th>
          <th class="num" title="Average price paid per share — the cost basis of one share">Cost / share</th>
          <th class="num" title="The latest price the position is valued at (the &quot;mark&quot;)">Price</th>
          <th class="num" title="Total paid: shares × cost per share">Cost basis</th>
          <th class="num">Value</th>
          <th class="num">Day P/L</th>
          <th class="num">Day %</th>
          <th class="num">Total P/L</th>
          <th class="num">Return</th>
          <th class="num">Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/** The new-order ticket. Renders in every state; only its inputs go dead when trading is off. */
function orderTicket(tradingEnabled: boolean): string {
  const disabled = tradingEnabled ? "" : " disabled";
  const gate = tradingEnabled
    ? `<p class="desk-note">Paper account · market order · you'll review the estimated cost before anything is sent.</p>`
    : `<p class="caveat"><b>Preview only.</b> Placing orders from the desk needs sign-in configured for this deployment — the ticket reviews and refuses rather than sending.</p>`;
  return `<section class="panel">
      <h2 class="panel-title">New trade</h2>
      <p class="panel-sub">Quick share ticket. For options — cash-secured puts, covered calls, long calls and puts — open the <a href="/trade">Trade ticket</a>, which walks the play and shows the chain.</p>
      <form class="ticket" method="post" action="/trade">
        <div class="field">
          <label for="t-symbol">Symbol</label>
          <input id="t-symbol" name="symbol" type="text" autocomplete="off" spellcheck="false" placeholder="AAPL" maxlength="8"${disabled}>
        </div>
        <div class="field">
          <label for="t-qty">Shares</label>
          <input id="t-qty" name="quantity" type="number" min="1" step="1" inputmode="numeric" placeholder="10"${disabled}>
        </div>
        <div class="field">
          <label for="t-action">Side</label>
          <select id="t-action" name="action"${disabled}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div class="field">
          <button class="btn btn-primary" type="submit"${disabled}>Review order</button>
        </div>
      </form>
      ${gate}
    </section>`;
}

export function renderPositionsBody(
  snapshot: ParticipantSnapshot,
  options: DeskViewOptions = {},
): string {
  const tradingEnabled = Boolean(options.tradingEnabled);
  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  const returnPct = invested > 0 ? (pl / invested) * 100 : 0;
  const dayTotal = snapshot.positions.reduce((sum, position) => sum + dayPl(position).amount, 0);

  const { isSelf, asOf, header } = deskFrame(snapshot, "positions", options, {
    title: "Active trades",
    sub: options.isSelf
      ? "Everything you're holding right now, what it's worth, and what it's done since you opened it."
      : `Everything ${snapshot.displayName} is holding right now. Read-only — you can only trade your own account.`,
  });

  if (snapshot.error) {
    return renderShell(
      options.nav,
      `${DESK_STYLE}<section class="desk">${header}
      <p class="note-stop">Account unreachable — this desk can't read positions right now.${
        isSelf ? ` <a href="/rotate">Regenerated your key? Rotate your credentials</a>.` : ""
      }</p></section>`,
      asOf,
    );
  }

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    ${deskNoticeBanner(options.notice)}
    <div class="desk-tiles">
      <div class="desk-tile lead"><span class="desk-k">Open positions</span><span class="desk-v">${snapshot.positions.length}</span></div>
      <div class="desk-tile"><span class="desk-k">Invested</span><span class="desk-v">${formatCurrency(invested)}</span></div>
      <div class="desk-tile"><span class="desk-k">Day P/L</span><span class="desk-v ${plClass(dayTotal)}">${formatSigned(dayTotal)}</span><span class="desk-note">today's move, all positions</span></div>
      <div class="desk-tile"><span class="desk-k">Unrealized P/L</span><span class="desk-v ${plClass(pl)}">${formatSigned(pl)}</span><span class="desk-note">${pct(returnPct)} on cost</span></div>
      <div class="desk-tile"><span class="desk-k">Cash</span><span class="desk-v">${formatCurrency(snapshot.cash)}</span><span class="desk-note">dry powder</span></div>
    </div>
    ${blotter(snapshot, { isSelf, tradingEnabled })}
    ${isSelf ? orderTicket(tradingEnabled) : ""}
  </section>`,
    asOf,
  );
}
