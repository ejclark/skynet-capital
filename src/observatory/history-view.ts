import type { DecisionRecord } from "../autonomous/decision-record.js";
import { type RoundTrip, type RoundTripLedger, totalRealized } from "../trading/round-trips.js";
import { realizedByDay } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import {
  ACTIVITY_TYPES,
  ACTIVITY_WINDOWS,
  type ActivitySource,
  type ActivityTypeFilter,
  type ActivityWindow,
  filterActivity,
  type TradeActivityRecord,
  windowCutoff,
} from "./activity-store.js";
import { renderShell } from "./dashboard-shell.js";
import { type DecisionContext, decisionContextFor } from "./decision-context.js";
import { deskLedger, formatHold, formatPrice, mergedDeskActivity } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskFrame, deskHref } from "./desk-tabs.js";
import type { ActivityView, ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatActivityTime, formatSigned, pct, plClass, tzAbbrev } from "./render-atoms.js";

/**
 * TRADE HISTORY — the closed trades AND the durable order log behind them.
 *
 * Two tables, two questions. The **round trips** answer "what did each trade earn" — fills matched
 * FIFO in `trading/round-trips.ts`, now over the durable activity ledger (`activity-store.ts`)
 * rather than the broker's last-few-orders window, so an autonomous bot's history no longer
 * scrolls away. The **order activity** blotter is the ledger itself: every order, its fill state,
 * where the record came from, and — for a bot — the decision context that fired it, folded one
 * click away (`decision-context.ts`).
 *
 * Both respect the window filter (7/30/90 days, all); the type filter (buys/sells) applies to the
 * order log only — a round trip pairs a buy WITH a sell, so filtering trips by side would be a
 * nonsense the view refuses rather than renders. Filters are plain links (`?window=`, `?type=`),
 * the same no-JS pattern as the desk tabs, so every filtered view is shareable.
 */

export interface HistoryViewOptions extends DeskViewOptions {
  /** The durable trade-activity ledger for this participant (merged with the broker window). */
  readonly tradeActivity?: readonly TradeActivityRecord[];
  readonly activityWindow?: ActivityWindow;
  readonly activityType?: ActivityTypeFilter;
  /** A bot's autonomous decision audit trail, for the per-order "why" fold. */
  readonly decisions?: readonly DecisionRecord[];
}

type ActivityRow = ActivityView & { readonly source?: ActivitySource };

function historyHref(
  participantId: string,
  window: ActivityWindow,
  type: ActivityTypeFilter,
): string {
  return `${deskHref(participantId, "history")}&window=${window}&type=${type}`;
}

/** The two chip rows. Plain links; the active chip is the one the current URL selected. */
function filterBar(
  participantId: string,
  window: ActivityWindow,
  type: ActivityTypeFilter,
): string {
  const windowChips = ACTIVITY_WINDOWS.map(
    (w) =>
      `<a class="fchip${w.key === window ? " active" : ""}" href="${historyHref(participantId, w.key, type)}"${w.key === window ? ' aria-current="true"' : ""}>${w.label}</a>`,
  ).join("");
  const typeChips = ACTIVITY_TYPES.map(
    (t) =>
      `<a class="fchip${t.key === type ? " active" : ""}" href="${historyHref(participantId, window, t.key)}"${t.key === type ? ' aria-current="true"' : ""}>${t.label}</a>`,
  ).join("");
  return `<nav class="filterbar" aria-label="History filters">
      <span class="filter-k">Window</span><span class="fchips">${windowChips}</span>
      <span class="filter-k">Type</span><span class="fchips">${typeChips}</span>
    </nav>`;
}

