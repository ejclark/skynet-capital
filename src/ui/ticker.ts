import { escapeHtml } from "./escape-html.js";

/**
 * THE ODOMETER TICKER — the house primitive for a number that CHANGES on screen.
 *
 * Why it exists: nothing in the app animates a value transition today, so a price, an equity line
 * or a leaderboard rank simply swaps from one string to another and the eye misses the moment. An
 * odometer roll makes the change legible — you see *which digits moved*, and which way.
 *
 * Three rules make it honest rather than merely pretty:
 *
 * 1. **Direction is the sign of the change, not a decoration.** Increase rolls DOWN, decrease rolls
 *    UP — the convention Robinhood's open-sourced `TickerView` established, and the one members will
 *    already have in their fingers. `rollDirection()` is the only place that decides.
 * 2. **Tone is NEUTRAL by default.** `--pos`/`--neg` carry market meaning everywhere on this desk
 *    (docs/BRAND.md), so a ticker counting members, bots or days-to-earnings must never tint green
 *    or red. Market colour is reachable only through an explicit `meaning: "market"` opt-in.
 * 3. **A digit position that did not exist before rolls in from EMPTY, never from a fabricated `0`.**
 *    Absence renders as absent — the same honesty invariant the rest of the app holds to.
 *
 * The reduced-motion trick is worth naming, because it is what makes correctness structural instead
 * of a second code path: each rolling cell is a two-child strip whose **resting transform already
 * shows the NEW digit**; the keyframe only supplies the *starting* offset. Kill the animation — via
 * the media query, or `reducedMotion: true` — and the reader still sees the correct value, never a
 * stale digit frozen mid-roll.
 *
 * Pure functions, strings in → markup out, no DOM. `TICKER_STYLE` is exported separately from the
 * markup so a page carrying many tickers includes the rules once.
 */

/** Which way the digits travel. `down` = the value went UP (Robinhood's `TickerView` convention). */
export type RollDirection = "down" | "up" | "none";

/** One character position of the ticker, already aligned against its predecessor. */
export interface TickerCell {
  /** The character this position lands on. Empty when the new value is shorter here. */
  readonly to: string;
  /** The character this position held before. Empty when the position is brand new. */
  readonly from: string;
  /** True only when both sides are digit-or-empty AND they differ — separators never roll. */
  readonly rolls: boolean;
}

export interface TickerOptions {
  /** The formatted value already on screen, e.g. `"1,299"`. */
  readonly previous: string;
  /** The formatted value to land on, e.g. `"1,300"`. */
  readonly next: string;
  /** Which way to roll — from `rollDirection()`, so the sign is decided in exactly one place. */
  readonly direction: RollDirection;
  /** Optional visible eyebrow, e.g. `"EQUITY"`. */
  readonly label?: string;
  /**
   * `"neutral"` (default) renders in `--text`. `"market"` opts into `--pos`/`--neg`, and is only
   * legitimate when the number really is a price, an equity line or a P/L figure.
   */
  readonly meaning?: "neutral" | "market";
  /** Server-side escape hatch: render flat, strip-free cells for a reader who has asked for stillness. */
  readonly reducedMotion?: boolean;
}

/** Increase → roll down · decrease → roll up · unchanged → nothing moves. */
export function rollDirection(previous: number, next: number): RollDirection {
  if (next > previous) return "down";
  if (next < previous) return "up";
  return "none";
}

const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";

/** Right-align a value into `width` slots so `1,299 → 1,300` rolls its tail, not its whole row. */
function alignRight(value: string, width: number): string[] {
  const offset = width - value.length;
  const slots: string[] = [];
  for (let i = 0; i < width; i += 1) slots.push(i < offset ? "" : (value[i - offset] as string));
  return slots;
}

/**
 * Diff two formatted values into per-position cells. Only positions where a digit actually changed
 * are marked `rolls` — separators (`, . $ % -`) and unchanged digits stay still, which is what keeps
 * a one-cent move from looking like the whole number exploded.
 */
