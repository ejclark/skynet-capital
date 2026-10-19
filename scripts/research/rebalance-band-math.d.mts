export const LOCAL_WINDOW: number;
export const NEAR: number;
export const UNDER: number;

export interface Trade {
  i: number;
  side: "buy" | "sell";
  drift: number;
  moved: number;
}

export interface TimingTally {
  judged: number;
  hits: number;
  rate: number | null;
  base: number | null;
  unjudged: number;
}

export function cashGrowth(dates: readonly string[], yields: readonly (number | null)[]): number[];
export function basketIndex(memberCloses: readonly (readonly number[])[]): number[];
export function activeShare(active: number, holding: number): number;
export function simulate(
  closes: readonly number[],
  growth: readonly number[],
  opts: { hold: number; band: number; costBps?: number },
): { equity: number[]; trades: Trade[]; maxDrift: number };
export function cagr(equity: readonly number[], dates: readonly string[]): number;
export function yearsOf(dates: readonly string[]): number;
export function drawdownProfile(
  equity: readonly number[],
  under?: number,
): { maxDd: number; timeUnder: number; longestUnder: number };
export function nearTrough(
  closes: readonly number[],
  i: number,
  w?: number,
  near?: number,
): boolean;
export function nearPeak(closes: readonly number[], i: number, w?: number, near?: number): boolean;
export function timing(
  closes: readonly number[],
  trades: readonly Trade[],
  w?: number,
  near?: number,
): { buys: TimingTally; sells: TimingTally };
export function rollingStarts(n: number, len: number, step: number): number[];
export function triggerMoves(hold: number, band: number): { fall: number; rise: number };
export function harvest(
  bandCagr: number,
  assetCagr: number,
  cashCagr: number,
  hold: number,
): number;
