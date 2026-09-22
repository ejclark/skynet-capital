import { marketDayKey } from "../domain/market-day.js";

/**
 * EXPECTANCY WITH A CONFIDENCE INTERVAL — measure #5 (#2287 PR 7c): "we print expectancy as a bare
 * point estimate with no error bar. The technique is the *response* to small n." A block bootstrap
 * over whole CLOSE DAYS (never individual trades) resamples the unit that's actually
 * quasi-independent here — trades on the same day share the day's regime, so treating each trade as
 * its own independent draw would understate the true uncertainty.
 *
 * **R-multiple normalized, not raw dollars.** Pooling trades of wildly different position sizes by
 * raw realized dollars lets one large trade dominate the whole estimate; `returnPct` (percent of
 * cost basis) is used as the R-multiple proxy here — this app has no formal per-trade stop distance
 * to compute a textbook R from, so this is an honest substitute, not the textbook definition, and
 * is documented as such rather than silently presented as one.
 *
 * **The CI is expected to straddle zero at this app's volume — publishing that IS the finding**
 * (the plan's own words). This module never hides that: `ci` is a real interval, including one that
 * spans zero, and callers must render it as such rather than rounding it away.
 */

export interface ExpectancySample {
  /** ISO-8601 close time — the block key (market day) is derived from this. */
  readonly closedAt: string;
  /** Percent of cost basis, e.g. `RetrospectiveRecord.returnPct`/`RoundTrip.returnPct` — the
   *  R-multiple proxy this module bootstraps over. */
  readonly returnPct: number;
}

export interface ExpectancyCI {
  /** Mean R-multiple (returnPct) across every sample — the bare point estimate. Null with none. */
  readonly pointEstimate: number | null;
  /** The bootstrap interval, in the same R-multiple units as `pointEstimate`. Null when there
   *  aren't enough distinct trading days to estimate variance at all (never a false-precision
   *  interval from a single block). */
  readonly ci: { readonly low: number; readonly high: number } | null;
  /** e.g. 0.95 for a 95% interval — always the value passed in, so a caller never has to guess
   *  what `ci` means. */
  readonly confidence: number;
  readonly sampleCount: number;
  /** Distinct trading days resampled — the block bootstrap's actual unit of "n". */
  readonly dayCount: number;
}

const DEFAULT_ITERATIONS = 2000;
const DEFAULT_CONFIDENCE = 0.95;
/** Below this many distinct days, a bootstrap interval is false precision, not a real one — the
 *  variance of a single resampled block tells you nothing about the population. */
const MIN_DAYS_FOR_CI = 5;

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Block-bootstraps the mean R-multiple over whole trading days.
 *
 * `rng` defaults to `Math.random` and must return a value in `[0, 1)` — tests inject a seeded
 * generator for deterministic assertions on the resulting interval.
 */
export function expectancyBootstrapCI(
  samples: readonly ExpectancySample[],
  opts: {
    readonly confidence?: number;
    readonly iterations?: number;
    readonly rng?: () => number;
  } = {},
): ExpectancyCI {
  const confidence = opts.confidence ?? DEFAULT_CONFIDENCE;
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const rng = opts.rng ?? Math.random;

  if (samples.length === 0) {
    return { pointEstimate: null, ci: null, confidence, sampleCount: 0, dayCount: 0 };
  }

  const byDay = new Map<string, number[]>();
  for (const sample of samples) {
    const key = marketDayKey(sample.closedAt);
    const block = byDay.get(key);
    if (block) block.push(sample.returnPct);
    else byDay.set(key, [sample.returnPct]);
  }
  const blocks = [...byDay.values()];
  const pointEstimate = mean(samples.map((s) => s.returnPct));

  if (blocks.length < MIN_DAYS_FOR_CI) {
    return {
      pointEstimate,
      ci: null,
      confidence,
      sampleCount: samples.length,
      dayCount: blocks.length,
    };
  }

  const bootstrapMeans: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const resampled: number[] = [];
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[Math.floor(rng() * blocks.length)] as number[];
      resampled.push(...block);
    }
    bootstrapMeans.push(mean(resampled));
  }
  bootstrapMeans.sort((a, b) => a - b);

  const tail = (1 - confidence) / 2;
  const lowIndex = Math.floor(tail * bootstrapMeans.length);
  const highIndex = Math.min(
    bootstrapMeans.length - 1,
    Math.ceil((1 - tail) * bootstrapMeans.length) - 1,
  );

  return {
    pointEstimate,
    ci: { low: bootstrapMeans[lowIndex] as number, high: bootstrapMeans[highIndex] as number },
    confidence,
    sampleCount: samples.length,
    dayCount: blocks.length,
  };
}
