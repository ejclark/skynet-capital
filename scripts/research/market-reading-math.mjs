/**
 * The pure half of the market reading (`market-reading.mjs`, plan #5496): one bull ↔ bear score
 * per session for the whole market, built from five votes anyone can check against a chart. No I/O
 * here — the CLI loads bars and hands plain arrays in, so every rule below is specified against
 * constructed series (tests/research/market-reading-math.spec.ts).
 *
 * THE VOTES (each −1 · −0.5 · 0 · +0.5 · +1; a vote is null when its input is missing)
 *
 *   trend       per index (SPY, QQQ): +1 when the close AND the 50-session average sit above the
 *               200-session average, −1 when both sit below it, 0 when they disagree. The vote is
 *               the mean of the two indexes.
 *   drawdown    per index: the house drawdown (close vs the 60-session closing high, the rule in
 *               cycle-phase-math.mjs): +1 within 3% of the high, −1 at 10% or more under it, 0
 *               between. The mean of the two indexes.
 *   vix level   the house VIX buckets (cycle-phase-math.mjs `vixBucket`): calm (< 20) +1,
 *               elevated (20–25) 0, fear (≥ 25) −1.
 *   vix term    VIX / VIX3M: < 0.90 +1 (contango: the near month is calmer than the quarter),
 *               ≥ 1.00 −1 (backwardation: stress is priced as now, not later), between 0.
 *   breadth     the share of a fixed basket (the nine original SPDR sector funds) closing above
 *               its own 50-session average: ≥ 60% +1, ≤ 40% −1, between 0.
 *
 * THE SCORE. 100 × the mean of the votes present, rounded; null with fewer than MIN_VOTES votes.
 * Equal weights on purpose: a weight is a fitted parameter, and nothing here is fitted to the
 * forward returns it is later sorted against.
 *
 * THE READING. ≥ 60 bull · 20 to 59 leaning bull · −19 to 19 mixed · −59 to −20 leaning bear ·
 * ≤ −60 bear.
 *
 * NO LOOK-AHEAD. Every vote on session t reads closes at t and before. The forward returns used to
 * grade the score (`forward`) are the only thing that reads past t, and they are an outcome, never
 * an input.
 */

import { drawdowns, episodesOf, NEAR_HIGH, PULLBACK, vixBucket } from "./cycle-phase-math.mjs";

export const FAST = 50;
export const SLOW = 200;
export const TERM_CALM = 0.9;
export const TERM_STRESS = 1.0;
export const BREADTH_BULL = 0.6;
export const BREADTH_BEAR = 0.4;
/** A breadth share needs this many funds with a 50-session average, or it is null. */
export const MIN_BREADTH = 6;
/** A score needs this many of the five votes, or it is null. */
export const MIN_VOTES = 4;
export const HORIZON = 21;
export const VOTES = ["trend", "drawdown", "vixLevel", "vixTerm", "breadth"];
export const READINGS = ["bull", "leaning bull", "mixed", "leaning bear", "bear"];

/**
 * Trailing simple moving average; null until `n` closes exist.
 *
 * @param {number[]} closes ascending
 * @param {number} n
 * @returns {(number | null)[]}
 */
export function sma(closes, n) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= n) sum -= closes[i - n];
    out.push(i >= n - 1 ? sum / n : null);
  }
  return out;
}

/** +1 / 0 / −1 from close, the 50- and the 200-session average; null before the 200 exists. */
export function trendVote(close, fast, slow) {
  if (close == null || fast == null || slow == null) return null;
  const above = close > slow;
  if (above === fast > slow) return above ? 1 : -1;
  return 0;
}

/** +1 within 3% of the 60-session high, −1 at 10% or more under it, 0 between. */
export function drawdownVote(dd) {
  if (dd == null) return null;
  if (dd > NEAR_HIGH) return 1;
  if (dd <= PULLBACK) return -1;
  return 0;
}

/** calm +1 · elevated 0 · fear −1, by the house buckets. */
export function vixLevelVote(vix) {
  const b = vixBucket(vix);
  return b == null ? null : b === "calm" ? 1 : b === "fear" ? -1 : 0;
}

/** VIX over VIX3M: contango +1, backwardation −1, flat 0. */
export function vixTermVote(vix, vix3m) {
  if (vix == null || vix3m == null || vix3m <= 0) return null;
  const ratio = vix / vix3m;
  if (ratio < TERM_CALM) return 1;
  if (ratio >= TERM_STRESS) return -1;
  return 0;
}

