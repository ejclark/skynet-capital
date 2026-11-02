import type { FloorEntry } from "./wheel-cap-math.mjs";

export const MIN_DTE: number;
export const MAX_DTE: number;
export const EXIT_DTE: number;
export const TAKE_PROFIT: number;
export const TARGET_DELTA: number;
export const SLIPPAGE: number;
export const QUIET_SESSIONS: number;
export const EVENT_LOOKBACK: number;
export const EVENT_MIN: number;
export const PRINT_GAP_DAYS: number;
export const NEVER: string;

export function addDays(from: string, n: number): string;
export function daysBetween(from: string, to: string): number;
export function callValue(spot: number, strike: number, vol: number, years: number): number;
export function callDelta(spot: number, strike: number, vol: number, years: number): number;
export function strikeForCallDelta(
  spot: number,
  vol: number,
  years: number,
  delta?: number,
): number;
export function thirdFriday(year: number, month: number): string;
export function entryExpiry(
  date: string,
  opts?: { scheme?: "monthly" | "quarterly"; floor?: string | null },
): { expiry: string; days: number; blocked: boolean } | null;
export function impliedVol(p: {
  baseVol: number;
  years: number;
  events: number;
  eventMove: number;
}): number;
export function eventsAhead(prints: readonly string[], date: string, expiry: string): number;
export function eventMove(
  moves: readonly { reactedOn: string; move: number }[],
  date: string,
): number | null;
export function heldBack(printAt: readonly number[], t: number, quiet: number): boolean;
export function longCallTrade(p: {
  closes: readonly number[];
  dates: readonly string[];
  t: number;
  expiry: string;
  volAt: (k: number) => number;
  delta?: number;
}): { roi: number; cause: "profit" | "time"; exitAt: number; strike: number } | null;

export interface RecoveryEntry extends Omit<FloorEntry, "further"> {
  backToEntry: number;
}
export function recoveryBand(p: {
  sym: string;
  state: { bucket: number; wide: boolean | null; vix: string | null };
  names: Map<string, { sym: string; entries: RecoveryEntry[] }>;
  asOf: string;
  q?: number;
}): { sessions: number; sample: string; level: string; units: number } | null;
export function expiryFloor(dates: readonly string[], t: number, sessions: number): string;
