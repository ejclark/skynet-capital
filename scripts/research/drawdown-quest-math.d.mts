export const DRAWDOWN: number;
export const VIX_FLOOR: number;
export const HIGH_WINDOW: number;
export const STEP: number;
export const EPISODE_GAP: number;
export const LATEST_ERA: string;
export const POWER: { sdPct: number; effectPct: number; zBar: number; zPower: number };
export const SHARE_HOLDS: number[];
export const PUT_SESSIONS: number;
export const PUT_DELTA: number;
export const CALL_YEARS: number;
export const CALL_DELTA: number;
export const CALL_HOLD: number;
export const TAKE_PROFIT: number;
export const SLIPPAGE: number;
export const YEAR: number;

export interface Aligned {
  dates: string[];
  close: number[];
  vix: number[];
  vixAvg: (number | null)[];
}
export type State = "both" | "drawdown" | "vix" | "neither";
export interface Row {
  date: string;
  value: number;
}

export function alignSeries(
  index: readonly { date: string; close: number }[],
  vix: readonly { date: string; close: number }[],
): Aligned;
export function underHigh(close: readonly number[], t: number): number | null;
export function stateAt(series: Aligned, t: number): State | null;
export function pickEntries(series: Aligned, states: readonly State[], step?: number): number[];
export function episodesOf(entries: readonly number[], gap?: number): number[];
export function shareReturn(close: readonly number[], t: number, hold: number): number | null;
export function callValue(spot: number, strike: number, vol: number, years: number): number;
export function putValue(spot: number, strike: number, vol: number, years: number): number;
export function putCycle(args: {
  close: readonly number[];
  vol: readonly number[];
  t: number;
  sessions?: number;
  delta?: number;
}): { premium: number; assigned: boolean; pnl: number } | null;
export function callLegs(args: {
  close: readonly number[];
  volAt: (j: number) => number;
  t: number;
  years?: number;
  delta?: number;
  hold?: number;
  takeProfit?: number;
}): { sold: number; ran: number; half: number; hit: boolean; days: number | null } | null;
export function blendedVol(series: Aligned, scale?: number): (j: number) => number;
export function flatVol(series: Aligned, scale?: number): (j: number) => number;
export function summarize(
  values: readonly number[],
  episodes?: number,
): {
  n: number;
  episodes?: number;
  mean?: number;
  median?: number;
  win?: number;
  p10?: number;
};
export function gapInterval(
  rows: readonly Row[],
  base: readonly Row[],
  opts?: { draws?: number; seed?: number },
): { gap: number; lo: number; hi: number; years: number } | null;
export function moveVerdict(
  rows: readonly { date: string; value: number; episode: number }[],
  controlMean: number,
): {
  outcome: "pass" | "kill" | "underpowered";
  clusters: number;
  needed: number;
  meanPct?: number;
  t?: number;
};