/**
 * Share of funds closing above their own 50-session average, of those that have one.
 *
 * @param {(boolean | null | undefined)[]} above one entry per fund; null when it has no average yet
 * @returns {{up: number, of: number, share: number | null}}
 */
export function breadthShare(above) {
  const known = above.filter((a) => a != null);
  const up = known.filter(Boolean).length;
  return { up, of: known.length, share: known.length < MIN_BREADTH ? null : up / known.length };
}

export function breadthVote(share) {
  if (share == null) return null;
  if (share >= BREADTH_BULL) return 1;
  if (share <= BREADTH_BEAR) return -1;
  return 0;
}

/** The mean of the votes that are present (an index with no data drops out, never reads as 0). */
export function meanVote(votes) {
  const known = votes.filter((v) => v != null);
  return known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
}

/**
 * The score from the five votes: 100 × their mean, or null with fewer than MIN_VOTES present.
 *
 * @param {Record<string, number | null>} votes keyed by VOTES
 */
export function scoreOf(votes) {
  const known = VOTES.map((k) => votes[k]).filter((v) => v != null);
  if (known.length < MIN_VOTES) return null;
  return Math.round((100 * known.reduce((a, b) => a + b, 0)) / known.length);
}

/** The five-way reading of a score, per this file's header. */
export function readingOf(score) {
  if (score == null) return null;
  if (score >= 60) return "bull";
  if (score >= 20) return "leaning bull";
  if (score > -20) return "mixed";
  if (score > -60) return "leaning bear";
  return "bear";
}

/**
 * Per-session votes for one index: trend and drawdown, aligned to its own closes.
 *
 * @param {number[]} closes ascending
 */
export function indexVotes(closes) {
  const fast = sma(closes, FAST);
  const slow = sma(closes, SLOW);
  const dds = drawdowns(closes);
  return closes.map((c, i) => ({
    trend: trendVote(c, fast[i], slow[i]),
    drawdown: drawdownVote(dds[i]?.dd ?? null),
    dd: dds[i]?.dd ?? null,
  }));
}

/**
 * What followed session t over `h` sessions: the close-to-close return and the lowest close on
 * the way (vs the entry close). Null when fewer than `h` sessions follow: an unfinished window is
 * not an outcome.
 *
 * @param {number[]} closes
 * @param {number} t
 */
export function forward(closes, t, h = HORIZON) {
  if (t + h >= closes.length) return null;
  let low = Number.POSITIVE_INFINITY;
  for (let s = 1; s <= h; s++) low = Math.min(low, closes[t + s]);
  return { ret: closes[t + h] / closes[t] - 1, low: low / closes[t] - 1 };
}

/**
 * Sessions grouped by reading, then split into EPISODES by the house rule (`episodesOf`): a gap of
 * more than `gap` sessions between two sessions with the same label starts a new episode. One bull
 * year is one episode, so it weighs the same as one bull month when outcomes are reduced per
 * episode — the n a reader should trust is the episode count, not the session count.
 *
 * @param {(string | null)[]} labels one per session
 * @returns {Map<string, number[][]>}
 */
export function episodesByReading(labels, gap = HORIZON) {
  const idx = new Map();
  labels.forEach((label, i) => {
    if (label == null) return;
    if (!idx.has(label)) idx.set(label, []);
    idx.get(label).push(i);
  });
  return new Map([...idx].map(([label, is]) => [label, episodesOf(is, gap)]));
}

/**
 * The reading of each score's trailing `n`-session mean: the smoothing a calendar strip draws, so
 * a middle reading that flips daily does not flicker the strip. Nulls are skipped, not zeroed.
 *
 * @param {(number | null)[]} scores
 */
export function smoothReadings(scores, n = 5) {
  return scores.map((_, i) => {
    const w = scores.slice(Math.max(0, i - n + 1), i + 1).filter((s) => s != null);
    return w.length ? readingOf(Math.round(w.reduce((a, b) => a + b, 0) / w.length)) : null;
  });
}

/**
 * Consecutive equal labels as runs, in order.
 *
 * @param {(string | null)[]} labels
 * @returns {{reading: string | null, n: number}[]}
 */
export function runsOf(labels) {
  const runs = [];
  for (const reading of labels) {
    const cur = runs.at(-1);
    if (cur && cur.reading === reading) cur.n++;
    else runs.push({ reading, n: 1 });
  }
  return runs;
}
