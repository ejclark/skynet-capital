import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { RoundTrip } from "../trading/round-trips.js";
import { type TradeStats, tradeStats } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import {
  ACTIVITY_TYPES,
  ACTIVITY_WINDOWS,
  type ActivityTypeFilter,
  type ActivityWindow,
  filterActivity,
  type TradeActivityRecord,
  windowCutoff,
} from "./activity-store.js";
import { renderShell } from "./dashboard-shell.js";
import { biggestSingleDayGain, longestGreenStreak } from "./day-trophies.js";
import {
  deskLedger,
  formatHold,
  formatPctOrDash,
  formatRatio,
  mergedDeskActivity,
} from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskFrame, deskHref } from "./desk-tabs.js";
import { equityDrawdown, renderEquitySparkline } from "./equity-sparkline.js";
import { doubledAt, seedBaseline } from "./history-metrics.js";
import type { EquitySample } from "./history-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatCurrency, formatSigned, formatTimestamp, plClass } from "./render-atoms.js";
import {
  type ActivityRow,
  caveats,
  dayStrip,
  foldedLedger,
  tripsTable,
} from "./trade-ledgers-view.js";

/**
 * PERFORMANCE — the desk's one "how am I doing" tab, replacing the old History / Analysis /
 * Metrics split. Three honestly-separate inputs feed it (closed round trips, the order ledger, and
 * recorded equity samples) and each section renders its own empty state from its own input — never
 * a single blended gate. A member with fills but no equity history yet still sees their trades; one
 * with equity history but nothing closed yet still sees the curve. Folding the views is a layout
 * change, not a data merge.
 */

export interface PerformanceViewOptions extends DeskViewOptions {
  readonly tradeActivity?: readonly TradeActivityRecord[];
  readonly activityWindow?: ActivityWindow;
  readonly activityType?: ActivityTypeFilter;
  /** A bot's autonomous decision audit trail, for the per-order "why" fold. */
  readonly decisions?: readonly DecisionRecord[];
  readonly history?: readonly EquitySample[];
}

interface StatTile {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly cls?: string;
  readonly lead?: boolean;
}

/**
 * The two day-shaped trophies (issue #503). A *trading day* is a day the board actually sampled,
 * so both read ABSENT (—) rather than 0 until two recorded days exist: a zeroed streak would claim
 * a day that never happened, and a "best day" of $0 would dress a flat record as a win.
 */
function dayTrophyTiles(
  samples: readonly EquitySample[],
  timezone: string | undefined,
): StatTile[] {
  const bestDay = biggestSingleDayGain(samples, timezone);
  const streak = longestGreenStreak(samples, timezone);
  return [
    {
      label: "Best day",
      value: bestDay ? formatSigned(bestDay.abs) : "—",
      note: bestDay
        ? `${bestDay.day} · ${formatPctOrDash(bestDay.pct, true)}`
        : "needs two days of history",
      ...(bestDay ? { cls: "pos" } : {}),
    },
    {
      label: "Green streak",
      value: streak ? `${streak.length} trading day${streak.length === 1 ? "" : "s"}` : "—",
      note: streak ? `${streak.from} → ${streak.to}` : "needs two days of history",
      ...(streak ? { cls: "pos" } : {}),
    },
  ];
}

function statTiles(
  stats: TradeStats,
  snapshot: ParticipantSnapshot,
  drawdown: ReturnType<typeof equityDrawdown>,
  samples: readonly EquitySample[],
): StatTile[] {
  return [
    {
      label: "Equity",
      value: formatCurrency(snapshot.equity),
      note: `cash ${formatCurrency(snapshot.cash)}`,
      lead: true,
    },
    {
      label: "Net realized",
      value: formatSigned(stats.netRealized),
      note: stats.trades === 0 ? "needs a closed trade" : "booked, not on paper",
      ...(stats.trades > 0 ? { cls: plClass(stats.netRealized) } : {}),
    },
    {
      label: "Win rate",
      value: formatPctOrDash(stats.winRate),
      note:
        stats.trades === 0
          ? "needs a closed trade"
          : `${stats.wins}W · ${stats.losses}L${stats.scratches > 0 ? ` · ${stats.scratches} flat` : ""}`,
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
      note:
        stats.expectancy === null
          ? "needs a closed trade"
          : "what one more trade is worth, on average",
      ...(stats.expectancy !== null ? { cls: plClass(stats.expectancy) } : {}),
    },
    {
      label: "Max drawdown",
      value: drawdown ? `${drawdown.ddPct.toFixed(2)}%` : "—",
      note: drawdown
        ? `${formatCurrency(drawdown.ddAbs)} from peak ${formatCurrency(drawdown.peak)}`
        : "needs two equity samples",
      ...(drawdown ? { cls: drawdown.ddPct > 0 ? "neg" : "flat" } : {}),
    },
    ...dayTrophyTiles(samples, snapshot.timezone),
  ];
}

