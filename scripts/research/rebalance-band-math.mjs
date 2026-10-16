/**
 * The pure half of the rebalancing-band backtest (`rebalance-band.mjs`, #5483 slice 1, "dry
 * powder"). No I/O: the CLI loads bars and the T-bill yield and hands plain arrays in, so every
 * rule below is specified against constructed series (tests/research/rebalance-band-math.spec.ts).
 *
 * THE RULE BEING TESTED (shape A of #5483, the floor that needs no forecast)
 *
 *   An account holds a target share in a HOLDING place (cash earning the T-bill rate) and the rest
 *   ACTIVE (the stock, standing in for the active book). After every session's close the active
 *   share is read; when it has drifted more than BAND points from its target, the whole account is
 *   moved back to target at that close. A rally past the band trims into holding; a fall past the
 *   band deploys holding. Nothing predicts anything.
 *
 * THE THREE BOOKS EVERY RUN COMPARES
 *
 *   buy and hold     100% active, never touched
 *   static mix       the same starting split as the band, never rebalanced: its active share drifts
 *                    with the tape. The band minus this book is the REBALANCING BONUS: what the
 *                    moving back alone added (or cost), with the cash rate and the starting split
 *                    held equal.
 *   band             the rule above. Buy and hold minus the band is the TREND COST: what keeping
 *                    a reserve gave up against holding everything.
 *
 * Costs: each move pays `costBps` of the amount moved, out of holding. Trades fill at the close
 * that tripped them (the decision and the fill read the same print; a daily cycle is the nearest
 * analog to the bot's own cycle).
 */

/** Sessions either side of a trade that define its "local" trough or peak (about a month). */
export const LOCAL_WINDOW = 21;
/** A trade within this fraction of the local trough (buys) or peak (sells) counts as near it. */
export const NEAR = 0.05;
/** "In drawdown" for the time-under measure: at least this far under the book's prior high. */
export const UNDER = 0.1;

const DAY_MS = 864e5;

/**
 * Per-session growth factors for holding: `out[i]` grows holding from session i−1 to session i.
 * `yields[i]` is that session's annual T-bill yield as a fraction (null = carry the last known
 * one forward; a leading gap uses the first known). Calendar days, compounded, so a weekend
 * earns three days.
 */
export function cashGrowth(dates, yields) {
  const firstKnown = yields.find((y) => y != null && Number.isFinite(y)) ?? 0;
  const out = [1];
  let last = yields[0] != null && Number.isFinite(yields[0]) ? yields[0] : firstKnown;
  for (let i = 1; i < dates.length; i++) {
    const days =
      (Date.parse(`${dates[i]}T00:00:00Z`) - Date.parse(`${dates[i - 1]}T00:00:00Z`)) / DAY_MS;
    // The yield in force over (i−1, i] is the one known at i−1.
    out.push((1 + Math.max(last, 0)) ** (days / 365));
    if (yields[i] != null && Number.isFinite(yields[i])) last = yields[i];
  }
  return out;
}

/**
 * Equal-weight basket bought once on the first session and never rebalanced inside: the index is
 * the mean of each member's growth. Every member must have a close on every session given.
 */
export function basketIndex(memberCloses) {
  if (memberCloses.length === 0) throw new Error("basket of no members");
  const n = memberCloses[0].length;
  for (const m of memberCloses)
    if (m.length !== n) throw new Error("basket members are not aligned to one calendar");
  const out = [];
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const m of memberCloses) s += m[i] / m[0];
    out.push(s / memberCloses.length);
  }
  return out;
}

/**
 * Run one book. `hold` is the holding target (0 = buy and hold), `band` the drift in active-share
 * points that trips a move back to target (Infinity = the static mix, never rebalanced).
 *
 * @returns {{ equity: number[], trades: { i: number, side: "buy" | "sell", drift: number, moved: number }[], maxDrift: number }}
 *   `drift` is the active share minus its target at the close that tripped the move; `moved` the
 *   amount moved as a share of the book; `maxDrift` the largest |drift| seen at any close.
 */
export function simulate(closes, growth, { hold, band, costBps = 0 }) {
  if (!(hold >= 0 && hold < 1)) throw new Error(`hold must be in [0, 1), got ${hold}`);
  const target = 1 - hold;
  let active = target;
  let cash = hold;
  const equity = [1];
  const trades = [];
  let maxDrift = 0;
  for (let i = 1; i < closes.length; i++) {
    active *= closes[i] / closes[i - 1];
    cash *= growth[i];
    const eq = active + cash;
    const drift = active / eq - target;
    if (Math.abs(drift) > maxDrift) maxDrift = Math.abs(drift);
    if (Math.abs(drift) > band) {
      const want = target * eq;
      const trade = want - active; // > 0 buys the stock with holding
      active = want;
      cash = eq - want - (Math.abs(trade) * costBps) / 1e4;
      trades.push({ i, side: trade > 0 ? "buy" : "sell", drift, moved: Math.abs(trade) / eq });
    }
    equity.push(active + cash);
  }
  return { equity, trades, maxDrift };
}

