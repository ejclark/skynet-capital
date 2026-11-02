/**
 * The pure half of the wheel strike-cap study (`wheel-cap-study.mjs`, #6598 slice 1, Study A):
 * does capping a wheel's sold put at the cycle detector's floor-band median beat the playbook's own
 * strike? No I/O here; the CLI loads bars, prints and VIX and hands plain arrays in, so every rule
 * below is specified against constructed numbers (tests/research/wheel-cap-math.spec.ts).
 *
 * THE TWO ARMS, both read off the live code so the replay sells what the bot would sell:
 *
 *   playbook   the strike whose put |delta| is 0.15 (CRWV-WHEEL's `putDelta`, `registry.ts`)
 *   capped     the same strike when it sits at or under the cap. Above the cap, the strike moves
 *              down to the cap, but only while its |delta| stays inside the picker's window
 *              (target ± `DELTA_MISS`, `wheel.ts`); below the window the picker finds nothing and
 *              the bot sells nothing that cycle. That idle cycle is scored as zero, not dropped:
 *              dropping it would grade the cap only on the days it was easy.
 *
 * THE CAP IS POINT-IN-TIME. The live fence is one price from one run (claim 7, 2026-10-16). As a
 * rule it reads: on a sale day, take the cycle detector's headline band for that day's weather and
 * cap at close × (1 + its median further low). The replay rebuilds that band on every sale day from
 * outcomes already finished by then (an entry's 63-session window closed on or before the sale),
 * so no sale is capped with a number the bot could not have had.
 *
 * MODELED PREMIUM. No option-price history exists offline (the limit `long-leap-dip-2026-10.md`
 * states), so a put is priced by Black–Scholes at zero rate on a realized-vol proxy. Both arms are
 * priced by the same model on the same day, so the proxy moves both together; the CLI re-runs the
 * headline at 0.8× and 1.25× the proxy to show how far it moves the difference.
 */

import { band, clusterCount, episodesOf, perEpisode } from "./cycle-phase-math.mjs";

/** The wheel's put target on CRWV-WHEEL (`registry.ts` putDelta, conservative mode's target). */
export const TARGET_DELTA = 0.15;
/** How far a sold strike's |delta| may sit from the target before the picker refuses it. */
export const DELTA_MISS = 0.05;
/** The wheel's expiry window, calendar days (`wheel.ts`: MIN_DTE_FLOOR on CRWV, MAX_DTE). */
export const MIN_DTE = 14;
export const MAX_DTE = 45;
/** Independent units a headline band needs (`cycle-phase.mjs` MIN_UNITS). */
export const MIN_UNITS = 8;

/** Standard normal CDF (Abramowitz–Stegun 7.1.26; error under 1.5e-7). */
export function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) * Math.SQRT1_2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

const d1Of = (spot, strike, vol, years) =>
  (Math.log(spot / strike) + 0.5 * vol * vol * years) / (vol * Math.sqrt(years));

/** Black–Scholes European put, zero rate and dividend (a month's carry rounds to nothing). */
export function putValue(spot, strike, vol, years) {
  if (!(years > 0 && vol > 0)) return Math.max(strike - spot, 0);
  const d1 = d1Of(spot, strike, vol, years);
  return strike * normCdf(-(d1 - vol * Math.sqrt(years))) - spot * normCdf(-d1);
}

/** A put's |delta| at zero rate: N(−d1). */
export function putAbsDelta(spot, strike, vol, years) {
  return normCdf(-d1Of(spot, strike, vol, years));
}

