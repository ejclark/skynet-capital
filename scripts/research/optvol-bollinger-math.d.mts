import type { BacktestVerdict, Power } from "./backtest-verdict-math.mjs";

export type Side = "upper" | "lower";

export interface CandidateEvent {
  date: string;
  side: Side;
  kind: "signal" | "control";
  forwardPct: number;
}

export interface Cell {
  side: Side;
  direction: "continuation" | "reversal";
  sign: 1 | -1;
}

export interface CellCluster {
  date: string;
  value: number;
  signal: number;
  control: number;
}

export interface CellVerdict extends BacktestVerdict {
  observedSd: number;
  sdPct: number;
  recentDates: number;
}

export const HORIZON: number;
export const SIGNAL_RATIO: number;
export const CONTROL_RATIO: number;
export const LOOKBACK: number;
export const POWER: Power;
export const CELLS: readonly Cell[];

export function nearReport(
  dates: readonly string[],
  i: number,
  reportDates: readonly string[],
  horizon?: number,
): boolean;
export function surgeSeries(totals: readonly (number | undefined)[]): (number | undefined)[];
export function candidateEvents(
  series: readonly { date: string; close: number }[],
  benchmark: readonly { date: string; close: number }[],
  totals: readonly (number | undefined)[],
  reportDates: readonly string[],
): CandidateEvent[];
export function cellClusters(events: readonly CandidateEvent[], cell: Cell): CellCluster[];
export function sampleSd(values: readonly number[]): number;
export function yearBefore(date: string): string;
export function everyNth<T>(clusters: readonly T[], n: number, from?: number): T[];
export function judgeCell(
  clusters: readonly { date: string; value: number }[],
  power: Power,
): CellVerdict;
export function decide(judged: readonly { cell: Cell; verdict: BacktestVerdict }[]): {
  outcome: "pass" | "kill" | "underpowered";
  clusters: number;
  needed: number;
  cell?: Cell;
};
