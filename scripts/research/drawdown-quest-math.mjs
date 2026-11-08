/**
 * The pure half of the drawdown-quest study (`drawdown-quest-study.mjs`, #7028 slice 2): after a
 * broad index closes 10% or more under its year high with VIX at 25 or more, what did three
 * moves return — buy the shares, sell a cash-secured put, buy a long-dated call? Those numbers are
 * the "base rate" field of a quest (`src/domain/quest.ts`). No I/O here; the CLI loads bars and
 * hands plain arrays in, so every rule is specified against constructed numbers
 * (tests/research/drawdown-quest-math.spec.ts).
 *
 * PRE-REGISTERED, BEFORE ANY RESULT WAS READ (docs/process/EVENT-RESEARCH.md → *Candidate
 * playbooks*, the five steps). Everything in this block was committed ahead of the first run:
 *
 *   threshold   index close >= 10% under the highest close of its last 252 sessions (the read in
 *               `src/domain/daily-high.ts`), AND VIX close >= 25. Both numbers are the placeholders
 *               the plan wrote down (#7028); neither was tuned.
 *   control     every 21st session where the condition does not hold. Two diagnostic controls split
 *               it, "drawdown only" and "VIX only", so a result is not credited to the wrong half.
 *   entries     the first condition session, then the next one at least 21 sessions later.
 *   clusters    an EPISODE is a run of entries with fewer than 63 sessions between them. Entries in
 *               one sell-off share one market factor, so the episode is the sample, never the entry.
 *   power       declared effect 5 percentage points of mean excess over the control, spread 10
 *               points between episodes, bar z 1.96, power z 0.84: 31 episodes. SPY's history holds
 *               about a dozen, so the verdict is expected to read `underpowered`, and that is a
 *               finding, not a failure (`backtest-verdict-math.mjs`: a thin sample never reads as a
 *               kill).
 *   latest era  episodes starting 2018 or later.
 *   moves       shares held 63 sessions (and 252 as a second row); a 0.15-delta put 30 sessions out
 *               (the house wheel's setting, `wheel-cap-math.mjs`) held to expiry; a 24-month 0.80-
 *               delta call, half sold at double and the rest out with 6 months left (the contract
 *               `docs/research/long-leap-dip-2026-10.md` settled on).
 *   calls       an edge is claimed only on `pass`; `kill` says stand aside; `underpowered` publishes
 *               the base rate and claims no edge. The base rate is shown either way, with its
 *               sample size and worst decile (the 10th percentile).
 *
 * MODELED PREMIUM. There is no option-price history offline. Short-dated legs use VIX as the
 * implied vol (VIX is the index's 30-day implied, but a flat read under-prices an out-of-the-money
 * put's skew, which understates the put seller's premium). The long call blends VIX with its own
 * trailing 252-session average (a long-dated option's vol sits nearer the long-run level than the
 * 30-day spike); rows at 0.8x and 1.25x, and at flat VIX, show how far the answer leans on that
 * choice. Zero rate and dividend, the same Black-Scholes as Study A. 2% of the model is paid on the
 * way in and given up on the way out.
 */

import { backtestVerdict, clusterByDate } from "./backtest-verdict-math.mjs";
import { quantile } from "./premium-fit-math.mjs";
import { seeded } from "./wheel-cap-math.mjs";

export const DRAWDOWN = 0.1;
export const VIX_FLOOR = 25;
export const HIGH_WINDOW = 252;
export const STEP = 21;
export const EPISODE_GAP = 63;
export const LATEST_ERA = "2018-01-01";
/** Declared before the run: the effect worth acting on, the spread between episodes, the bars. */
export const POWER = { sdPct: 10, effectPct: 5, zBar: 1.96, zPower: 0.84 };
export const SHARE_HOLDS = [63, 252];
export const PUT_SESSIONS = 30;
export const PUT_DELTA = 0.15;
export const CALL_YEARS = 2;
export const CALL_DELTA = 0.8;
export const CALL_HOLD = 378;
export const TAKE_PROFIT = 2;
export const SLIPPAGE = 0.02;
export const YEAR = 252;

/**
 * Index and VIX closes on the dates both have. `vixAvg` is the mean VIX of the 252 sessions ending
 * that day (null until a year of VIX is in hand).
 *
 * @param {{date: string, close: number}[]} index ascending
 * @param {{date: string, close: number}[]} vix ascending
 */
export function alignSeries(index, vix) {
  const vixOn = new Map(vix.map((b) => [b.date, b.close]));
  const dates = [];
  const close = [];
  const vixClose = [];
  for (const bar of index) {
    const v = vixOn.get(bar.date);
    if (v == null || !(bar.close > 0) || !(v > 0)) continue;
    dates.push(bar.date);
    close.push(bar.close);
    vixClose.push(v);
  }
  const vixAvg = vixClose.map((_, t) => {
    if (t < YEAR - 1) return null;
    let sum = 0;
    for (let j = t - YEAR + 1; j <= t; j++) sum += vixClose[j];
    return sum / YEAR;
  });
  return { dates, close, vix: vixClose, vixAvg };
}

