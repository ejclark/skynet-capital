import type { TradeStats } from "../trading/trade-stats.js";
import { escapeHtml } from "../ui/escape-html.js";
import { biggestSingleDayGain, longestGreenStreak } from "./day-trophies.js";
import { formatPctOrDash, formatRatio } from "./desk-data.js";
import type { equityDrawdown } from "./equity-sparkline.js";
import type { EquitySample } from "./history-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";

export interface StatTile {
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

export function statTiles(
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

export function renderStatTiles(tiles: StatTile[]): string {
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
