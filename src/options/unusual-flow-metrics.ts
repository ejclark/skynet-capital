import type { UnusualFlowFlag, UnusualFlowScan } from "./unusual-flow.js";

/**
 * Derived flow state — the pure reducer over the scan ledger, matching the shape
 * `observatory/history-metrics.ts` uses over the equity ledger. Total functions over recorded
 * scans: no I/O, no clock, no store.
 *
 * The reducer exists because a single scan is the least interesting thing this instrument
 * produces. What a desk wants is the SERIES: which contracts keep flagging, how long a name has
 * been quiet, and — the honesty metric — how much of the tape the scan could actually judge.
 *
 * Coverage is first-class here on purpose. A screen that silently drops every contract whose open
 * interest the feed withheld looks clean and is lying; `flowCoverage` puts the withheld count in
 * front of whoever reads the flags, and returns an ABSENT share (not 0, not 1) when nothing was
 * scanned at all.
 */

/** Scans oldest-first. ISO timestamps compare lexicographically, so a string sort is the real one. */
export function orderedScans(scans: readonly UnusualFlowScan[]): UnusualFlowScan[] {
  return [...scans].sort((a, b) => a.at.localeCompare(b.at));
}

/** The most recent scan, optionally for one underlying. Undefined when there is no history. */
export function latestFlowScan(
  scans: readonly UnusualFlowScan[],
  underlying?: string,
): UnusualFlowScan | undefined {
  const pool = underlying === undefined ? scans : scans.filter((s) => s.underlying === underlying);
  const sorted = orderedScans(pool);
  return sorted[sorted.length - 1];
}

export interface FlowCoverage {
  readonly scans: number;
  readonly contractsScanned: number;
  readonly contractsJudged: number;
  readonly indeterminate: number;
  /**
   * Judged ÷ scanned, 0–1. ABSENT when nothing was scanned — a share of nothing is not 100%
   * coverage, and rendering it as one would be the exact false-clean this metric exists to stop.
   */
  readonly judgedShare?: number;
}

/** How much of the tape the scans could actually judge — the screen's own honesty read-out. */
export function flowCoverage(scans: readonly UnusualFlowScan[]): FlowCoverage {
  let contractsScanned = 0;
  let contractsJudged = 0;
  let indeterminate = 0;
  for (const scan of scans) {
    contractsScanned += scan.contractsScanned;
    contractsJudged += scan.contractsJudged;
    indeterminate += scan.indeterminate;
  }
  return {
    scans: scans.length,
    contractsScanned,
    contractsJudged,
    indeterminate,
    ...(contractsScanned === 0 ? {} : { judgedShare: contractsJudged / contractsScanned }),
  };
}

/** A contract that flagged in more than one scan — the series signal, not the snapshot one. */
export interface RepeatFlag {
  readonly occSymbol: string;
  readonly underlying: string;
  /** How many distinct scans flagged it. */
  readonly scans: number;
  /** ISO time of the most recent scan that flagged it. */
  readonly lastFlagged: string;
  readonly peakVolume: number;
  /** The highest ratio seen. ABSENT when every flag was a `no-open-interest` one. */
  readonly peakRatio?: number;
}

const accumulate = (
  into: Map<string, RepeatFlag>,
  scan: UnusualFlowScan,
  flag: UnusualFlowFlag,
) => {
  const prior = into.get(flag.occSymbol);
  const peakRatio =
    flag.ratio === undefined
      ? prior?.peakRatio
      : Math.max(flag.ratio, prior?.peakRatio ?? flag.ratio);
  into.set(flag.occSymbol, {
    occSymbol: flag.occSymbol,
    underlying: scan.underlying,
    scans: (prior?.scans ?? 0) + 1,
    lastFlagged: scan.at,
    peakVolume: Math.max(flag.volume, prior?.peakVolume ?? 0),
    ...(peakRatio === undefined ? {} : { peakRatio }),
  });
};

/**
 * Contracts flagged in at least `minScans` recorded scans, most-flagged first. The default of 2
 * is the point of the whole ledger: one loud session is noise, the same strike three sessions
 * running is somebody building a position.
 */
export function repeatFlags(scans: readonly UnusualFlowScan[], minScans = 2): RepeatFlag[] {
  const tally = new Map<string, RepeatFlag>();
  for (const scan of orderedScans(scans)) {
    for (const flag of scan.flags) accumulate(tally, scan, flag);
  }
  return [...tally.values()]
    .filter((r) => r.scans >= minScans)
    .sort((a, b) => b.scans - a.scans || b.peakVolume - a.peakVolume);
}

/**
 * Consecutive most-recent scans of one underlying that flagged nothing — the explicit read of "we
 * looked and there was nothing there". 0 means the last scan DID flag something; undefined means
 * the underlying has never been scanned, which is a different and louder fact.
 */
export function quietStreak(
  scans: readonly UnusualFlowScan[],
  underlying: string,
): number | undefined {
  const mine = orderedScans(scans.filter((s) => s.underlying === underlying));
  if (mine.length === 0) return undefined;
  let streak = 0;
  for (let i = mine.length - 1; i >= 0; i--) {
    const scan = mine[i];
    if (scan === undefined || scan.flags.length > 0) break;
    streak += 1;
  }
  return streak;
}
