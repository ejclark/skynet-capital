import type { RoundTrip } from "../trading/round-trips.js";
import { statsBySymbol, type TradeStats, tradeStats } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { TradeActivityRecord } from "./activity-store.js";
import { renderShell } from "./dashboard-shell.js";
import { deskLedger, formatHold, formatPctOrDash, formatRatio } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskFrame } from "./desk-tabs.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";

/**
 * TRADE ANALYSIS — how your trades *behave*, as opposed to what your account is worth (that's the
 * Metrics tab). Every tile here is derived from closed round trips, so the view is honestly blank
 * until something has been sold.
 *
 * Each stat carries a plain-English gloss under it, on purpose. `docs/BRAND.md` calls for teaching
 * the play and naming the why; "profit factor 1.8" means nothing to a friend on their first paper
 * account, while "your wins pay for your losses 1.8× over" is a sentence they can act on. Giving
 * members the vocabulary is the point, not decoration.
 */

interface StatTile {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly cls?: string;
  readonly lead?: boolean;
}

function tiles(stats: TradeStats): StatTile[] {
  return [
    {
      label: "Win rate",
      value: formatPctOrDash(stats.winRate),
      note: `${stats.wins}W · ${stats.losses}L${stats.scratches > 0 ? ` · ${stats.scratches} flat` : ""}`,
      lead: true,
    },
    {
      label: "Profit factor",
      value: formatRatio(stats.profitFactor, "×"),
      note:
        stats.profitFactor === null
          ? "nothing lost yet — no ratio to take"
          : "gross wins ÷ gross losses; above 1× means the wins pay for the losses",
    },
    {
      label: "Expectancy",
      value: stats.expectancy === null ? "—" : formatSigned(stats.expectancy),
      note: "what one more trade is worth, on average",
      ...(stats.expectancy !== null ? { cls: plClass(stats.expectancy) } : {}),
    },
    {
      label: "Payoff ratio",
      value: formatRatio(stats.payoffRatio, "×"),
      note: "average win ÷ average loss; a low win rate is fine when this is high",
    },
    {
      label: "Net realized",
      value: formatSigned(stats.netRealized),
      note: "booked, not on paper",
      cls: plClass(stats.netRealized),
    },
    {
      label: "Avg hold",
      value: stats.avgHoldMs === null ? "—" : formatHold(stats.avgHoldMs),
      note: "entry fill to exit fill",
    },
  ];
}

function renderTiles(stats: TradeStats): string {
  return `<div class="desk-tiles">${tiles(stats)
    .map(
      (tile) => `<div class="desk-tile${tile.lead ? " lead" : ""}">
        <span class="desk-k">${escapeHtml(tile.label)}</span>
        <span class="desk-v${tile.cls ? ` ${tile.cls}` : ""}">${escapeHtml(tile.value)}</span>
        <span class="desk-note">${escapeHtml(tile.note)}</span>
      </div>`,
    )
    .join("")}</div>`;
}

function splitBar(stats: TradeStats): string {
  if (stats.trades === 0) return "";
  const share = (n: number) => (n / stats.trades) * 100;
  return `<section class="panel">
      <h2 class="panel-title">Wins, losses, scratches</h2>
      <p class="panel-sub">The shape of ${stats.trades} closed trade${stats.trades === 1 ? "" : "s"} — width is share of trades, not dollars.</p>
      <div class="splitbar">
        <i class="win" style="width:${share(stats.wins).toFixed(1)}%"></i>
        <i class="loss" style="width:${share(stats.losses).toFixed(1)}%"></i>
        <i class="scratch" style="width:${share(stats.scratches).toFixed(1)}%"></i>
      </div>
      <div class="splitbar-legend">
        <span><i class="swatch" style="background:var(--pos)"></i>${stats.wins} win${stats.wins === 1 ? "" : "s"} · ${formatSigned(stats.grossProfit)}</span>
        <span><i class="swatch" style="background:var(--neg)"></i>${stats.losses} loss${stats.losses === 1 ? "" : "es"} · ${formatSigned(-stats.grossLoss)}</span>
        ${stats.scratches > 0 ? `<span><i class="swatch" style="background:var(--muted)"></i>${stats.scratches} flat</span>` : ""}
      </div>
    </section>`;
}

