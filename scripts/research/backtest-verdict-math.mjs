/**
 * Back-test verdict math — the pure reducers behind a candidate playbook's one pre-registered run
 * (#4808 slice 3, decision 3 step 2: "a power estimate, with three outcomes: pass, kill,
 * underpowered").
 *
 * WHY THREE OUTCOMES. The 2026-10-07 sweep refuted 8 of 8 candidates, two of them because a test
 * on 10 names × 2 years has 0–6 independent events per cell: at the house bar it would have
 * "killed" an idea for being small, not for being wrong. So the number of independent clusters
 * needed is computed from the candidate's DECLARED effect and spread BEFORE any outcome is looked
 * at, and a run with fewer is `underpowered` — it goes to `next-slice` and never to the kill list.
 *
 * INDEPENDENCE IS THE DATE. Events on one day share that day's market factor (a surge-and-band-
 * touch on 40 stocks the day the index drops is one observation about the index, not forty), so
 * events are averaged within their date and the dates are the sample.
 *
 * PURE: no I/O, no clock, no network.
 */

/** Dates (clusters) needed to detect `effectPct` at the bar, given the clusters' spread. */
export function requiredClusters({ sdPct, effectPct, zBar, zPower }) {
  if (!(sdPct > 0 && effectPct > 0 && zBar > 0 && zPower >= 0))
    throw new Error("power inputs must be positive numbers");
  return Math.ceil(((zBar + zPower) * sdPct) ** 2 / effectPct ** 2);
}

/**
 * One value per date: the mean of that date's events.
 *
 * @param {{date: string, value: number}[]} events
 * @returns {{date: string, value: number, events: number}[]} ascending by date
 */
export function clusterByDate(events) {
  const byDate = new Map();
  for (const { date, value } of events) {
    const cell = byDate.get(date) ?? { sum: 0, n: 0 };
    cell.sum += value;
    cell.n += 1;
    byDate.set(date, cell);
  }
  return [...byDate]
    .map(([date, { sum, n }]) => ({ date, value: sum / n, events: n }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Mean and its t statistic (sample sd, n−1) across the clusters; t is 0 for a flat sample. */
export function meanT(values) {
  const n = values.length;
  if (n < 2) throw new Error(`need ≥2 clusters to test, got ${n}`);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  return { mean, t: sd === 0 ? 0 : mean / (sd / Math.sqrt(n)) };
}

/**
 * The pre-registered verdict. Order matters and is the point: power is judged FIRST, from the
 * cluster count alone, so a thin sample can never read as a kill.
 *
 * @param {{value: number}[]} clusters per-date mean excess over the control, in percent
 * @param {{sdPct: number, effectPct: number, zBar: number, zPower: number}} power declared up front
 * @param {boolean} latestEraSameSign the newest era's mean has the whole sample's sign (step 5)
 * @returns {{outcome: "pass"|"kill"|"underpowered", clusters: number, needed: number,
 *   meanPct?: number, t?: number}}
 */
export function backtestVerdict(clusters, power, latestEraSameSign) {
  const needed = requiredClusters(power);
  if (clusters.length < needed || clusters.length < 2)
    return { outcome: "underpowered", clusters: clusters.length, needed };
  const { mean, t } = meanT(clusters.map((c) => c.value));
  const pass = t >= power.zBar && mean > 0 && latestEraSameSign;
  return {
    outcome: pass ? "pass" : "kill",
    clusters: clusters.length,
    needed,
    meanPct: mean,
    t,
  };
}