function renderStatTiles(tiles: StatTile[]): string {
  return `<div class="desk-tiles">${tiles
    .map(
      (tile) => `<div class="desk-tile${tile.lead ? " lead" : ""}">
        <span class="desk-k">${escapeHtml(tile.label)}</span>
        <span class="desk-v${tile.cls ? ` ${tile.cls}` : ""}">${escapeHtml(tile.value)}</span>
        <span class="desk-note">${escapeHtml(tile.note)}</span>
      </div>`,
    )
    .join("")}</div>`;
}

/** The friendly race, nested inside the curve panel rather than a sibling section (design brief). */
function doublingMeter(samples: readonly EquitySample[], equity: number): string {
  const seed = seedBaseline(samples);
  if (!seed || seed.equity <= 0) {
    return `<p class="caveat"><b>No founding baseline recorded yet.</b> The doubling race is measured from the equity written down when an account joins the board — this one starts scoring at its next sample.</p>`;
  }
  const already = doubledAt(samples);
  const target = seed.equity * 2;
  const progress = Math.max(0, Math.min(100, ((equity - seed.equity) / seed.equity) * 100));
  const body = already
    ? `<b>Doubled.</b> Crossed ${formatCurrency(target)} on ${escapeHtml(formatTimestamp(already.at))} — the trophy is banked and can't be taken back by a later dip.`
    : `<b>${progress.toFixed(1)}% of the way to 2×.</b> ${formatCurrency(equity)} against a founding ${formatCurrency(seed.equity)}; ${formatCurrency(Math.max(0, target - equity))} to go.`;
  return `<div class="desk-eyebrow" style="margin-top:14px">The doubling race</div>
      <p class="panel-sub">${body}</p>
      <div class="progress"><i style="width:${progress.toFixed(1)}%"></i></div>`;
}

/** Left column of `.perf-top`: the equity curve, its drawdown, and the doubling race. */
function curvePanel(samples: readonly EquitySample[], equity: number): string {
  const spark = renderEquitySparkline(samples, { width: 640, height: 120 });
  if (!spark) {
    return `<section class="panel">
      <h2 class="panel-title">Equity curve</h2>
      <p class="panel-sub">Two samples are needed to draw a line — needs two equity samples. History is still accruing.</p>
    </section>`;
  }
  const drawdown = equityDrawdown(samples);
  return `<section class="panel">
      <h2 class="panel-title">Equity curve</h2>
      ${spark}
      ${
        drawdown
          ? `<div class="review-line"><span>Peak equity</span><span>${formatCurrency(drawdown.peak)}</span></div>
      <div class="review-line"><span>Max drawdown</span><span class="${drawdown.ddPct > 0 ? "neg" : "flat"}">${drawdown.ddPct.toFixed(2)}% · ${formatCurrency(drawdown.ddAbs)}</span></div>`
          : ""
      }
      ${doublingMeter(samples, equity)}
    </section>`;
}

