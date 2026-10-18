/**
 * Candidate 1's back-test, as pure reducers (#4808 slice 3 part 2): options volume at the Bollinger
 * edge, judged against the price-only band touch. `optvol-bollinger-backtest.mjs` feeds it data;
 * this file decides nothing about where data comes from.
 *
 * PRE-REGISTRATION — everything below was fixed BEFORE the first outcome was looked at, and it adds
 * to (never loosens) the five steps declared in `src/playbooks/candidates.ts`:
 *
 *  - SIGNAL EVENT: a close at or beyond the 20-day, 2σ band (`bollinger-touch-math.mjs`) on a
 *    session whose option volume is ≥ 3× its own mean of the 20 sessions before it.
 *  - CONTROL EVENT: the same touch on a session under 1.5× that mean. Between 1.5× and 3× is a
 *    dead zone, in neither group, so the two never blur.
 *  - OUTCOME: close-to-close over the next 5 sessions, net of QQQ over the same dates.
 *  - EARNINGS FILTER (step 4): drop an event if a report's session, or the session after it (an
 *    after-close report is priced the next day), falls within 5 sessions either side of the touch.
 *    It is applied to signal and control alike, so both sides are print-clean.
 *  - FOUR CELLS, named before any result: upper band · lower band, each read as CONTINUATION (the
 *    move keeps going) and as REVERSAL (it turns). A cell's value on a date is the mean signal
 *    outcome minus the mean control outcome on that date and side, signed so a positive number is
 *    "the signal beat its control in this cell's direction". A date needs ≥1 of each to count. Dates,
 *    not events, are the sample (forty stocks on one day are one observation).
 *  - SPREAD IS RE-JUDGED. `candidates.ts` declares the dates' spread as an assumption (4%). If the
 *    observed spread is wider, the clusters needed are recomputed at the observed one — a run whose
 *    real noise needs more dates than it has is `underpowered`, never a kill.
 *  - DECISION: any cell that passes (t ≥ the bar, positive mean, the newest 12 months the same sign)
 *    → pass. Otherwise any underpowered cell → underpowered (not a kill; it goes to `next-slice`).
 *    Only when EVERY cell was powered and none passed is the candidate killed.
 *  - KNOWN LIMIT, reported not corrected: 5-session outcome windows on adjacent dates overlap, which
 *    flatters t. A pass is therefore re-checked on non-overlapping dates (`everyNth`) before it is
 *    believed; a kill needs no such check, since overlap only ever helps the signal.
 *
 * PURE: no I/O, no clock, no network.
 */
import { backtestVerdict, requiredClusters } from "./backtest-verdict-math.mjs";
import { touchEvents } from "./bollinger-touch-math.mjs";
import { surgeRatio } from "./occ-volume-math.mjs";

export const HORIZON = 5;
export const SIGNAL_RATIO = 3;
export const CONTROL_RATIO = 1.5;
export const LOOKBACK = 20;
/**
 * `src/playbooks/candidates.ts` step 2, copied because a script cannot import TypeScript;
 * `tests/research/optvol-bollinger-math.spec.ts` holds the two equal so they cannot drift.
 */
export const POWER = { sdPct: 4, effectPct: 1.5, zBar: 3.29, zPower: 0.84 };

/**
 * Whether a report makes the event at session `i` not print-clean: the report's session or the
 * one after it falls within `horizon` sessions either side. `dates` are the stock's session dates.
 */
export function nearReport(dates, i, reportDates, horizon = HORIZON) {
  for (const report of reportDates) {
    // First session on or after the report date; a report past the last session is no hit.
    const at = dates.findIndex((d) => d >= report);
    if (at === -1) continue;
    if (at <= i + horizon && at + 1 >= i - horizon) return true;
  }
  return false;
}

/**
 * The volume surge at every session: today's total over the mean of the 20 sessions before it.
 * `undefined` where any of the 21 days is missing — a hole is a hole, never a zero.
 *
 * @param {(number|undefined)[]} totals one entry per session, aligned to the stock's bars
 */
export function surgeSeries(totals) {
  return totals.map((today, i) => {
    if (today === undefined || i < LOOKBACK) return undefined;
    const history = totals.slice(i - LOOKBACK, i);
    return history.some((v) => v === undefined)
      ? undefined
      : surgeRatio(today, /** @type {number[]} */ (history), LOOKBACK);
  });
}

