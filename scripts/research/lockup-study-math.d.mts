export interface Bar {
  readonly date: string;
  readonly close: number;
  readonly volume?: number;
}
export function sectorEtf(sic: string | number): string;
export function sharesOutstandingAfter(text: string): number | undefined;
export function unlockMultiple(
  sharesOut: number | undefined,
  sharesOffered: number | undefined,
): number | undefined;
export function dayZero(bars: readonly Bar[], lockupDate: string): number;
export function benchReturns(bars: readonly Bar[], bench: readonly Bar[]): (number | undefined)[];
export function car(
  bars: readonly Bar[],
  benchRet: readonly (number | undefined)[],
  z: number,
  a: number,
  b: number,
): number | undefined;
export function rawReturn(
  bars: readonly Bar[],
  z: number,
  a: number,
  b: number,
): number | undefined;
export function realizedVol(
  bars: readonly Bar[],
  z: number,
  a: number,
  b: number,
): number | undefined;
export function volumeRatio(
  bars: readonly Bar[],
  z: number,
  on: readonly [number, number],
  base: readonly [number, number],
): number | undefined;
export function bsPut(S: number, K: number, sigma: number, years: number): number;
export function putSpreadReturn(input: {
  entry: number;
  exit: number;
  sigma: number;
  width?: number;
  sessions?: number;
}): number | undefined;
export function summarize(xs: readonly (number | undefined)[]): {
  n: number;
  mean?: number;
  median?: number;
  t?: number;
  negShare?: number;
};
export function terciles(xs: readonly (number | undefined)[]): [number, number];
