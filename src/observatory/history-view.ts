import type { RoundTrip, RoundTripLedger } from "../trading/round-trips.js";
import { totalRealized } from "../trading/round-trips.js";
import { realizedByDay } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import { renderShell } from "./dashboard-shell.js";
import { deskLedger, formatHold, formatPrice } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskFrame } from "./desk-tabs.js";
import type { ActivityView, ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import {
  formatActivityTime,
  formatCurrency,
  formatSigned,
  pct,
  plClass,
  tzAbbrev,
} from "./render-atoms.js";

/**
 * TRADE HISTORY — the closed trades, not the order log.
 *
 * The distinction is the whole point of the view. A broker's activity feed is a list of *fills*;
 * what a trader wants to review is the **round trip** — "I was in AAPL for three days and made
 * $220" — reconstructed by FIFO matching in `trading/round-trips.ts`. The raw fills are still here,
 * folded away below, because they're the receipts behind each trip.
 *
 * The day strip above the table is the one piece of pure delight: a run of squares, green days and
 * red days, so a month of trading reads in one glance before a single number is parsed.
 */

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
      <p class="panel-sub">One square per day you closed something, oldest first. Green days paid; red days cost.</p>
      <div class="daystrip">${squares}</div>
      <div class="daystrip-legend">
        <span><i class="swatch" style="background:var(--pos)"></i>${green} green</span>
        <span><i class="swatch" style="background:var(--neg)"></i>${red} red</span>
        <span>${days.length} day${days.length === 1 ? "" : "s"} with a close</span>
      </div>
    </section>`;
}

function tripRow(trip: RoundTrip, timezone: string | undefined): string {
  return `<tr>
      <td class="tcell">${escapeHtml(formatActivityTime(trip.closedAt, timezone))}</td>
      <td><span class="sym">${escapeHtml(trip.symbol)}</span></td>
      <td class="num">${trip.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatPrice(trip.entryPrice)}</td>
      <td class="num">${formatPrice(trip.exitPrice)}</td>
      <td class="num">${escapeHtml(formatHold(trip.holdMs))}</td>
      <td class="num ${plClass(trip.realized)}">${formatSigned(trip.realized)}</td>
      <td class="num ${plClass(trip.realized)}">${pct(trip.returnPct)}</td>
    </tr>`;
}

function tripsTable(ledger: RoundTripLedger, timezone: string | undefined): string {
  if (ledger.trips.length === 0) {
    return `<div class="blotter-wrap"><p class="desk-empty">No closed trades in the recorded window yet. A trade lands here the moment you sell what you bought — that's when a paper gain becomes a real one.</p></div>`;
  }
  const rows = [...ledger.trips]
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
    .map((trip) => tripRow(trip, timezone))
    .join("");
  return `<div class="blotter-wrap">
      <table class="blotter">
        <thead><tr>
          <th class="tcell">Closed</th><th>Symbol</th><th class="num">Qty</th><th class="num">Entry</th>
          <th class="num">Exit</th><th class="num">Held</th><th class="num">Realized</th><th class="num">Return</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/** Says out loud what the reconstruction couldn't see, instead of presenting a partial as a whole. */
function caveats(ledger: RoundTripLedger): string {
  const notes: string[] = [];
  if (ledger.truncated) {
    notes.push(
      `<b>History begins mid-trade.</b> ${ledger.unmatchedSellQuantity.toLocaleString("en-US")} share(s) were sold out of a position opened before this window, so those closes aren't scored here.`,
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

function fillsLog(activity: readonly ActivityView[], timezone: string | undefined): string {
  if (activity.length === 0) return "";
  const rows = [...activity]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(
      (row) => `<tr>
        <td class="tcell">${escapeHtml(formatActivityTime(row.at, timezone))}</td>
        <td><span class="${row.side === "buy" ? "pos" : "neg"}">${escapeHtml(row.side.toUpperCase())}</span> <span class="sym">${escapeHtml(row.symbol)}</span></td>
        <td class="num">${row.filledQuantity.toLocaleString("en-US")}/${row.quantity.toLocaleString("en-US")}</td>
        <td class="num">${row.price !== undefined ? formatPrice(row.price) : "—"}</td>
        <td>${escapeHtml(row.status)}</td>
      </tr>`,
    )
    .join("");
  return `<details class="fills">
      <summary>Raw fills — the receipts behind each trade (${activity.length})</summary>
      <div class="blotter-wrap">
        <table class="blotter">
          <thead><tr><th class="tcell">Time ${escapeHtml(tzAbbrev(timezone))}</th><th>Order</th><th class="num">Filled</th><th class="num">Price</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </details>`;
}

export function renderHistoryBody(
  snapshot: ParticipantSnapshot,
  options: DeskViewOptions = {},
): string {
  const { asOf, header } = deskFrame(snapshot, "history", options, {
    title: "Trade history",
    sub: "Closed round trips — bought, then sold — matched first-in-first-out from the recorded fills.",
  });
  const ledger = deskLedger(snapshot);
  const realized = totalRealized(ledger.trips);

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    <div class="desk-tiles">
      <div class="desk-tile lead"><span class="desk-k">Closed trades</span><span class="desk-v">${ledger.trips.length}</span></div>
      <div class="desk-tile"><span class="desk-k">Realized P/L</span><span class="desk-v ${plClass(realized)}">${formatSigned(realized)}</span><span class="desk-note">locked in, not on paper</span></div>
      <div class="desk-tile"><span class="desk-k">Still open</span><span class="desk-v">${ledger.open.length}</span><span class="desk-note">lots awaiting an exit</span></div>
    </div>
    ${caveats(ledger)}
    ${dayStrip(ledger.trips, snapshot.timezone)}
    ${tripsTable(ledger, snapshot.timezone)}
    ${fillsLog(snapshot.activity ?? [], snapshot.timezone)}
  </section>`,
    asOf,
  );
}
