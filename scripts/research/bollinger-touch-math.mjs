/**
 * Bollinger-touch math — the pure reducers behind `bollinger-touch.mjs` (#4808 slice 3, candidate 1).
 *
 * Candidate 1 asks whether heavy option volume, on a day the close sits at the edge of its 20-day
 * range, predicts what the stock does next. This file is the PRICE-ONLY half and therefore the
 * candidate's CONTROL (decision 3 step 3: "does the signal add anything beyond its simpler cousin?"):
 * what a band touch alone is followed by. The volume signal has to beat this, not zero.
 *
 * `bands` is a port of `src/indicators/bollinger.ts` (a `.mjs` script cannot import the TS module),
 * population standard deviation included on purpose; `tests/research/bollinger-touch-math.spec.ts`
 * holds the two equal so they cannot drift.
 *
 * PURE: no I/O, no clock, no network.
 */

/** 20-period SMA ± 2 population standard deviations; `undefined` before the window fills. */
export function bands(closes, period = 20, multiplier = 2) {
  return closes.map((_, i) => {
    if (i < period - 1) return undefined;
    const window = closes.slice(i - period + 1, i + 1);
    const middle = window.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(window.reduce((a, v) => a + (v - middle) ** 2, 0) / period);
    return { middle, upper: middle + multiplier * sd, lower: middle - multiplier * sd };
  });
}

/**
 * Every session whose close is at or beyond a band, with the return over the next `horizon`
 * sessions. A touch within `horizon` sessions of the series' end has no outcome yet and is left out
 * rather than guessed. When `benchmark` bars are given the return is NET of the benchmark's move
 * over the same dates (step 5: the shared market factor is the confound, not the signal).
 *
 * @param {{date: string, close: number}[]} bars ascending
 * @param {{horizon: number, benchmark?: {date: string, close: number}[]}} opts
 * @returns {{date: string, side: "upper"|"lower", forwardPct: number}[]}
 */
export function touchEvents(bars, { horizon, benchmark }) {
  const closes = bars.map((b) => b.close);
  const band = bands(closes);
  const bench = benchmark ? new Map(benchmark.map((b) => [b.date, b.close])) : undefined;
  const out = [];
  for (let i = 0; i + horizon < bars.length; i++) {
    const b = band[i];
    // A flat window has zero-width bands, and any close "touches" them: no range, no edge.
    if (!b || b.upper === b.lower) continue;
    const side = closes[i] >= b.upper ? "upper" : closes[i] <= b.lower ? "lower" : undefined;
    if (!side) continue;
    let forward = closes[i + horizon] / closes[i] - 1;
    if (bench) {
      const from = bench.get(bars[i].date);
      const to = bench.get(bars[i + horizon].date);
      if (!(from > 0 && to > 0)) continue;
      forward -= to / from - 1;
    }
    out.push({ date: bars[i].date, side, forwardPct: forward * 100 });
  }
  return out;
}

/** Count and mean forward return of the events on one side (the whole set when `side` is omitted). */
export function summarize(events, side) {
  const picked = side ? events.filter((e) => e.side === side) : events;
  const n = picked.length;
  return { n, meanPct: n ? picked.reduce((a, e) => a + e.forwardPct, 0) / n : 0 };
}