function streakLine(stats: TradeStats): string {
  if (stats.currentStreak.kind === "none") return "";
  const { kind, length } = stats.currentStreak;
  const word = kind === "win" ? "green" : "red";
  const cheer =
    kind === "win"
      ? `${length} in a row — the discipline is paying.`
      : `${length} in a row — a cold streak is data, not a verdict.`;
  return `<p class="caveat"><b>Current run: ${length} ${word}.</b> ${escapeHtml(cheer)} Best green run ${stats.longestWinStreak} · longest cold run ${stats.longestLossStreak}.</p>`;
}

function extremes(stats: TradeStats): string {
  const line = (label: string, trip: RoundTrip | null) =>
    trip
      ? `<div class="review-line"><span>${label}</span><span class="${plClass(trip.realized)}">${escapeHtml(
          trip.symbol,
        )} · ${formatSigned(trip.realized)} · ${escapeHtml(formatHold(trip.holdMs))}</span></div>`
      : "";
  if (!(stats.bestTrade || stats.worstTrade)) return "";
  return `<section class="panel">
      <h2 class="panel-title">Your extremes</h2>
      <p class="panel-sub">The two trades that moved the needle most — worth re-reading before the next one.</p>
      ${line("Best trade", stats.bestTrade)}
      ${line("Worst trade", stats.worstTrade)}
      ${
        stats.avgWin !== null || stats.avgLoss !== null
          ? `<div class="review-line"><span>Average win / loss</span><span>${
              stats.avgWin === null ? "—" : formatCurrency(stats.avgWin)
            } / ${stats.avgLoss === null ? "—" : formatCurrency(stats.avgLoss)}</span></div>`
          : ""
      }
    </section>`;
}

function bySymbolTable(trips: readonly RoundTrip[]): string {
  const rows = statsBySymbol(trips);
  if (rows.length === 0) return "";
  const max = rows.reduce((m, row) => Math.max(m, Math.abs(row.netRealized)), 0) || 1;
  return `<div class="blotter-inline">
      <table class="blotter">
        <thead><tr><th>Symbol</th><th class="num">Trades</th><th class="num">Win rate</th><th class="num">Net realized</th><th></th></tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr>
            <td><span class="sym">${escapeHtml(row.symbol)}</span></td>
            <td class="num">${row.trades}</td>
            <td class="num">${formatPctOrDash(row.winRate)}</td>
            <td class="num ${plClass(row.netRealized)}">${formatSigned(row.netRealized)}</td>
            <td><span class="weight-bar"><i style="width:${((Math.abs(row.netRealized) / max) * 100).toFixed(1)}%;background:var(--${row.netRealized >= 0 ? "pos" : "neg"})"></i></span></td>
          </tr>`,
          )
          .join("")}</tbody>
      </table>
    </div>`;
}

export function renderAnalysisBody(
  snapshot: ParticipantSnapshot,
  options: DeskViewOptions & { tradeActivity?: readonly TradeActivityRecord[] } = {},
): string {
  const { asOf, header } = deskFrame(snapshot, "analysis", options, {
    title: "Trade analysis",
    sub: "How the trades behave — not what the account is worth. Every number here comes from closed round trips.",
  });
  // Stats run over the durable ledger when one exists, so win rate/expectancy measure the whole
  // record — not just whatever the broker's recent-order window happened to still hold.
  const ledger = deskLedger(snapshot, options.tradeActivity);
  const stats = tradeStats(ledger.trips);

  if (stats.trades === 0) {
    return renderShell(
      options.nav,
      `${DESK_STYLE}<section class="desk">
      ${header}
      <div class="blotter-wrap"><p class="desk-empty">Analysis needs closed trades, and there aren't any in the recorded window yet.${
        ledger.open.length > 0
          ? ` ${ledger.open.length} lot${ledger.open.length === 1 ? " is" : "s are"} still open — see <a href="?tab=positions">Active</a>.`
          : ""
      }<br><br>Nothing here is estimated from open positions on purpose: an unrealized gain isn't a win until it's booked.</p></div>
    </section>`,
      asOf,
    );
  }

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    ${renderTiles(stats)}
    ${streakLine(stats)}
    ${splitBar(stats)}
    ${extremes(stats)}
    <section class="panel">
      <h2 class="panel-title">By symbol</h2>
      <p class="panel-sub">Which tickers actually pay you — ranked by realized dollars.</p>
      ${bySymbolTable(ledger.trips)}
    </section>
  </section>`,
    asOf,
  );
}