/** Compound annual growth of a book over its dates. */
export function cagr(equity, dates) {
  const years =
    (Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) /
    DAY_MS /
    365.25;
  if (!(years > 0)) throw new Error("cagr over a zero-length window");
  return (equity.at(-1) / equity[0]) ** (1 / years) - 1;
}

/** Years spanned by a date list (calendar, 365.25-day years). */
export function yearsOf(dates) {
  return (
    (Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) /
    DAY_MS /
    365.25
  );
}

/**
 * Drawdown profile of a book: the deepest fall from a prior high, the share of sessions spent at
 * least UNDER below the prior high, and the longest underwater stretch (sessions from a high until
 * a close regains it; a stretch still open at the end counts as far as it got).
 */
export function drawdownProfile(equity, under = UNDER) {
  let peak = equity[0];
  let maxDd = 0;
  let deep = 0;
  let run = 0;
  let longest = 0;
  for (const e of equity) {
    if (e >= peak) {
      peak = e;
      run = 0;
    } else {
      run++;
      if (run > longest) longest = run;
    }
    const dd = e / peak - 1;
    if (dd < maxDd) maxDd = dd;
    if (dd <= -under) deep++;
  }
  return { maxDd, timeUnder: deep / equity.length, longestUnder: longest };
}

/** Sessions with a full local window either side: the only ones the trough test can judge. */
const judgeable = (i, n, w) => i - w >= 0 && i + w <= n - 1;

/** Is the close at `i` within `near` of the lowest close in the ±w sessions around it? */
export function nearTrough(closes, i, w = LOCAL_WINDOW, near = NEAR) {
  let lo = Infinity;
  for (let k = i - w; k <= i + w; k++) if (closes[k] < lo) lo = closes[k];
  return closes[i] <= lo * (1 + near);
}

/** Is the close at `i` within `near` of the highest close in the ±w sessions around it? */
export function nearPeak(closes, i, w = LOCAL_WINDOW, near = NEAR) {
  let hi = -Infinity;
  for (let k = i - w; k <= i + w; k++) if (closes[k] > hi) hi = closes[k];
  return closes[i] >= hi * (1 - near);
}

/**
 * How well a book's moves were timed, against the base rate of any session. Buys are judged
 * against the local trough, sells against the local peak; only trades with a full window either
 * side are judged (the rest are counted as `unjudged`).
 */
export function timing(closes, trades, w = LOCAL_WINDOW, near = NEAR) {
  const n = closes.length;
  const tally = (side, test) => {
    const judged = trades.filter((t) => t.side === side && judgeable(t.i, n, w));
    const hits = judged.filter((t) => test(closes, t.i, w, near)).length;
    let base = 0;
    let days = 0;
    for (let i = w; i <= n - 1 - w; i++) {
      days++;
      if (test(closes, i, w, near)) base++;
    }
    return {
      judged: judged.length,
      hits,
      rate: judged.length ? hits / judged.length : null,
      base: days ? base / days : null,
      unjudged: trades.filter((t) => t.side === side).length - judged.length,
    };
  };
  return { buys: tally("buy", nearTrough), sells: tally("sell", nearPeak) };
}

/** Start indexes of rolling windows of `len` sessions, stepping `step`, that fit inside `n`. */
export function rollingStarts(n, len, step) {
  const out = [];
  for (let s = 0; s + len <= n; s += step) out.push(s);
  return out;
}

/**
 * The price moves, from the last rebalance, that trip a band — ignoring the little holding earns
 * in between. A band is set in points of active share, so the same ±10 means a different fall on
 * a 70% active book than on an 80% one; this is the translation a reader needs.
 *
 * @returns {{ fall: number, rise: number }} fall as a negative fraction (−0.36 = a 36% fall), rise
 *   as a positive one; `rise` is Infinity when the band's upper edge is 100% active (unreachable).
 */
export function triggerMoves(hold, band) {
  const a = 1 - hold;
  const lo = a - band;
  const hi = a + band;
  // Active share after a move m from target a: a(1+m) / (a(1+m) + hold). Solve for the edge e:
  // 1 + m = e·hold / (a(1 − e)).
  const move = (e) => (e * hold) / (a * (1 - e)) - 1;
  return { fall: lo <= 0 ? -1 : move(lo), rise: hi >= 1 ? Infinity : move(hi) };
}

/**
 * The volatility harvest (the "rebalancing bonus" of Shannon's demon, measured the way Booth and
 * Fama do): the band's growth minus the target-weighted geometric mean of its two parts' growth.
 * Positive means rebalancing earned more than its ingredients' average; it says nothing about
 * whether holding everything would have done better (that is the trend cost).
 */
export function harvest(bandCagr, assetCagr, cashCagr, hold) {
  return bandCagr - ((1 + assetCagr) ** (1 - hold) * (1 + cashCagr) ** hold - 1);
}