/** How far the close at `t` sits under its trailing 252-session high: 0.1 is 10% under. */
export function underHigh(close, t) {
  if (t < HIGH_WINDOW - 1) return null;
  let high = 0;
  for (let j = t - HIGH_WINDOW + 1; j <= t; j++)
    high = Math.max(high, close[j]);
  return 1 - close[t] / high;
}

/** Which half of the condition holds at `t`: "both", "drawdown", "vix", "neither", or null. */
export function stateAt(series, t) {
  const under = underHigh(series.close, t);
  if (under == null) return null;
  const deep = under >= DRAWDOWN;
  const fearful = series.vix[t] >= VIX_FLOOR;
  if (deep && fearful) return "both";
  if (deep) return "drawdown";
  if (fearful) return "vix";
  return "neither";
}

/** Session indexes whose state is in `states`, each at least `step` after the last kept. */
export function pickEntries(series, states, step = STEP) {
  const kept = [];
  let next = 0;
  for (let t = 0; t < series.close.length; t++) {
    const s = stateAt(series, t);
    if (s == null || t < next || !states.includes(s)) continue;
    kept.push(t);
    next = t + step;
  }
  return kept;
}

/** Entry indexes to episode numbers: a gap of `gap` sessions or more starts a new episode. */
export function episodesOf(entries, gap = EPISODE_GAP) {
  let id = 0;
  return entries.map((t, k) => {
    if (k > 0 && t - entries[k - 1] >= gap) id++;
    return id;
  });
}

/** Index return from `t` over `hold` sessions, or null when the tape has not run that far. */
export function shareReturn(close, t, hold) {
  return t + hold < close.length ? close[t + hold] / close[t] - 1 : null;
}

const d1Of = (spot, strike, vol, years) =>
  (Math.log(spot / strike) + 0.5 * vol * vol * years) /
  (vol * Math.sqrt(years));

/** Standard normal CDF (Abramowitz-Stegun 7.1.26). */
function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) * Math.SQRT1_2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Black-Scholes call at zero rate; intrinsic at or past expiry. */
export function callValue(spot, strike, vol, years) {
  if (!(years > 0 && vol > 0)) return Math.max(spot - strike, 0);
  const d1 = d1Of(spot, strike, vol, years);
  return spot * normCdf(d1) - strike * normCdf(d1 - vol * Math.sqrt(years));
}

/** Black-Scholes put at zero rate; intrinsic at or past expiry. */
export function putValue(spot, strike, vol, years) {
  if (!(years > 0 && vol > 0)) return Math.max(strike - spot, 0);
  const d1 = d1Of(spot, strike, vol, years);
  return strike * normCdf(-(d1 - vol * Math.sqrt(years))) - spot * normCdf(-d1);
}

