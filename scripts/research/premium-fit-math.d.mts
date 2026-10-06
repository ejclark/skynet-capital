export const TRADING_DAYS: number;

export interface Bar {
  date: string;
  close: number;
}

export function logReturns(bars: readonly Bar[]): number[];
export function annualizedVol(returns: readonly number[]): number;
export function trailingVol(returns: readonly number[], window: number): number;
export function forwardVols(returns: readonly number[], horizon: number): number[];
export function forwardReturns(bars: readonly { close: number }[], horizon: number): number[];
export function percentileRank(values: readonly number[], x: number): number;
export function shareBelow(values: readonly number[], threshold: number): number;
export function quantile(values: readonly number[], q: number): number;
export function mean(values: readonly number[]): number;
export function volPersistence(
  returns: readonly number[],
  lookback: number,
  horizon: number,
): { correlation: number; pairs: number };
export function daysBetween(from: string, to: string): number;
export function addDays(from: string, days: number): string;
export function printCadence(
  printDates: readonly string[],
  today?: string,
): {
  gaps: number[];
  medianGap: number;
  last: string;
  projectedNext: string;
  overdue: boolean;
};
export function printMoves(
  bars: readonly Bar[],
  printDates: readonly string[],
): {
  print: string;
  session: string;
  move: number;
  nextSession: string | null;
  nextMove: number | null;
  worst: number;
}[];
export function straddlesPrint(
  today: string,
  expiry: string,
  printDates: readonly string[],
): boolean;