/**
 * Signal and control events for one stock.
 *
 * @param {{date: string, close: number}[]} series the stock's bars, ascending
 * @param {{date: string, close: number}[]} benchmark QQQ's bars
 * @param {(number|undefined)[]} totals option volume per session, aligned to `series`
 * @param {string[]} reportDates the stock's earnings dates
 * @returns {{date: string, side: "upper"|"lower", kind: "signal"|"control", forwardPct: number}[]}
 */
export function candidateEvents(series, benchmark, totals, reportDates) {
  const dates = series.map((b) => b.date);
  const at = new Map(dates.map((d, i) => [d, i]));
  const surge = surgeSeries(totals);
  const out = [];
  for (const e of touchEvents(series, { horizon: HORIZON, benchmark })) {
    const i = at.get(e.date);
    const ratio = i === undefined ? undefined : surge[i];
    if (i === undefined || ratio === undefined || nearReport(dates, i, reportDates)) continue;
    const kind = ratio >= SIGNAL_RATIO ? "signal" : ratio < CONTROL_RATIO ? "control" : undefined;
    if (kind) out.push({ date: e.date, side: e.side, kind, forwardPct: e.forwardPct });
  }
  return out;
}

export const CELLS = [
  { side: "upper", direction: "continuation", sign: 1 },
  { side: "upper", direction: "reversal", sign: -1 },
  { side: "lower", direction: "continuation", sign: -1 },
  { side: "lower", direction: "reversal", sign: 1 },
];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * One cell's per-date values: signal mean minus control mean, signed to the cell's direction.
 * @returns {{date: string, value: number, signal: number, control: number}[]} ascending by date
 */
export function cellClusters(events, cell) {
  const byDate = new Map();
  for (const e of events) {
    if (e.side !== cell.side) continue;
    const day = byDate.get(e.date) ?? { signal: [], control: [] };
    day[e.kind].push(e.forwardPct);
    byDate.set(e.date, day);
  }
  return [...byDate]
    .filter(([, d]) => d.signal.length > 0 && d.control.length > 0)
    .map(([date, d]) => ({
      date,
      value: cell.sign * (mean(d.signal) - mean(d.control)),
      signal: d.signal.length,
      control: d.control.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Sample standard deviation (n−1); 0 for fewer than two values. */
export function sampleSd(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / (values.length - 1));
}

/** A date 12 months before `date` (both `YYYY-MM-DD`). */
export function yearBefore(date) {
  return `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;
}

/** Every `n`th cluster, offset `from`: dates far enough apart that their 5-session windows don't overlap. */
export const everyNth = (clusters, n, from = 0) => clusters.filter((_, i) => i % n === from);

/**
 * Judge one cell with the declared power, re-judged at the observed spread when that is wider.
 * @returns the verdict plus `observedSd` and the `sdPct` it was judged at.
 */
export function judgeCell(clusters, power) {
  const observedSd = sampleSd(clusters.map((c) => c.value));
  const judged = { ...power, sdPct: Math.max(power.sdPct, observedSd) };
  const last = clusters.at(-1)?.date;
  const recent = last ? clusters.filter((c) => c.date >= yearBefore(last)) : [];
  const sameSign = recent.length > 0 && mean(recent.map((c) => c.value)) > 0;
  const verdict =
    clusters.length < 2
      ? { outcome: "underpowered", clusters: clusters.length, needed: requiredClusters(judged) }
      : backtestVerdict(clusters, judged, sameSign);
  return { ...verdict, observedSd, sdPct: judged.sdPct, recentDates: recent.length };
}

/**
 * The pre-registered decision across the four cells.
 * @param {{cell: object, verdict: object}[]} judged
 * @returns {{outcome: "pass"|"kill"|"underpowered", clusters: number, needed: number, cell?: object}}
 */
export function decide(judged) {
  const passed = judged.find((j) => j.verdict.outcome === "pass");
  if (passed)
    return {
      outcome: "pass",
      clusters: passed.verdict.clusters,
      needed: passed.verdict.needed,
      cell: passed.cell,
    };
  const thin = judged.filter((j) => j.verdict.outcome === "underpowered");
  if (thin.length > 0) {
    // Report the cell closest to being powered: the thinnest gap is the one more history fixes first.
    const [best] = [...thin].sort(
      (a, b) => b.verdict.clusters / b.verdict.needed - a.verdict.clusters / a.verdict.needed,
    );
    return {
      outcome: "underpowered",
      clusters: best.verdict.clusters,
      needed: best.verdict.needed,
      cell: best.cell,
    };
  }
  const [any] = judged;
  return {
    outcome: "kill",
    clusters: any?.verdict.clusters ?? 0,
    needed: any?.verdict.needed ?? 0,
  };
}