export function tickerCells(previous: string, next: string): readonly TickerCell[] {
  const width = Math.max(previous.length, next.length);
  const before = alignRight(previous, width);
  const after = alignRight(next, width);
  return after.map((to, i) => {
    const from = before[i] as string;
    const rolls = to !== from && isDigit(to) && (from === "" || isDigit(from));
    return { to, from, rolls };
  });
}

/** The rules for every ticker on a page — include once, alongside the app's token block. */
export const TICKER_STYLE = `<style>
  .tick{ --tick-dur:.42s; --tick-ease:cubic-bezier(.22,.61,.36,1);
    display:inline-flex; align-items:baseline; gap:.5em; font-family:var(--mono); color:var(--text); }
  .tick-label{ font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
  .tick-row{ display:inline-flex; height:1em; overflow:hidden; line-height:1; font-variant-numeric:tabular-nums; }
  .tick-cell{ display:inline-block; height:1em; overflow:hidden; line-height:1; }
  .tick-strip{ display:block; }
  .tick-strip span{ display:block; height:1em; line-height:1; }
  /* The resting transform IS the new value. The keyframe only supplies where the roll starts, so
     killing the animation leaves the correct digit on screen rather than a stale one. */
  .tick-down .tick-strip{ transform:translateY(0); animation:tick-roll-down var(--tick-dur) var(--tick-ease) both; }
  .tick-up .tick-strip{ transform:translateY(-1em); animation:tick-roll-up var(--tick-dur) var(--tick-ease) both; }
  @keyframes tick-roll-down{ from{ transform:translateY(-1em); } to{ transform:translateY(0); } }
  @keyframes tick-roll-up{ from{ transform:translateY(0); } to{ transform:translateY(-1em); } }
  /* Market tone is opt-in only — see the doc comment. Never applied to a count or a countdown. */
  .tick-gain{ color:var(--pos); }
  .tick-loss{ color:var(--neg); }
  .tick-sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden;
    clip-path:inset(50%); white-space:nowrap; border:0; }
  @media (prefers-reduced-motion:reduce){ .tick-strip{ animation:none; } }
</style>`;

/** A rolling cell: two stacked digits, ordered so the resting transform lands on `to`. */
function rollingCell(cell: TickerCell, direction: RollDirection): string {
  const to = `<span>${escapeHtml(cell.to)}</span>`;
  const from = `<span>${escapeHtml(cell.from)}</span>`;
  const stack = direction === "down" ? `${to}${from}` : `${from}${to}`;
  return `<span class="tick-cell"><span class="tick-strip">${stack}</span></span>`;
}

/** A still cell: a separator, an unchanged digit, or any position under reduced motion. */
function staticCell(cell: TickerCell): string {
  return `<span class="tick-cell">${escapeHtml(cell.to)}</span>`;
}

/** Market tone, and only when the caller has said this number really is a market number. */
function toneClass(opts: TickerOptions): string {
  if (opts.meaning !== "market" || opts.direction === "none") return "";
  return opts.direction === "down" ? " tick-gain" : " tick-loss";
}

/**
 * Render one ticker. The digit row is `aria-hidden` — a screen reader gets the plain value from the
 * visually-hidden span instead of being read the number one character at a time.
 */
export function renderTicker(opts: TickerOptions): string {
  const still = opts.reducedMotion === true || opts.direction === "none";
  const cells = tickerCells(opts.previous, opts.next)
    .map((cell) => (cell.rolls && !still ? rollingCell(cell, opts.direction) : staticCell(cell)))
    .join("");
  const motion = still ? "" : ` tick-${opts.direction}`;
  const label =
    opts.label === undefined ? "" : `<span class="tick-label">${escapeHtml(opts.label)}</span>`;
  return `<span class="tick${motion}${toneClass(opts)}">${label}<span class="tick-sr">${escapeHtml(opts.next)}</span><span class="tick-row" aria-hidden="true">${cells}</span></span>`;
}
