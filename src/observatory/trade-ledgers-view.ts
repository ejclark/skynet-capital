import type { DecisionRecord } from "../autonomous/decision-record.js";
import { humanizeOptionSymbol } from "../trading/option-symbols.js";
import type { RoundTrip, RoundTripLedger } from "../trading/round-trips.js";
import { realizedByDay } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { ActivitySource } from "./activity-store.js";
import { type DecisionContext, decisionContextFor } from "./decision-context.js";
import { formatHold, formatPrice } from "./desk-data.js";
import {
  NO_ORIGIN_EVIDENCE,
  type OrderOrigin,
  type OrderOriginIndex,
  orderOrigin,
} from "./order-origin.js";
import type { ActivityView, ParticipantSnapshot } from "./participant-snapshot.js";
import { formatActivityTime, formatSigned, pct, plClass, tzAbbrev } from "./render-atoms.js";

/**
 * PERFORMANCE'S RECEIPTS — the two record-level tables at the bottom of the tab (the closed round
 * trips, and the raw order ledger behind them) plus the caveats that say what each one couldn't see.
 * Split out of `performance-view.ts` as one cohesive group: every function here renders a row or a
 * table of historical trade records, as distinct from the summary tiles/curve above the fold.
 */

export type ActivityRow = ActivityView & { readonly source?: ActivitySource };

/** Says out loud what the record couldn't see, instead of presenting a partial as a whole. */
export function caveats(ledger: RoundTripLedger, hasDurable: boolean): string {
  const notes: string[] = [];
  if (!hasDurable) {
    notes.push(
      `<b>Only the broker's recent-order window is visible here.</b> The durable trade ledger has no records for this account yet — run <code>npm run backfill:activity</code> once to capture the full history retroactively.`,
    );
  }
  if (ledger.truncated) {
    notes.push(
      `<b>History begins mid-trade.</b> ${ledger.unmatchedSellQuantity.toLocaleString("en-US")} share(s) were sold out of a position opened before the recorded history, so those closes aren't scored here.`,
    );
  }
  if (ledger.unpricedFills > 0) {
    notes.push(
      `<b>${ledger.unpricedFills} fill(s) carry no recorded price</b>, so they're excluded rather than counted as zero.`,
    );
  }
  if (ledger.open.length > 0) {
    notes.push(
      `<b>${ledger.open.length} lot(s) still open</b> — they'll appear here once closed. See <a href="?tab=positions">Active</a>.`,
    );
  }
  return notes.map((note) => `<p class="caveat">${note}</p>`).join("");
}

export function dayStrip(trips: readonly RoundTrip[], timezone: string | undefined): string {
  const days = realizedByDay(trips, timezone ?? "America/New_York");
  if (days.length === 0) return "";
  const green = days.filter((d) => d.realized > 0).length;
  const red = days.filter((d) => d.realized < 0).length;
  const squares = days
    .map(
      (day) =>
        `<span class="day ${plClass(day.realized)}" title="${escapeHtml(day.day)} · ${formatSigned(
          day.realized,
        )} over ${day.trades} trade${day.trades === 1 ? "" : "s"}"></span>`,
    )
    .join("");
  return `<section class="panel">
      <h2 class="panel-title">Trading days</h2>
      <p class="panel-sub">One square per day you closed something in this window, oldest first. Green days paid; red days cost.</p>
      <div class="daystrip">${squares}</div>
      <div class="daystrip-legend">
        <span><i class="swatch" style="background:var(--pos)"></i>${green} green</span>
        <span><i class="swatch" style="background:var(--neg)"></i>${red} red</span>
        <span>${days.length} day${days.length === 1 ? "" : "s"} with a close</span>
      </div>
    </section>`;
}

function tripRow(trip: RoundTrip, timezone: string | undefined): string {
  const basis = trip.entryPrice * trip.quantity;
  return `<tr>
      <td class="tcell">${escapeHtml(formatActivityTime(trip.closedAt, timezone))}</td>
      <td><span class="sym" title="${escapeHtml(trip.symbol)}">${escapeHtml(humanizeOptionSymbol(trip.symbol))}</span></td>
      <td class="num">${trip.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatPrice(trip.entryPrice)}</td>
      <td class="num">${formatPrice(trip.exitPrice)}</td>
      <td class="num">${formatPrice(basis)}</td>
      <td class="num">${escapeHtml(formatHold(trip.holdMs))}</td>
      <td class="num ${plClass(trip.realized)}">${formatSigned(trip.realized)}</td>
      <td class="num ${plClass(trip.realized)}">${pct(trip.returnPct)}</td>
    </tr>`;
}

