export const FAST: number;
export const SLOW: number;
export const TERM_CALM: number;
export const TERM_STRESS: number;
export const BREADTH_BULL: number;
export const BREADTH_BEAR: number;
export const MIN_BREADTH: number;
export const MIN_VOTES: number;
export const HORIZON: number;
export const VOTES: readonly ["trend", "drawdown", "vixLevel", "vixTerm", "breadth"];
export type Reading = "bull" | "leaning bull" | "mixed" | "leaning bear" | "bear";
export const READINGS: readonly Reading[];

export function sma(closes: readonly number[], n: number): (number | null)[];
export function trendVote(
  close: number | null | undefined,
  fast: number | null | undefined,
  slow: number | null | undefined,
): -1 | 0 | 1 | null;
export function drawdownVote(dd: number | null | undefined): -1 | 0 | 1 | null;
export function vixLevelVote(vix: number | null | undefined): -1 | 0 | 1 | null;
export function vixTermVote(
  vix: number | null | undefined,
  vix3m: number | null | undefined,
): -1 | 0 | 1 | null;
export function breadthShare(above: readonly (boolean | null | undefined)[]): {
  up: number;
  of: number;
  share: number | null;
};
export function breadthVote(share: number | null | undefined): -1 | 0 | 1 | null;
export function meanVote(votes: readonly (number | null)[]): number | null;
export function scoreOf(votes: Partial<Record<string, number | null>>): number | null;
export function readingOf(score: number | null | undefined): Reading | null;
export function indexVotes(
  closes: readonly number[],
): { trend: -1 | 0 | 1 | null; drawdown: -1 | 0 | 1 | null; dd: number | null }[];
export function forward(
  closes: readonly number[],
  t: number,
  h?: number,
): { ret: number; low: number } | null;
export function episodesByReading(
  labels: readonly (string | null)[],
  gap?: number,
): Map<string, number[][]>;
export function smoothReadings(scores: readonly (number | null)[], n?: number): (Reading | null)[];
export function runsOf(labels: readonly (string | null)[]): { reading: string | null; n: number }[];
