export const TARGET_DELTA: number;
export const DELTA_MISS: number;
export const MIN_DTE: number;
export const MAX_DTE: number;
export const MIN_UNITS: number;

export function normCdf(x: number): number;
export function putValue(spot: number, strike: number, vol: number, years: number): number;
export function putAbsDelta(spot: number, strike: number, vol: number, years: number): number;
export function strikeForPutDelta(spot: number, vol: number, years: number, delta?: number): number;
export function armStrikes(p: { spot: number; vol: number; years: number; cap: number | null }): {
  playbook: number;
  capped: number | null;
  binds: boolean;
  blocked: boolean;
};
export function saleResult(p: {
  strike: number | null;
  spot: number;
  vol: number;
  years: number;
  closeAtExpiry: number;
}): { sold: boolean; premium: number; assigned: boolean; pnl: number };
export function inPrintTail(
  dates: readonly string[],
  t: number,
  prints: readonly string[],
): boolean;
export function expiryFor(
  date: string,
  nextPrint: string | null,
): { expiry: string; days: number } | null;

export interface FloorEntry {
  t: number;
  date: string;
  maturedOn: string;
  bucket: number;
  wide: boolean | null;
  vix: string | null;
  further: number;
}
export function headlineFloor(p: {
  sym: string;
  state: { bucket: number; wide: boolean | null; vix: string | null };
  names: Map<string, { sym: string; entries: FloorEntry[] }>;
  asOf: string;
}): { p25: number; p50: number; p75: number; sample: string; level: string; units: number } | null;
export function headlineSample<E extends Omit<FloorEntry, "further">>(p: {
  sym: string;
  state: { bucket: number; wide: boolean | null; vix: string | null };
  names: Map<string, { sym: string; entries: E[] }>;
  asOf: string;
  pick: (e: E) => number;
}): { values: number[]; sample: string; level: string; units: number } | null;

export function seeded(seed: number): () => number;
export function blockInterval<R>(
  rows: readonly R[],
  value: (r: R) => number,
  blockOf: (r: R) => string,
  opts?: { draws?: number; seed?: number },
): { mean: number; lo: number; hi: number; blocks: number; rows: number } | null;
export function quarterOf(iso: string): string;
