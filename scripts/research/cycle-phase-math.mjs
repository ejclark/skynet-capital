/**
 * The pure half of the cycle-phase detector (`cycle-phase.mjs`, #5482 slice 1, "the swing
 * study"): today's phase from today's conditions, and the outcome bands of past sessions that
 * were in the same conditions. No I/O here — the CLI loads bars, prints, VIX and the chain and
 * hands plain arrays in, so every rule below is specified against constructed series
 * (tests/research/cycle-phase-math.spec.ts).
 *
 * THE PHASE RULES (the whole classifier; nothing else decides a label)
 *
 *   drawdown  dd = close / highest close of the last 60 sessions (today included) − 1
 *
 *   price phase, first match wins:
 *     pullback          dd ≤ −10%  → "(sector-wide)" when at least half of the peers with data
 *                                      that session are also ≥ 10% under their own 60-session
 *                                      high (and at least 2 peers have data), else "(single-name)"
 *     recovery          dd > −10% but some close in the last 20 sessions was ≤ −10% off its high
 *     run-up            dd > −3% and the close is ≥ 10% above the close 20 sessions ago
 *     near high         dd > −3%
 *     shallow pullback  everything else (−3% ≥ dd > −10%, no deeper dip in 20 sessions); it
 *                       carries the same sector qualifier, because a name holding up while its
 *                       peers fall is a different day from a name drifting alone
 *
 *   print overlay, added after the price phase:
 *     pre-print         the next print (filed or projected) is ≤ 10 sessions away
 *     post-print drift  the last print's filing session was ≤ 10 sessions ago
 *
 * THE MATCH (which past sessions count as "the same weather")
 *   same drawdown bucket (0–3 · 3–10 · 10–20 · 20–30 · 30–45 · 45%+ under the high), same
 *   sector-wide flag, same VIX bucket (< 20 calm · 20–25 elevated · ≥ 25 fear). The CLI relaxes
 *   VIX, then the sector flag, and prints every level, so a reader sees what each condition moves.
 *
 * INDEPENDENCE. Matching sessions arrive in runs (a pullback is many sessions in one bucket), so
 * runs separated by ≤ 20 sessions are one EPISODE, and each episode contributes ONE value per
 * measure (the median over its sessions). Across names, episodes whose dates overlap (within 30
 * calendar days) are one CLUSTER — one sell-off moves the whole basket — and the cluster count is
 * the honest n.
 */

import { quantile } from "./premium-fit-math.mjs";

export const HIGH_WINDOW = 60;
export const WARMUP = 20;
export const PULLBACK = -0.1;
export const NEAR_HIGH = -0.03;
export const RUNUP_GAIN = 0.1;
export const LOOKBACK = 20;
export const PRINT_NEAR = 10;
export const SECTOR_SHARE = 0.5;
export const MIN_PEERS = 2;
export const LOW_HORIZON = 63;
export const RECOVER_HORIZON = 126;
export const EPISODE_GAP = 20;
export const CLUSTER_GAP_DAYS = 30;

/** Lower edges of the drawdown buckets, shallowest first. */
const DD_EDGES = [-0.03, -0.1, -0.2, -0.3, -0.45];
export const DD_LABELS = ["0–3%", "3–10%", "10–20%", "20–30%", "30–45%", "45%+"];

/** The bucket index of a drawdown (0 = within 3% of the high). */
export function ddBucket(dd) {
  const i = DD_EDGES.findIndex((edge) => dd > edge);
  return i === -1 ? DD_EDGES.length : i;
}

/** "calm" (< 20), "elevated" (20–25) or "fear" (≥ 25); null when the VIX is unknown. */
export function vixBucket(vix) {
  if (vix == null) return null;
  return vix >= 25 ? "fear" : vix >= 20 ? "elevated" : "calm";
}

/**
 * Per-session drawdown from the trailing 60-session closing high, and sessions since that high.
 * Entries before WARMUP sessions of history are null: a two-week-old listing has no "high" yet.
 *
 * @param {number[]} closes ascending
 * @returns {({high: number, dd: number, sinceHigh: number} | null)[]}
 */
export function drawdowns(closes) {
  return closes.map((close, i) => {
    if (i < WARMUP) return null;
    let at = Math.max(0, i - HIGH_WINDOW + 1);
    for (let k = at; k <= i; k++) if (closes[k] >= closes[at]) at = k;
    return { high: closes[at], dd: close / closes[at] - 1, sinceHigh: i - at };
  });
}

/**
 * How many peers sit ≥ 10% under their own high, of those with data that session.
 *
 * @param {(number | null | undefined)[]} peerDds one drawdown per peer, null when it has no data
 * @returns {{off: number, of: number, wide: boolean | null}}
 */
export function sectorFlag(peerDds) {
  const known = peerDds.filter((d) => d != null);
  const off = known.filter((d) => d <= PULLBACK).length;
  return {
    off,
    of: known.length,
    wide: known.length < MIN_PEERS ? null : off / known.length >= SECTOR_SHARE,
  };
}

