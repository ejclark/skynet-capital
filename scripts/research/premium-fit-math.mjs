/**
 * Premium-fit math — the pure reducers behind `premium-fit.mjs` (#4469 slice 1).
 *
 * WHY THESE AND NOT "IS IV HIGH". The wheel sells options, so its edge is not "the stock moves a
 * lot" — a high-volatility name is priced for high volatility. The edge, if it exists, is the
 * VARIANCE RISK PREMIUM: what the chain charges for the next 30 days against what the stock then
 * actually delivers over 30 days. So the comparator here is deliberately the distribution of
 * *forward* realized volatility, measured from the symbol's own tape, never the trailing window a
 * casual read reaches for. Selling 70 vol into a name that realizes 75 is paying for the privilege.
 *
 * The second reducer pair exists for the same reason on the assignment side. A put's |delta| is
 * the market's risk-neutral odds of finishing in the money; `shareBelow` is the odds the symbol's
 * own history gives the same strike. Where the two disagree, the gap is the thing being paid for.
 *
 * PURE: no I/O, no clock, no network. Every function takes its data. Overlapping-window caveats
 * are the caller's to state — see the doc each run produces.
 */

/** Trading days in a year — the annualization convention the research corpus already uses. */
export const TRADING_DAYS = 252;

/**
 * Close-to-close log returns from split/dividend-adjusted bars.
 *
 * @param {{date: string, close: number}[]} bars ascending by date
 * @returns {number[]} one fewer than `bars`
 */
export function logReturns(bars) {
  const out = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].close;
    const now = bars[i].close;
    if (!(prev > 0 && now > 0)) throw new Error(`non-positive close at ${bars[i].date}`);
    out.push(Math.log(now / prev));
  }
  return out;
}

/**
 * Annualized close-to-close volatility of a return series, as a decimal (0.70 = 70 vol).
 *
 * Sample standard deviation (n−1), zero-mean NOT assumed: over a 30-day window on a name that
 * doubled, forcing the mean to zero would book the drift as volatility.
 *
 * @param {number[]} returns
 * @returns {number}
 */
export function annualizedVol(returns) {
  if (returns.length < 2)
    throw new Error(`need ≥2 returns to measure volatility, got ${returns.length}`);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * TRADING_DAYS);
}

/**
 * Annualized volatility of the last `window` returns — the trailing realized read.
 *
 * @param {number[]} returns
 * @param {number} window
 * @returns {number}
 */
export function trailingVol(returns, window) {
  if (returns.length < window) throw new Error(`history too short: ${returns.length} < ${window}`);
  return annualizedVol(returns.slice(-window));
}

/**
 * Every overlapping forward-`horizon` realized volatility in the series — the distribution a
 * seller is actually quoting against.
 *
 * Overlapping by design: a non-overlapping sample of 30-day windows over an 18-month history is
 * twelve observations and tells you nothing. The cost is autocorrelation, which widens the true
 * confidence interval well past what the sample size suggests; the run's doc says so out loud.
 *
 * @param {number[]} returns
 * @param {number} horizon
 * @returns {number[]}
 */
export function forwardVols(returns, horizon) {
  if (horizon < 2) throw new Error(`horizon must be ≥2, got ${horizon}`);
  const out = [];
  for (let i = 0; i + horizon <= returns.length; i++)
    out.push(annualizedVol(returns.slice(i, i + horizon)));
  return out;
}

/**
 * Every overlapping forward-`horizon` simple return — the distribution behind both the assignment
 * odds and the honest drawdown line.
 *
 * @param {{close: number}[]} bars
 * @param {number} horizon in trading days
 * @returns {number[]}
 */
export function forwardReturns(bars, horizon) {
  if (horizon < 1) throw new Error(`horizon must be ≥1, got ${horizon}`);
  const out = [];
  for (let i = 0; i + horizon < bars.length; i++)
    out.push(bars[i + horizon].close / bars[i].close - 1);
  return out;
}