/** Right column of `.perf-top`: the shape of the closed trades — needs a closed trade to fire. */
function splitPanel(stats: TradeStats): string {
  if (stats.trades === 0) {
    return `<section class="panel">
      <h2 class="panel-title">Wins, losses, scratches</h2>
      <p class="desk-empty">Needs a closed trade — nothing here is estimated from open positions.</p>
    </section>`;
  }
  const share = (n: number) => (n / stats.trades) * 100;
  const line = (label: string, trip: RoundTrip | null) =>
    trip
      ? `<div class="review-line"><span>${label}</span><span class="${plClass(trip.realized)}">${escapeHtml(
          trip.symbol,
        )} · ${formatSigned(trip.realized)} · ${escapeHtml(formatHold(trip.holdMs))}</span></div>`
      : "";
  const streak =
    stats.currentStreak.kind === "none"
      ? ""
      : (() => {
          const { kind, length } = stats.currentStreak;
          const word = kind === "win" ? "green" : "red";
          const cheer =
            kind === "win"
              ? `${length} in a row — the discipline is paying.`
              : `${length} in a row — a cold streak is data, not a verdict.`;
          return `<p class="caveat"><b>Current run: ${length} ${word}.</b> ${escapeHtml(cheer)} Best green run ${stats.longestWinStreak} · longest cold run ${stats.longestLossStreak}.</p>`;
        })();
  return `<section class="panel">
      <h2 class="panel-title">Wins, losses, scratches</h2>
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
      ${streak}
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

function perfHref(participantId: string, window: ActivityWindow, type: ActivityTypeFilter): string {
  return `${deskHref(participantId, "performance")}&window=${window}&type=${type}`;
}

function filterBar(
  participantId: string,
  window: ActivityWindow,
  type: ActivityTypeFilter,
): string {
  const windowChips = ACTIVITY_WINDOWS.map(
    (w) =>
      `<a class="fchip${w.key === window ? " active" : ""}" href="${perfHref(participantId, w.key, type)}"${w.key === window ? ' aria-current="true"' : ""}>${w.label}</a>`,
  ).join("");
  const typeChips = ACTIVITY_TYPES.map(
    (t) =>
      `<a class="fchip${t.key === type ? " active" : ""}" href="${perfHref(participantId, window, t.key)}"${t.key === type ? ' aria-current="true"' : ""}>${t.label}</a>`,
  ).join("");
  return `<nav class="filterbar" aria-label="Performance filters">
      <span class="filter-k">Window</span><span class="fchips">${windowChips}</span>
      <span class="filter-k">Type</span><span class="fchips">${typeChips}</span>
    </nav>`;
}

export function renderPerformanceBody(
  snapshot: ParticipantSnapshot,
  options: PerformanceViewOptions = {},
): string {
  const { asOf, header } = deskFrame(snapshot, "performance", options, {
    title: "Performance",
    sub: "How the account performs over time, and how the trades behind it behave — three separate questions, one page.",
  });
  const window = options.activityWindow ?? "30d";
  const type = options.activityType ?? "all";
  const now = new Date(asOf);
  const durable = options.tradeActivity ?? [];
  const samples = options.history ?? [];

  // FIFO honesty: trips are matched over the FULL record, then windowed by close time — matching
  // inside a window would orphan sells from their opening buys and invent truncation.
  const merged = mergedDeskActivity(snapshot, durable) as readonly ActivityRow[];
  const ledger = deskLedger(snapshot, durable);
  const cutoff = windowCutoff(window, now);
  const trips = cutoff ? ledger.trips.filter((t) => t.closedAt >= cutoff) : ledger.trips;
  const stats = tradeStats(ledger.trips);
  const drawdown = equityDrawdown(samples);
  const orders = filterActivity(merged, { window, type, now }).sort((a, b) =>
    b.at.localeCompare(a.at),
  );

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    ${renderStatTiles(statTiles(stats, snapshot, drawdown, samples))}
    <div class="perf-top">
      ${curvePanel(samples, snapshot.equity)}
      ${splitPanel(stats)}
    </div>
    ${samples.length === 0 ? `<p class="caveat"><b>No recorded history yet.</b> The board samples equity as the world turns; the curve and drawdown fill in from there. Nothing is back-filled or estimated.</p>` : ""}
    ${caveats(ledger, durable.length > 0)}
    ${filterBar(snapshot.id, window, type)}
    ${dayStrip(trips, snapshot.timezone)}
    ${tripsTable(trips, snapshot.timezone)}
    ${foldedLedger(orders, snapshot, options.decisions ?? [])}
  </section>`,
    asOf,
  );
}
