/**
 * BETA FROM REAL CLOSES (#4327, #3407 slice 3) — how much a stock has moved per 1% move in the
 * benchmark, measured, never assumed.
 *
 * WHY THIS EXISTS. Book greeks are only additive across names once each delta is re-expressed
 * against one benchmark (`greeks-aggregator.ts` → `betaWeightDelta`), and that needs a beta per
 * underlying. No feed we hold serves one, but the daily bars we already read do: beta is the
 * ordinary-least-squares slope of the stock's daily returns on the benchmark's, over the same
 * days — the textbook definition (cov / var), the one brokers print.
 *
 * PURE. The caller fetches the bars (split- and dividend-adjusted, so a split is not read as a
 * −90% day) and the clock never enters: the as-of is the last day both series closed.
 *
 * HONESTY: too few overlapping days, or a benchmark that did not move, answers `undefined` — the
 * caller then shows that name's greeks un-weighted and says so. A beta is never invented.
 */

export interface DailyClose {
  /** ISO timestamp or date; only the first 10 characters (the day) are read. */
  readonly t: string;
  readonly c: number;
}

export interface MeasuredBeta {
  readonly beta: number;
  /** Paired daily returns the slope was fitted on. */
  readonly observations: number;
  /** The last trading day both series closed (YYYY-MM-DD) — the beta's as-of. */
  readonly asOf: string;
}

/** Below ~3 months of paired returns a slope is too noisy to present as a stock's beta. */
export const MIN_BETA_OBSERVATIONS = 60;

/** The lookback the route asks for: a year of calendar days, ~250 trading days. */
export const BETA_LOOKBACK_DAYS = 365;

const day = (t: string): string => t.slice(0, 10);

/** Close-to-close simple returns keyed by the later day, over days present in `keep`. */
function returnsByDay(bars: readonly DailyClose[], keep: ReadonlySet<string>) {
  const out = new Map<string, number>();
  let prev: DailyClose | undefined;
  for (const bar of bars) {
    if (!keep.has(day(bar.t))) continue;
    if (prev && prev.c > 0 && Number.isFinite(bar.c)) out.set(day(bar.t), bar.c / prev.c - 1);
    prev = bar;
  }
  return out;
}

/**
 * Beta of `stock` against `benchmark` from daily closes (oldest first), or `undefined` when the
 * two series overlap on fewer than `MIN_BETA_OBSERVATIONS` returns or the benchmark was flat.
 */
export function betaFromCloses(
  stock: readonly DailyClose[],
  benchmark: readonly DailyClose[],
): MeasuredBeta | undefined {
  // Pair on days BOTH closed, so a halted day in one series never pairs two different spans.
  const benchDays = new Set(benchmark.map((b) => day(b.t)));
  const shared = new Set(stock.map((b) => day(b.t)).filter((d) => benchDays.has(d)));
  const rs = returnsByDay(stock, shared);
  const rb = returnsByDay(benchmark, shared);
  const pairs: [number, number][] = [];
  for (const [d, x] of rb) {
    const y = rs.get(d);
    if (y !== undefined && Number.isFinite(x) && Number.isFinite(y)) pairs.push([x, y]);
  }
  if (pairs.length < MIN_BETA_OBSERVATIONS) return undefined;
  const n = pairs.length;
  const mx = pairs.reduce((s, [x]) => s + x, 0) / n;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let cov = 0;
  let varX = 0;
  for (const [x, y] of pairs) {
    cov += (x - mx) * (y - my);
    varX += (x - mx) ** 2;
  }
  if (!(varX > 0)) return undefined;
  const asOf = [...shared].sort().at(-1) ?? "";
  return { beta: cov / varX, observations: n, asOf };
}
