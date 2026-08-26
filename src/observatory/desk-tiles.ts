import { escapeHtml } from "../ui/escape-html.js";
import { biggestSingleDayGain, longestGreenStreak } from "./day-trophies.js";
import { formatPctOrDash } from "./desk-data.js";
import type { EquitySample } from "./history-store.js";
import { formatSigned } from "./render-atoms.js";

/**
 * THE STAT-TILE ROW — the shape of one tile, the day-trophy tiles that fill two of them, and the
 * renderer that turns a row of them into markup.
 *
 * Split out of performance-view.ts (2026-08-26) so that view stays under the flat god-file cap
 * without negotiating a per-file ceiling for it. The day trophies live here rather than beside
 * their math in day-trophies.ts because a `StatTile` is a view concern; day-trophies.ts stays pure.
 */

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
export function dayTrophyTiles(
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