/**
 * The share of `values` strictly below `x`, 0–1 — the percentile the sample puts a reading at.
 *
 * @param {number[]} values
 * @param {number} x
 * @returns {number}
 */
export function percentileRank(values, x) {
  if (values.length === 0) throw new Error("percentileRank of an empty sample");
  return values.filter((v) => v < x).length / values.length;
}

/** The share of `values` at or below `threshold`, 0–1 — empirical odds of finishing under a strike. */
export const shareBelow = (values, threshold) => {
  if (values.length === 0) throw new Error("shareBelow of an empty sample");
  return values.filter((v) => v <= threshold).length / values.length;
};

/**
 * The `q`-quantile (0–1) of a sample, linearly interpolated. Sorts a copy — the caller's array is
 * never reordered under it.
 *
 * @param {number[]} values
 * @param {number} q
 * @returns {number}
 */
export function quantile(values, q) {
  if (values.length === 0) throw new Error("quantile of an empty sample");
  if (!(q >= 0 && q <= 1)) throw new Error(`quantile q must be in [0,1], got ${q}`);
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const low = Math.floor(pos);
  const high = Math.ceil(pos);
  return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (pos - low);
}

/** The arithmetic mean of a sample. */
export const mean = (values) => {
  if (values.length === 0) throw new Error("mean of an empty sample");
  return values.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * `days` calendar days after an ISO date, as an ISO date. UTC-anchored for the same reason
 * `daysBetween` is.
 *
 * @param {string} from
 * @param {number} days
 * @returns {string}
 */
export function addDays(from, days) {
  const ms = Date.parse(`${from}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`unparseable date: ${from}`);
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Does a quiet stretch forecast a quiet month? The correlation between trailing-`lookback`
 * volatility and the volatility of the `horizon` sessions that follow it.
 *
 * This exists because it is the FIRST objection to any fit verdict taken against a historical
 * realized distribution: "the symbol has calmed down, so its own past is the wrong comparator."
 * Volatility clustering says that objection should usually carry — so the instrument measures it
 * on the symbol's own tape rather than assuming it either way. A correlation near zero means the
 * current calm is uninformative and the historical distribution stands; a high one means the
 * verdict needs the conditional distribution instead, and the run says so.
 *
 * @param {number[]} returns
 * @param {number} lookback sessions behind each anchor
 * @param {number} horizon sessions ahead of it
 * @returns {{correlation: number, pairs: number}}
 */
export function volPersistence(returns, lookback, horizon) {
  const past = [];
  const future = [];
  for (let i = lookback; i + horizon <= returns.length; i++) {
    past.push(annualizedVol(returns.slice(i - lookback, i)));
    future.push(annualizedVol(returns.slice(i, i + horizon)));
  }
  if (past.length < 3)
    throw new Error(`need ≥3 overlapping pairs to correlate, got ${past.length}`);
  const mx = mean(past);
  const my = mean(future);
  let cov = 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < past.length; i++) {
    cov += (past[i] - mx) * (future[i] - my);
    sx += (past[i] - mx) ** 2;
    sy += (future[i] - my) ** 2;
  }
  const denom = Math.sqrt(sx * sy);
  if (!(denom > 0)) throw new Error("a volatility series with zero variance cannot be correlated");
  return { correlation: cov / denom, pairs: past.length };
}

/**
 * Calendar days between two ISO dates (`YYYY-MM-DD`). UTC-anchored, so a DST boundary can't make
 * a 30-day gap read 29.
 *
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
export function daysBetween(from, to) {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`unparseable date pair: ${from} → ${to}`);
  return Math.round(ms / 86_400_000);
}

/**
 * The print cadence a playbook has to trade around: the gap between consecutive prints, the median
 * gap, and the next print projected from the last one.
 *
 * Projection, not a calendar lookup — deliberately. A projected window is honest about being an
 * estimate and is never confused for a confirmed date; a confirmed date belongs in
 * `src/domain/earnings-calendar.ts`, which this instrument does not write.
 *
 * A projection that lands in the PAST is rolled forward a cadence at a time until it does not,
 * and says so (`overdue`). Returning a stale date would be worse than useless here: every
 * downstream print guard filters for dates ahead of today, so a past projection silently empties
 * the guard and marks every expiry print-clean — which is how a leg gets written across a real,
 * imminent print, the one trade #4460 EARS 4 forbids outright. A late filer must fail toward
 * MORE caution, not less.
 *
 * @param {string[]} printDates ISO dates, ascending
 * @param {string} [today] ISO — the anchor the projection must stay ahead of
 * @returns {{gaps: number[], medianGap: number, last: string, projectedNext: string, overdue: boolean}}
 */
export function printCadence(printDates, today = new Date().toISOString().slice(0, 10)) {
  if (printDates.length < 2)
    throw new Error(`need ≥2 prints to read a cadence, got ${printDates.length}`);
  const gaps = [];
  for (let i = 1; i < printDates.length; i++)
    gaps.push(daysBetween(printDates[i - 1], printDates[i]));
  const medianGap = Math.round(quantile(gaps, 0.5));
  if (medianGap < 1) throw new Error(`a cadence of ${medianGap} days cannot be projected forward`);
  const last = printDates[printDates.length - 1];
  let projectedNext = last;
  let rolls = 0;
  do {
    projectedNext = new Date(Date.parse(`${projectedNext}T00:00:00Z`) + medianGap * 86_400_000)
      .toISOString()
      .slice(0, 10);
    rolls++;
  } while (projectedNext <= today);
  return { gaps, medianGap, last, projectedNext, overdue: rolls > 1 };
}

/**
 * What each print actually did to the tape — BOTH candidate reaction sessions, never one.
 *
 * EDGAR gives a filing DATE and no time of day, so an 8-K filed after the close reacts on the
 * NEXT session while one filed before the open reacts on the filing date itself. Picking a single
 * session mislabels roughly half of them, and in the direction that flatters a premium seller: on
 * CRWV, scoring the filing session alone reports a worst print of +6.6%, while the session after
 * the 2025-08-12 filing was −20.8%. Under-reporting the event tail by 14 points is the exact
 * shape of wrong a wheel cannot survive, so both are returned and `worst` takes the larger
 * absolute of the two.
 *
 * A print whose filing session is the last bar is scored on that session alone; one with no bar
 * at or after it is skipped rather than guessed at.
 *
 * @param {{date: string, close: number}[]} bars ascending
 * @param {string[]} printDates
 * @returns {{print: string, session: string, move: number, nextSession: string|null, nextMove: number|null, worst: number}[]}
 */
export function printMoves(bars, printDates) {
  const out = [];
  for (const print of printDates) {
    const at = bars.findIndex((b) => b.date >= print);
    if (at < 1) continue;
    const move = bars[at].close / bars[at - 1].close - 1;
    const after = bars[at + 1];
    const nextMove = after ? after.close / bars[at].close - 1 : null;
    out.push({
      print,
      session: bars[at].date,
      move,
      nextSession: after?.date ?? null,
      nextMove,
      worst: nextMove != null && Math.abs(nextMove) > Math.abs(move) ? nextMove : move,
    });
  }
  return out;
}

/**
 * Does an expiry straddle a print? A wheel leg sold across a print is the one trade the honesty
 * rules forbid outright (#4460 EARS 4), so this answers it as a boolean the caller can gate on.
 *
 * `projectedNext` counts: an unconfirmed print is still a print, and treating an estimate as "no
 * print" is exactly the failure that rule exists to prevent.
 *
 * @param {string} today ISO
 * @param {string} expiry ISO
 * @param {string[]} printDates ISO, any order — only the ones in (today, expiry] matter
 * @returns {boolean}
 */
export const straddlesPrint = (today, expiry, printDates) =>
  printDates.some((p) => p > today && p <= expiry);