/**
 * The price phase, per the rules in this file's header.
 *
 * @param {{dd: number, ddMinRecent: number, ret20: number | null, wide: boolean | null}} s
 */
export function pricePhase({ dd, ddMinRecent, ret20, wide }) {
  const scope = `(${wide ? "sector-wide" : wide === false ? "single-name" : "peers unknown"})`;
  if (dd <= PULLBACK) return `pullback ${scope}`;
  if (ddMinRecent <= PULLBACK) return "recovery";
  if (dd > NEAR_HIGH) return ret20 != null && ret20 >= RUNUP_GAIN ? "run-up" : "near high";
  return `shallow pullback ${scope}`;
}

/** "pre-print", "post-print drift" or null, from session counts to the next / since the last print. */
export function printOverlay({ toNext, sinceLast }) {
  if (toNext != null && toNext <= PRINT_NEAR) return "pre-print";
  if (sinceLast != null && sinceLast <= PRINT_NEAR) return "post-print drift";
  return null;
}

/**
 * What followed an entry at the close of session `t`: the further drawdown, when the low came,
 * and how long until the entry price (and the 60-session high it was measured from) came back.
 * Null when fewer than LOW_HORIZON sessions follow — an unfinished window is not an outcome.
 * A recovery not seen within the sessions that exist is `Infinity` (censored), never dropped:
 * dropping it would keep only the episodes that recovered, which is the flattering half.
 *
 * @param {number[]} closes
 * @param {number} t
 * @param {number} high the 60-session high at t
 * @param {number[]} holds extra horizons (sessions) to report the close at, e.g. a put's expiry
 */
export function outcomeAt(closes, t, high, holds = []) {
  if (t + LOW_HORIZON >= closes.length) return null;
  const c0 = closes[t];
  let toLow = 0;
  for (let s = 1; s <= LOW_HORIZON; s++) if (closes[t + s] < closes[t + toLow]) toLow = s;
  const last = Math.min(RECOVER_HORIZON, closes.length - 1 - t);
  const firstAtOrAbove = (level, from) => {
    for (let s = Math.max(1, from); s <= last; s++) if (closes[t + s] >= level) return s;
    return Number.POSITIVE_INFINITY;
  };
  return {
    further: closes[t + toLow] / c0 - 1,
    toLow,
    backToEntry: firstAtOrAbove(c0, toLow),
    backToHigh: firstAtOrAbove(high, toLow),
    seen: last,
    at: Object.fromEntries(
      holds.filter((h) => t + h < closes.length).map((h) => [h, closes[t + h] / c0 - 1]),
    ),
  };
}

/**
 * Split ascending session indices into episodes: a gap of more than `gap` sessions starts a new one.
 *
 * @param {number[]} idx ascending
 * @returns {number[][]}
 */
export function episodesOf(idx, gap = EPISODE_GAP) {
  const out = [];
  for (const i of idx) {
    const cur = out.at(-1);
    if (cur && i - cur.at(-1) <= gap) cur.push(i);
    else out.push([i]);
  }
  return out;
}

const dayNum = (iso) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/**
 * Count clusters among episodes from several names: episodes whose [start, end] date ranges sit
 * within `gapDays` calendar days of each other are one market event.
 *
 * @param {{start: string, end: string}[]} ranges
 */
export function clusterCount(ranges, gapDays = CLUSTER_GAP_DAYS) {
  const sorted = [...ranges].sort((a, b) => (a.start < b.start ? -1 : 1));
  let n = 0;
  let reach = Number.NEGATIVE_INFINITY;
  for (const r of sorted) {
    if (dayNum(r.start) > reach + gapDays) n++;
    reach = Math.max(reach, dayNum(r.end));
  }
  return n;
}

/**
 * Nearest-rank quantile that tolerates `Infinity` (a censored recovery): interpolating between a
 * finite value and Infinity is meaningless, so this picks an actual member of the sample.
 */
export function rankQuantile(values, q) {
  if (values.length === 0) throw new Error("rankQuantile of an empty sample");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

/** p10 / p25 / median / p75 / p90 of a finite sample (interpolated), or null when empty. */
export function band(values) {
  if (values.length === 0) return null;
  return {
    p10: quantile(values, 0.1),
    p25: quantile(values, 0.25),
    p50: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    p90: quantile(values, 0.9),
  };
}

/**
 * One value per episode: the median of `pick` over the episode's sessions (nulls skipped), so a
 * 200-session pullback weighs the same as a 5-session one. Censored values survive as Infinity.
 *
 * @template T
 * @param {T[][]} episodes outcomes grouped by episode
 * @param {(o: T) => number | null | undefined} pick
 */
export function perEpisode(episodes, pick) {
  return episodes
    .map((ep) => ep.map(pick).filter((v) => v != null && !Number.isNaN(v)))
    .filter((vs) => vs.length > 0)
    .map((vs) => rankQuantile(vs, 0.5));
}