/** The strike whose put |delta| is `delta`, by bisection (|delta| rises with the strike). */
export function strikeForPutDelta(spot, vol, years, delta = TARGET_DELTA) {
  let low = spot * 0.01;
  let high = spot * 3;
  for (let k = 0; k < 80; k++) {
    const mid = (low + high) / 2;
    if (putAbsDelta(spot, mid, vol, years) < delta) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * The strike each arm sells. `cap` null means no floor could be read that day (no band reached
 * MIN_UNITS); the capped arm then sells the playbook's strike, as the live resolver would with no
 * ceiling to apply.
 *
 * @returns {{playbook: number, capped: number | null, binds: boolean, blocked: boolean}}
 *   `capped` is null when the cap leaves no strike inside the picker's window (`blocked`).
 */
export function armStrikes({ spot, vol, years, cap }) {
  const playbook = strikeForPutDelta(spot, vol, years);
  if (cap == null || playbook <= cap) {
    return { playbook, capped: playbook, binds: false, blocked: false };
  }
  const blocked = putAbsDelta(spot, cap, vol, years) < TARGET_DELTA - DELTA_MISS;
  return { playbook, capped: blocked ? null : cap, binds: true, blocked };
}

/**
 * One sold put held to expiry, per dollar of cash it secured (the strike): the premium kept,
 * whether it was assigned, and its P/L marked at the expiry close (assigned shares at that close).
 * A null strike is the idle cycle: nothing sold, nothing earned, nothing lost.
 */
export function saleResult({ strike, spot, vol, years, closeAtExpiry }) {
  if (strike == null) return { sold: false, premium: 0, assigned: false, pnl: 0 };
  const premium = putValue(spot, strike, vol, years) / strike;
  const assigned = closeAtExpiry < strike;
  const pnl = premium - Math.max(strike - closeAtExpiry, 0) / strike;
  return { sold: true, premium, assigned, pnl };
}

/**
 * Whether session `t` sits in a print's blackout tail: the filing session itself or the one after
 * it (`optionPrintBlackout` in `earnings-calendar.ts` ends at the session after the print, because
 * an after-close print's move lands then). The wheel opens nothing on those days.
 *
 * @param {string[]} dates ascending session dates
 * @param {number} t
 * @param {string[]} prints ascending filing dates
 */
export function inPrintTail(dates, t, prints) {
  const last = prints.filter((p) => p <= dates[t]).at(-1);
  if (!last) return false;
  let first = t;
  while (first > 0 && dates[first - 1] >= last) first--;
  return t - first <= 1;
}

/**
 * The latest Friday expiry inside [MIN_DTE, MAX_DTE] calendar days of `date` that falls strictly
 * before `nextPrint` (the wheel never holds a sold put across a print), or null when none does: the
 * wheel is dark that day.
 */
export function expiryFor(date, nextPrint) {
  const day0 = Date.parse(`${date}T00:00:00Z`);
  for (let d = MAX_DTE; d >= MIN_DTE; d--) {
    const iso = new Date(day0 + d * 864e5).toISOString().slice(0, 10);
    if (new Date(`${iso}T00:00:00Z`).getUTCDay() !== 5) continue;
    if (nextPrint && iso >= nextPrint) continue;
    return { expiry: iso, days: d };
  }
  return null;
}

/** One level's matching entries, finished by `asOf`, as episodes per name plus their date ranges. */
function maturedEpisodes(members, match, asOf) {
  const groups = [];
  const ranges = [];
  for (const n of members) {
    const hits = [];
    for (const e of n.entries) {
      if (e.maturedOn > asOf) break; // ascending t means ascending maturity
      if (match(e)) hits.push(e);
    }
    const byT = new Map(hits.map((e) => [e.t, e]));
    for (const ep of episodesOf(hits.map((e) => e.t))) {
      groups.push(ep.map((t) => byT.get(t)));
      ranges.push({ start: byT.get(ep[0]).date, end: byT.get(ep.at(-1)).date });
    }
  }
  return { groups, ranges };
}

/**
 * The cycle detector's headline floor as it read on one past day: the same sample/level ladder as
 * `cycle-phase.mjs` pickHeadline (own exact → own dd+sector → own dd only → pooled, same order),
 * built only from entries whose outcome window had closed by then.
 *
 * @param {object} p
 * @param {string} p.sym the name being sold
 * @param {{bucket: number, wide: boolean | null, vix: string | null}} p.state that day's weather
 * @param {Map<string, {sym: string, entries: {t: number, date: string, maturedOn: string,
 *   bucket: number, wide: boolean | null, vix: string | null, further: number}[]}>} p.names
 *   every basket name's matured-outcome entries, ascending by `t`
 * @param {string} p.asOf the sale day: an entry counts only when `maturedOn <= asOf`
 * @returns {{p25: number, p50: number, p75: number, sample: string, level: string,
 *   units: number} | null} the further-low band (p50 is the fence; p25 and p75 are the CLI's
 *   deeper and shallower comparison caps)
 */
export function headlineFloor({ sym, state, names, asOf }) {
  const hit = headlineSample({ sym, state, names, asOf, pick: (e) => e.further });
  if (!hit) return null;
  const b = band(hit.values);
  return {
    p25: b.p25,
    p50: b.p50,
    p75: b.p75,
    sample: hit.sample,
    level: hit.level,
    units: hit.units,
  };
}

/**
 * The ladder `headlineFloor` climbs, for any one measure: the first sample/level with MIN_UNITS
 * independent units and at least one value, and its per-episode values (`perEpisode`, so a censored
 * Infinity survives). Study B (`long-call-fence-math.mjs`) reads the recovery band through it.
 *
 * @param {object} p `headlineFloor`'s inputs, plus `pick`: the measure read off each entry
 * @returns {{values: number[], sample: string, level: string, units: number} | null}
 */
export function headlineSample({ sym, state, names, asOf, pick }) {
  const levels = [
    ["exact", (e) => e.bucket === state.bucket && e.wide === state.wide && e.vix === state.vix],
    ["dd+sector", (e) => e.bucket === state.bucket && e.wide === state.wide],
    ["dd only", (e) => e.bucket === state.bucket],
  ];
  const samples = [
    ["own", [names.get(sym)].filter(Boolean)],
    ["pooled", [...names.values()]],
  ];
  for (const [sample, members] of samples)
    for (const [level, match] of levels) {
      const { groups, ranges } = maturedEpisodes(members, match, asOf);
      const units = sample === "own" ? groups.length : clusterCount(ranges);
      if (units < MIN_UNITS) continue;
      const values = perEpisode(groups, pick);
      if (values.length) return { values, sample, level, units };
    }
  return null;
}

/** A small seeded PRNG (mulberry32), so every interval the CLI prints is reproducible. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The mean of `value` over rows and its 90% interval, resampling whole BLOCKS (calendar quarters
 * across every name) rather than rows. Weekly sales overlap and one sell-off hits the whole basket,
 * so rows are not independent; quarters nearly are (no sale holds past 45 days). The block count is
 * the honest n.
 *
 * @template R
 * @param {R[]} rows
 * @param {(r: R) => number} value
 * @param {(r: R) => string} blockOf
 */
export function blockInterval(rows, value, blockOf, { draws = 2000, seed = 5482 } = {}) {
  const blocks = new Map();
  for (const r of rows) {
    const k = blockOf(r);
    const b = blocks.get(k) ?? { sum: 0, n: 0 };
    b.sum += value(r);
    b.n += 1;
    blocks.set(k, b);
  }
  const list = [...blocks.values()];
  const total = list.reduce((s, b) => s + b.n, 0);
  if (!total) return null;
  const mean = list.reduce((s, b) => s + b.sum, 0) / total;
  const rand = seeded(seed);
  const means = [];
  for (let d = 0; d < draws; d++) {
    let sum = 0;
    let n = 0;
    for (let k = 0; k < list.length; k++) {
      const b = list[Math.floor(rand() * list.length)];
      sum += b.sum;
      n += b.n;
    }
    means.push(sum / n);
  }
  means.sort((x, y) => x - y);
  return {
    mean,
    lo: means[Math.floor(0.05 * draws)],
    hi: means[Math.ceil(0.95 * draws) - 1],
    blocks: list.length,
    rows: total,
  };
}

/** The calendar quarter of an ISO date, e.g. "2022Q3": the block a sale is resampled with. */
export const quarterOf = (iso) =>
  `${iso.slice(0, 4)}Q${Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1}`;
