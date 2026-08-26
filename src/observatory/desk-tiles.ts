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

/**
 * The tile row's own styles, co-located with the markup that needs them.
 *
 * `DESK_STYLE` used to own these six rules outright, which made the component un-reusable: any
 * other view wanting a tile row had to import the whole desk stylesheet or paste the CSS. Both
 * consumers now interpolate this one string, so the markup and its styles can never drift apart.
 * Desk-specific responsive overrides stay in `desk-style.ts` — they are layout, not the component.
 */
export const STAT_TILE_CSS = `
  .desk-tiles{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
  .desk-tile{ background:var(--surface); border:1px solid var(--border); border-radius:13px; padding:14px 16px; display:flex; flex-direction:column; gap:5px; }
  .desk-tile.lead{ border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); }
  .desk-k{ font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
  .desk-v{ font-size:21px; font-weight:700; letter-spacing:-.01em; font-family:var(--mono); font-variant-numeric:tabular-nums; }
  .desk-note{ font-size:11px; color:var(--muted); line-height:1.45; }`;

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