export function tripsTable(trips: readonly RoundTrip[], timezone: string | undefined): string {
  if (trips.length === 0) {
    return `<div class="blotter-wrap"><p class="desk-empty">No closed trades in this window. A trade lands here the moment you sell what you bought — that's when a paper gain becomes a real one. Try a wider window above.</p></div>`;
  }
  const rows = [...trips]
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
    .map((trip) => tripRow(trip, timezone))
    .join("");
  return `<div class="blotter-wrap">
      <table class="blotter">
        <thead><tr>
          <th class="tcell">Closed</th><th>Symbol</th><th class="num">Qty</th>
          <th class="num" title="Price paid per share — the cost basis of one share">Entry / share</th>
          <th class="num" title="Price received per share on the close">Exit / share</th>
          <th class="num" title="Total paid: shares × entry per share">Cost basis</th>
          <th class="num">Held</th><th class="num">Realized</th><th class="num">Return</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function whyCell(context: DecisionContext | undefined): string {
  if (!context) return `<td class="num"><span class="desk-note">—</span></td>`;
  const strategy = context.strategy
    ? `<span class="why-line"><b>Strategy</b> ${escapeHtml(context.strategy)}</span>`
    : "";
  const expecting = context.expectation
    ? `<span class="why-line"><b>Expecting</b> ${escapeHtml(context.expectation)}</span>`
    : "";
  const play = context.playbookId
    ? `<span class="why-line"><b>Playbook</b> ${escapeHtml(context.playbookId)}${context.playbookMode ? ` (${escapeHtml(context.playbookMode)})` : ""}</span>`
    : "";
  const guard = context.guardNote
    ? `<span class="why-line"><b>Guards</b> ${escapeHtml(context.guardNote)}</span>`
    : "";
  return `<td><details class="why"><summary>why</summary><div class="why-body">
      <span class="why-line">${escapeHtml(context.reason)}</span>
      ${strategy}${expecting}${play}${guard}
      <span class="why-line why-meta">${escapeHtml(context.mode)} cycle · ${escapeHtml(context.action)} · matched from the decision log by symbol and time</span>
    </div></details></td>`;
}

/** Eric's own sizing note for the Alpaca-direct tell: "a smaller footprint, similar to `*`". A
 *  glyph beside the symbol, keyed by the footnote under the table — never a second badge. */
function directMark(origin: OrderOrigin): string {
  return origin === "alpaca-direct"
    ? ` <span class="direct-mark" role="img" title="Placed directly in Alpaca — this order never went through the app's ticket" aria-label="Placed directly in Alpaca">*</span>`
    : "";
}

function ledgerRow(
  row: ActivityRow,
  timezone: string | undefined,
  context: DecisionContext | undefined,
  showWhy: boolean,
  origin: OrderOrigin,
): string {
  const badge = row.source === "backfill" ? ` <span class="src-badge">backfilled</span>` : "";
  return `<tr>
      <td class="tcell">${escapeHtml(formatActivityTime(row.at, timezone))}</td>
      <td><span class="${row.side === "buy" ? "pos" : "neg"}">${escapeHtml(row.side.toUpperCase())}</span> <span class="sym" title="${escapeHtml(row.symbol)}">${escapeHtml(humanizeOptionSymbol(row.symbol))}</span>${directMark(origin)}</td>
      <td class="num">${row.filledQuantity.toLocaleString("en-US")}/${row.quantity.toLocaleString("en-US")}</td>
      <td class="num">${row.price !== undefined ? formatPrice(row.price) : "—"}</td>
      <td>${escapeHtml(row.status)}${badge}</td>
      ${showWhy ? whyCell(context) : ""}
    </tr>`;
}

/** The raw order ledger, folded — receipts behind the round-trips table, not the headline. */
export function foldedLedger(
  rows: readonly ActivityRow[],
  snapshot: ParticipantSnapshot,
  decisions: readonly DecisionRecord[],
  origins: OrderOriginIndex = NO_ORIGIN_EVIDENCE,
): string {
  const showWhy = snapshot.kind === "bot" && decisions.length > 0;
  const marked = rows.map((row) => ({ row, origin: orderOrigin(row, origins) }));
  const body =
    rows.length === 0
      ? `<p class="desk-empty">No orders match this window and type. Try widening the filters above.</p>`
      : `<div class="blotter-inline">
      <table class="blotter">
        <thead><tr><th class="tcell">Time ${escapeHtml(tzAbbrev(snapshot.timezone))}</th><th>Order</th><th class="num">Filled</th><th class="num">Price</th><th>Status</th>${showWhy ? "<th>Context</th>" : ""}</tr></thead>
        <tbody>${marked
          .map(({ row, origin }) =>
            ledgerRow(
              row,
              snapshot.timezone,
              showWhy ? decisionContextFor(row, decisions) : undefined,
              showWhy,
              origin,
            ),
          )
          .join("")}</tbody>
      </table>
    </div>`;
  // A bare glyph is a mystery: the key appears only when a row actually carries one, and it says
  // the process gap out loud rather than leaving the member to infer it (#782).
  const legend = marked.some(({ origin }) => origin === "alpaca-direct")
    ? `<p class="caveat"><span class="direct-mark" aria-hidden="true">*</span> <b>Placed directly in Alpaca.</b> These orders skipped this app's ticket, so none of the desk's pre-trade checks — buying-power, trade-type gate, the review screen — ever saw them, and no play tag was recorded for them.</p>`
    : "";
  return `<details class="fills">
      <summary>Order activity — ${rows.length} order${rows.length === 1 ? "" : "s"} · the raw ledger behind the trips, folded as receipts</summary>
      ${body}${legend}
    </details>`;
}
