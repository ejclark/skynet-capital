/**
 * Drop-exit study math — the pure half of `drop-exit-study.mjs` (#6950, the first encounter of
 * #6948). The question is about EXITS, not entries: after buying the close of a day down ≥ 7%,
 * which exit rule, set at that close, would have paid, and how often? (`dip-entries-nvda-crwv.md`
 * already answered the entry question: "Record dips; don't trade them.")
 *
 * WHY THE FILL RULES ARE PESSIMISTIC. A level that looks hit on a daily bar may not have been
 * fillable: the bar does not say whether the high or the low came first. So a session that touches
 * both the take-profit and the stop counts as the stop (the issue's "same-day ambiguity counts as
 * the stop"), and a gap through a level fills at the open — a gap up through the take-profit is
 * the one place a fill can beat its level, and a gap down through the stop fills worse than it.
 *
 * WHY EPISODES. NVDA fell ≥ 7% on several days in a row in 2000–02, 2008 and 2020; each of those
 * runs is one sell-off, not five observations. Drops within GAP sessions of the previous drop chain
 * into one episode, and only the episode's first drop is traded.
 *
 * PURE: no I/O, no clock, no network. Offline research tooling; places nothing.
 */

import { quantile } from "./premium-fit-math.mjs";

/** Sessions within which a later drop joins the previous drop's episode. */
export const EPISODE_GAP = 10;

/** The exit grid, all set at the entry close (#6950 → Method). `null` = no such level. */
export const TAKE_PROFITS = [null, 0.03, 0.05, 0.07];
export const STOPS = [null, 0.05, 0.08];
export const HOLDS = [1, 5, 63, 126];

/** Every combination of the grid, take-profit outermost. */
export function exitGrid() {
  const out = [];
  for (const tp of TAKE_PROFITS)
    for (const stop of STOPS) for (const hold of HOLDS) out.push({ tp, stop, hold });
  return out;
}

/** "+5% / −8% / 63d", the label every table row uses. */
export function ruleLabel({ tp, stop, hold }) {
  const t = tp == null ? "no TP" : `+${Math.round(tp * 100)}%`;
  const s = stop == null ? "no stop" : `−${Math.round(stop * 100)}%`;
  return `${t} / ${s} / ${hold}d`;
}

/** Session indices whose close is down at least `threshold` (0.07 = 7%) from the prior close. */
export function dropDays(bars, threshold) {
  const out = [];
  // The epsilon keeps a close exactly at the threshold (93 after 100) from rounding out of it.
  for (let t = 1; t < bars.length; t++)
    if (bars[t].close / bars[t - 1].close - 1 <= -threshold + 1e-12) out.push(t);
  return out;
}

/**
 * Chain drop indices into episodes: a drop within `gap` sessions of the previous drop joins its
 * episode. Returns each episode's first index and its members.
 *
 * @param {number[]} idxs ascending
 * @returns {{first: number, members: number[]}[]}
 */
export function episodes(idxs, gap = EPISODE_GAP) {
  const out = [];
  for (const t of idxs) {
    const last = out[out.length - 1];
    if (last && t - last.members[last.members.length - 1] <= gap) last.members.push(t);
    else out.push({ first: t, members: [t] });
  }
  return out;
}

/**
 * One trade: buy the close of session `t`, then walk forward under `rule`.
 *
 * @returns {{exit: "tp"|"stop"|"time", ret: number, at: number} | null} `ret` in percent; null
 *   when the series ends before the trade resolves (still open, never scored).
 */
export function exitTrade(bars, t, { tp, stop, hold }) {
  const entry = bars[t].close;
  const up = tp == null ? Infinity : entry * (1 + tp);
  const down = stop == null ? -Infinity : entry * (1 - stop);
  const pct = (px) => (px / entry - 1) * 100;
  for (let d = t + 1; d <= t + hold; d++) {
    const b = bars[d];
    if (!b) return null;
    if (b.open >= up) return { exit: "tp", ret: pct(b.open), at: d };
    if (b.open <= down) return { exit: "stop", ret: pct(b.open), at: d };
    const hitUp = b.high >= up;
    const hitDown = b.low <= down;
    if (hitDown) return { exit: "stop", ret: pct(down), at: d };
    if (hitUp) return { exit: "tp", ret: pct(up), at: d };
  }
  return { exit: "time", ret: pct(bars[t + hold].close), at: t + hold };
}

/**
 * The row a table prints for a set of trades: how often it paid (return > 0), the median, the
 * worst decile (10th percentile), and the order the levels hit.
 *
 * @param {{exit: string, ret: number}[]} trades
 */
export function summarize(trades) {
  const n = trades.length;
  const rets = trades.map((x) => x.ret);
  const share = (f) => (n === 0 ? NaN : trades.filter(f).length / n);
  return {
    n,
    hit: share((x) => x.ret > 0),
    median: n === 0 ? NaN : quantile(rets, 0.5),
    p10: n === 0 ? NaN : quantile(rets, 0.1),
    mean: n === 0 ? NaN : rets.reduce((a, b) => a + b, 0) / n,
    tp: share((x) => x.exit === "tp"),
    stop: share((x) => x.exit === "stop"),
    time: share((x) => x.exit === "time"),
  };
}

/**
 * The month-matched control for one drop: every down session in the same calendar month (same
 * year) that is not itself a qualifying drop. Averaging over all of them is the expectation of the
 * issue's "random down day matched by month", without a seed to argue about.
 *
 * @param {Set<number>} dropSet indices of qualifying drops, all excluded
 */
export function matchedDownDays(bars, t, dropSet) {
  const month = bars[t].date.slice(0, 7);
  const out = [];
  for (let d = Math.max(1, t - 25); d < Math.min(bars.length, t + 26); d++) {
    if (d === t || dropSet.has(d) || bars[d].date.slice(0, 7) !== month) continue;
    if (bars[d].close < bars[d - 1].close) out.push(d);
  }
  return out;
}

/**
 * Is session `t` the reaction to the symbol's own earnings print? A filing after the close reacts
 * the next session and a filing before the open reacts the same day, so a filing on `t` or on the
 * session before it both count. `printDates` are 8-K Item 2.02 filing dates (YYYY-MM-DD).
 */
export function isPrintReaction(bars, t, printDates) {
  const set = printDates instanceof Set ? printDates : new Set(printDates);
  return set.has(bars[t].date) || (t > 0 && set.has(bars[t - 1].date));
}

/**
 * How many of the entries could have been held without overlapping: greedy from the earliest, the
 * next one counts only once the previous trade's `hold` has run out. A 126-session hold after
 * 2008's drops shares one recovery; this is the count that does not double it.
 */
export function independentWindows(entries, hold) {
  let count = 0;
  let freeFrom = -Infinity;
  for (const t of entries) {
    if (t < freeFrom) continue;
    count++;
    freeFrom = t + hold;
  }
  return count;
}

/** Population sd of a list, NaN when empty. */
export function sd(values) {
  if (values.length === 0) return NaN;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / values.length);
}
