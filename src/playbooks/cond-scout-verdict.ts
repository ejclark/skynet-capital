/**
 * COND-SCOUT's verdict per hypothesis (#3651 slice 6) — the answer to "does this bet work, or did
 * we get lucky?" Eric's brief: "We also need to normalize our results to boil out anomalous
 * events/luck." Three tools, all stated:
 *
 * 1. A CONFIDENCE BAND, not a point estimate — `expectancyBootstrapCI` (#2287 PR 7c), resampling
 *    whole trading days. Its minimums stand: under 5 distinct close days it returns no band.
 * 2. THE MARKET OVER THE SAME DAYS — mean excess over SPY, so a bet that only rode a rising tide
 *    doesn't read as skill.
 * 3. OUTLIERS NAMED, NOT DROPPED — a close more than 3.5 robust z-scores from the median (median
 *    absolute deviation, which one wild print can't inflate the way a standard deviation can) is
 *    flagged, and the verdict is re-run without them. An edge that exists only with one lucky
 *    print is reported as exactly that.
 *
 * "Unproven" is the expected answer for a long time. That is the guard against overfitting
 * working, not a failure — a small sample is never promoted into a claim.
 */
import { type ExpectancyCI, expectancyBootstrapCI } from "../trading/expectancy-ci.js";
import type { ProbeRetro } from "./cond-scout-retro.js";

/** Closes a hypothesis needs before any verdict beyond "unproven" is allowed. */
export const MIN_CLOSES_FOR_VERDICT = 10;
const OUTLIER_Z = 3.5;

export type VerdictCall = "unproven" | "edge" | "no edge shown" | "losing";

export interface HypothesisVerdict {
  readonly hypothesis: ProbeRetro["hypothesis"];
  readonly closes: number;
  readonly winRate: number;
  readonly meanRoi: number;
  readonly meanRoiPerDay: number;
  /** In percent (returnPct units, as the CI module works in). */
  readonly band: ExpectancyCI;
  /** Mean ROI − SPY ROI over the same days, across closes whose benchmark is filled. */
  readonly meanExcessVsMarket?: number;
  readonly benchmarked: number;
  readonly outliers: readonly string[];
  readonly call: VerdictCall;
  /** The call re-run without the outliers — differs only when a few prints carry the result. */
  readonly callWithoutOutliers: VerdictCall;
}

const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

function median(xs: readonly number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** Probe ids whose ROI sits more than 3.5 robust z-scores from the median. */
export function outlierIds(retros: readonly ProbeRetro[]): readonly string[] {
  if (retros.length < 4) return [];
  const rois = retros.map((r) => r.roi);
  const med = median(rois);
  const mad = median(rois.map((x) => Math.abs(x - med)));
  if (mad === 0) return [];
  return retros
    .filter((r) => Math.abs(r.roi - med) / (1.4826 * mad) > OUTLIER_Z)
    .map((r) => r.probeId);
}

function callFor(
  retros: readonly ProbeRetro[],
  rng?: () => number,
): { band: ExpectancyCI; call: VerdictCall } {
  const band = expectancyBootstrapCI(
    retros.map((r) => ({ closedAt: new Date(r.closedAt).toISOString(), returnPct: r.roi * 100 })),
    rng ? { rng } : {},
  );
  if (retros.length < MIN_CLOSES_FOR_VERDICT || !band.ci) return { band, call: "unproven" };
  if (band.ci.low > 0) return { band, call: "edge" };
  if (band.ci.high < 0) return { band, call: "losing" };
  return { band, call: "no edge shown" };
}

/** One verdict per hypothesis the retros cover, in first-seen order. */
export function hypothesisVerdicts(
  retros: readonly ProbeRetro[],
  rng?: () => number,
): readonly HypothesisVerdict[] {
  const byHypothesis = new Map<ProbeRetro["hypothesis"], ProbeRetro[]>();
  for (const r of retros)
    byHypothesis.set(r.hypothesis, [...(byHypothesis.get(r.hypothesis) ?? []), r]);
  return [...byHypothesis].map(([hypothesis, group]) => {
    const outliers = outlierIds(group);
    const { band, call } = callFor(group, rng);
    const trimmed = group.filter((r) => !outliers.includes(r.probeId));
    const benchmarked = group.flatMap((r) => (r.market ? [r.market.excess] : []));
    return {
      hypothesis,
      closes: group.length,
      winRate: group.filter((r) => r.roi > 0).length / group.length,
      meanRoi: mean(group.map((r) => r.roi)),
      meanRoiPerDay: mean(group.map((r) => r.roiPerDay)),
      band,
      ...(benchmarked.length > 0 ? { meanExcessVsMarket: mean(benchmarked) } : {}),
      benchmarked: benchmarked.length,
      outliers,
      call,
      callWithoutOutliers: outliers.length > 0 ? callFor(trimmed, rng).call : call,
    };
  });
}