function dayStrip(trips: readonly RoundTrip[], timezone: string | undefined): string {
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
      <td><span class="sym">${escapeHtml(trip.symbol)}</span></td>
      <td class="num">${trip.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatPrice(trip.entryPrice)}</td>
      <td class="num">${formatPrice(trip.exitPrice)}</td>
      <td class="num">${formatPrice(basis)}</td>
      <td class="num">${escapeHtml(formatHold(trip.holdMs))}</td>
      <td class="num ${plClass(trip.realized)}">${formatSigned(trip.realized)}</td>
      <td class="num ${plClass(trip.realized)}">${pct(trip.returnPct)}</td>
    </tr>`;
}

function tripsTable(trips: readonly RoundTrip[], timezone: string | undefined): string {
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

/** Says out loud what the record couldn't see, instead of presenting a partial as a whole. */
function caveats(ledger: RoundTripLedger, hasDurable: boolean): string {
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

/** The one-click-away decision context behind a bot's order (Eric, 2026-08-20): the logic that
 *  drove the action, the strategy being deployed, and how we expected the market to behave. */
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

function ledgerRow(
  row: ActivityRow,
  timezone: string | undefined,
  context: DecisionContext | undefined,
  showWhy: boolean,
): string {
  const badge = row.source === "backfill" ? ` <span class="src-badge">backfilled</span>` : "";
  return `<tr>
      <td class="tcell">${escapeHtml(formatActivityTime(row.at, timezone))}</td>
      <td><span class="${row.side === "buy" ? "pos" : "neg"}">${escapeHtml(row.side.toUpperCase())}</span> <span class="sym">${escapeHtml(row.symbol)}</span></td>
      <td class="num">${row.filledQuantity.toLocaleString("en-US")}/${row.quantity.toLocaleString("en-US")}</td>
      <td class="num">${row.price !== undefined ? formatPrice(row.price) : "—"}</td>
      <td>${escapeHtml(row.status)}${badge}</td>
      ${showWhy ? whyCell(context) : ""}
    </tr>`;
}

function activityBlotter(
  rows: readonly ActivityRow[],
  snapshot: ParticipantSnapshot,
  decisions: readonly DecisionRecord[],
): string {
  const showWhy = snapshot.kind === "bot" && decisions.length > 0;
  const body =
    rows.length === 0
      ? `<p class="desk-empty">No orders match this window and type. Try widening the filters above.</p>`
      : `<div class="blotter-inline">
      <table class="blotter">
        <thead><tr><th class="tcell">Time ${escapeHtml(tzAbbrev(snapshot.timezone))}</th><th>Order</th><th class="num">Filled</th><th class="num">Price</th><th>Status</th>${showWhy ? "<th>Context</th>" : ""}</tr></thead>
        <tbody>${rows
          .map((row) =>
            ledgerRow(
              row,
              snapshot.timezone,
              showWhy ? decisionContextFor(row, decisions) : undefined,
              showWhy,
            ),
          )
          .join("")}</tbody>
      </table>
    </div>`;
  return `<section class="panel">
      <h2 class="panel-title">Order activity</h2>
      <p class="panel-sub">The durable order ledger — every order, its fill state, and where the record came from. The type filter applies here; round trips above always pair a buy with a sell.${showWhy ? " Each row's <b>why</b> unfolds the decision cycle that fired it." : ""}</p>
      ${body}
    </section>`;
}

export function renderHistoryBody(
  snapshot: ParticipantSnapshot,
  options: HistoryViewOptions = {},
): string {
  const { asOf, header } = deskFrame(snapshot, "history", options, {
    title: "Trade history",
    sub: "Closed round trips and the order ledger behind them, matched first-in-first-out from the recorded fills.",
  });
  const window = options.activityWindow ?? "30d";
  const type = options.activityType ?? "all";
  const now = new Date(asOf);
  const durable = options.tradeActivity ?? [];

  // FIFO honesty: trips are matched over the FULL record, then windowed by close time — matching
  // inside a window would orphan sells from their opening buys and invent truncation.
  const merged = mergedDeskActivity(snapshot, durable) as readonly ActivityRow[];
  const ledger = deskLedger(snapshot, durable);
  const cutoff = windowCutoff(window, now);
  const trips = cutoff ? ledger.trips.filter((t) => t.closedAt >= cutoff) : ledger.trips;
  const realized = totalRealized(trips);
  const orders = filterActivity(merged, { window, type, now }).sort((a, b) =>
    b.at.localeCompare(a.at),
  );
  const windowLabel = ACTIVITY_WINDOWS.find((w) => w.key === window)?.label ?? window;

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    ${filterBar(snapshot.id, window, type)}
    <div class="desk-tiles">
      <div class="desk-tile lead"><span class="desk-k">Closed trades</span><span class="desk-v">${trips.length}</span><span class="desk-note">${escapeHtml(windowLabel.toLowerCase())}</span></div>
      <div class="desk-tile"><span class="desk-k">Realized P/L</span><span class="desk-v ${plClass(realized)}">${formatSigned(realized)}</span><span class="desk-note">locked in, not on paper</span></div>
      <div class="desk-tile"><span class="desk-k">Orders</span><span class="desk-v">${orders.length}</span><span class="desk-note">${type === "all" ? "buys + sells" : `${type}s only`}</span></div>
      <div class="desk-tile"><span class="desk-k">Still open</span><span class="desk-v">${ledger.open.length}</span><span class="desk-note">lots awaiting an exit</span></div>
    </div>
    ${caveats(ledger, durable.length > 0)}
    ${dayStrip(trips, snapshot.timezone)}
    ${tripsTable(trips, snapshot.timezone)}
    ${activityBlotter(orders, snapshot, options.decisions ?? [])}
  </section>`,
    asOf,
  );
}