/** The strike where `value(strike)` crosses `delta`, by bisection; `falling` is its direction. */
function strikeFor(spot, deltaAt, delta, falling) {
  let low = spot * 0.01;
  let high = spot * 5;
  for (let k = 0; k < 80; k++) {
    const mid = (low + high) / 2;
    const above = deltaAt(mid) > delta;
    if (above === falling) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * One cash-secured put sold at the close of `t` and held `sessions` to expiry, per dollar of cash
 * secured (the strike): the premium (less slippage), assignment, and the P/L with assigned shares
 * marked at the expiry close. Null when the tape has not reached expiry.
 *
 * @returns {{premium: number, assigned: boolean, pnl: number} | null}
 */
export function putCycle({
  close,
  vol,
  t,
  sessions = PUT_SESSIONS,
  delta = PUT_DELTA,
}) {
  if (t + sessions >= close.length) return null;
  const years = sessions / YEAR;
  const spot = close[t];
  const v = vol[t];
  const strike = strikeFor(
    spot,
    (k) => normCdf(-d1Of(spot, k, v, years)),
    delta,
    false, // |delta| rises with the strike
  );
  const premium = (putValue(spot, strike, v, years) * (1 - SLIPPAGE)) / strike;
  const end = close[t + sessions];
  return {
    premium,
    assigned: end < strike,
    pnl: premium - Math.max(strike - end, 0) / strike,
  };
}

/**
 * One long-dated call bought at the close of `t`. `volAt(j)` is the implied vol the model reads at
 * session j. Returns its return on premium under two exits: sold at `takeProfit` times its cost
 * when it gets there (otherwise out at `hold`), and held to `hold` regardless. The study's
 * contract averages the two: half sold at double, the rest runs. Null when the tape is short.
 *
 * @returns {{sold: number, ran: number, half: number, hit: boolean, days: number | null} | null}
 */
export function callLegs({
  close,
  volAt,
  t,
  years = CALL_YEARS,
  delta = CALL_DELTA,
  hold = CALL_HOLD,
  takeProfit = TAKE_PROFIT,
}) {
  if (t + hold >= close.length) return null;
  const spot = close[t];
  const v0 = volAt(t);
  const strike = strikeFor(
    spot,
    (k) => normCdf(d1Of(spot, k, v0, years)),
    delta,
    true,
  );
  const paid = callValue(spot, strike, v0, years) * (1 + SLIPPAGE);
  let ran = 0;
  let sold = null;
  let days = null;
  for (let k = 1; k <= hold; k++) {
    const left = years - k / YEAR;
    const mark =
      callValue(close[t + k], strike, volAt(t + k), left) * (1 - SLIPPAGE);
    if (sold == null && mark >= takeProfit * paid) {
      sold = mark / paid - 1;
      days = k;
    }
    if (k === hold) ran = mark / paid - 1;
  }
  const soldOrRan = sold ?? ran;
  return {
    sold: soldOrRan,
    ran,
    half: (soldOrRan + ran) / 2,
    hit: sold != null,
    days,
  };
}

/** The long call's vol read: a blend of VIX and its own year average, scaled by `scale`. */
export function blendedVol(series, scale = 1) {
  return (j) => {
    const avg = series.vixAvg[j] ?? series.vix[j];
    return (scale * (series.vix[j] + avg)) / 2 / 100;
  };
}

/** VIX alone as a vol read, scaled, as a fraction. */
export const flatVol =
  (series, scale = 1) =>
  (j) =>
    (scale * series.vix[j]) / 100;

/**
 * The shape a base rate is quoted in: how many entries, how many episodes, the mean and median,
 * the share that finished above zero, and the 10th percentile (the worst decile's edge).
 *
 * @param {number[]} values
 * @param {number} [episodes]
 */
export function summarize(values, episodes) {
  if (values.length === 0) return { n: 0, episodes: episodes ?? 0 };
  return {
    n: values.length,
    episodes,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    median: quantile(values, 0.5),
    win: values.filter((v) => v > 0).length / values.length,
    p10: quantile(values, 0.1),
  };
}

/**
 * The condition's mean minus the control's, with a 90% interval from resampling whole calendar
 * years in each (one sell-off, one year; the entries inside it are not independent).
 *
 * @param {{date: string, value: number}[]} rows condition entries
 * @param {{date: string, value: number}[]} base control entries
 */
export function gapInterval(rows, base, { draws = 2000, seed = 7028 } = {}) {
  const byYear = (list) => {
    const years = new Map();
    for (const { date, value } of list) {
      const key = date.slice(0, 4);
      years.set(key, [...(years.get(key) ?? []), value]);
    }
    return [...years.values()];
  };
  const a = byYear(rows);
  const b = byYear(base);
  if (a.length === 0 || b.length === 0) return null;
  const rand = seeded(seed);
  const resample = (groups) => {
    const drawn = [];
    for (let i = 0; i < groups.length; i++)
      drawn.push(...groups[Math.floor(rand() * groups.length)]);
    return drawn.reduce((s, v) => s + v, 0) / drawn.length;
  };
  const mean = (list) =>
    list.flat().reduce((s, v) => s + v, 0) / list.flat().length;
  const gaps = [];
  for (let d = 0; d < draws; d++) gaps.push(resample(a) - resample(b));
  return {
    gap: mean(a) - mean(b),
    lo: quantile(gaps, 0.05),
    hi: quantile(gaps, 0.95),
    years: a.length,
  };
}

/**
 * The pre-registered verdict for one move: each episode's mean excess over the control mean, in
 * percent, judged by `backtestVerdict` at the declared power. `latestEraSameSign` is the mean
 * excess of episodes starting on or after LATEST_ERA having the whole sample's sign.
 *
 * @param {{date: string, value: number, episode: number}[]} rows condition entries (a fraction)
 * @param {number} controlMean the control's mean (a fraction)
 */
export function moveVerdict(rows, controlMean) {
  const byEpisode = new Map();
  for (const r of rows) {
    const cell = byEpisode.get(r.episode) ?? { date: r.date, values: [] };
    cell.values.push(r.value);
    byEpisode.set(r.episode, cell);
  }
  const clusters = clusterByDate(
    [...byEpisode.values()].map((e) => ({
      date: e.date,
      value:
        (e.values.reduce((s, v) => s + v, 0) / e.values.length - controlMean) *
        100,
    })),
  );
  const all = clusters.length
    ? clusters.reduce((s, c) => s + c.value, 0) / clusters.length
    : 0;
  const recent = clusters.filter((c) => c.date >= LATEST_ERA);
  const recentMean = recent.length
    ? recent.reduce((s, c) => s + c.value, 0) / recent.length
    : 0;
  const sameSign =
    recent.length > 0 && Math.sign(recentMean) === Math.sign(all);
  return backtestVerdict(clusters, POWER, sameSign);
}
