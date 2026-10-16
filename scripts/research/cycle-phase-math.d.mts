export const HIGH_WINDOW: number;
export const WARMUP: number;
export const PULLBACK: number;
export const NEAR_HIGH: number;
export const RUNUP_GAIN: number;
export const LOOKBACK: number;
export const PRINT_NEAR: number;
export const SECTOR_SHARE: number;
export const MIN_PEERS: number;
export const LOW_HORIZON: number;
export const RECOVER_HORIZON: number;
export const EPISODE_GAP: number;
export const CLUSTER_GAP_DAYS: number;
export const DD_LABELS: string[];

export function ddBucket(dd: number): number;
export function vixBucket(vix: number | null | undefined): "calm" | "elevated" | "fear" | null;
export function drawdowns(
  closes: readonly number[],
): ({ high: number; dd: number; sinceHigh: number } | null)[];
export function sectorFlag(peerDds: readonly (number | null | undefined)[]): {
  off: number;
  of: number;
  wide: boolean | null;
};
export function pricePhase(s: {
  dd: number;
  ddMinRecent: number;
  ret20: number | null;
  wide: boolean | null;
}): string;
export function printOverlay(clock: {
  toNext: number | null;
  sinceLast: number | null;
}): "pre-print" | "post-print drift" | null;

export interface Outcome {
  further: number;
  toLow: number;
  backToEntry: number;
  backToHigh: number;
  seen: number;
  at: Record<number, number>;
}
export function outcomeAt(
  closes: readonly number[],
  t: number,
  high: number,
  holds?: readonly number[],
): Outcome | null;
export function episodesOf(idx: readonly number[], gap?: number): number[][];
export function clusterCount(
  ranges: readonly { start: string; end: string }[],
  gapDays?: number,
): number;
export function rankQuantile(values: readonly number[], q: number): number;
export function band(
  values: readonly number[],
): { p10: number; p25: number; p50: number; p75: number; p90: number } | null;
export function perEpisode<T>(
  episodes: readonly (readonly T[])[],
  pick: (o: T) => number | null | undefined,
): number[];
