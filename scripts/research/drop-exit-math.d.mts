export interface Bar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ExitRule {
  tp: number | null;
  stop: number | null;
  hold: number;
}

export interface Trade {
  exit: "tp" | "stop" | "time";
  ret: number;
  at: number;
}

export interface Summary {
  n: number;
  hit: number;
  median: number;
  p10: number;
  mean: number;
  tp: number;
  stop: number;
  time: number;
}

export const EPISODE_GAP: number;
export const TAKE_PROFITS: (number | null)[];
export const STOPS: (number | null)[];
export const HOLDS: number[];

export function exitGrid(): ExitRule[];
export function ruleLabel(rule: ExitRule): string;
export function dropDays(bars: Bar[], threshold: number): number[];
export function episodes(idxs: number[], gap?: number): { first: number; members: number[] }[];
export function exitTrade(bars: Bar[], t: number, rule: ExitRule): Trade | null;
export function summarize(trades: { exit: string; ret: number }[]): Summary;
export function matchedDownDays(bars: Bar[], t: number, dropSet: Set<number>): number[];
export function isPrintReaction(
  bars: Bar[],
  t: number,
  printDates: string[] | Set<string>,
): boolean;
export function independentWindows(entries: number[], hold: number): number;
export function sd(values: number[]): number;
