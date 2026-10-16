export const RANGE_WINDOW: number;
export const FIRST_ENTRY_MINUTE: number;
export const HANDOFF_DAY: number;

export interface Bar {
  minutes: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Session {
  date: string;
  bars: Bar[];
}

export interface FlatBar extends Bar {
  date: string;
  day: number;
  vwap: number;
  range: number | null;
}

export interface Entry {
  i: number;
  price: number;
  range: number;
}

export interface Walk {
  entryAt: number;
  exitAt: number;
  entry: number;
  exit: number;
  age: number;
  how: "target" | "handoff" | "censored";
  grossPct: number;
  worstPct: number;
  entryDate: string;
}

export function annotate(sessions: readonly Session[]): FlatBar[];
export function findEntries(
  flat: readonly FlatBar[],
  options: { k: number; exclude?: Set<string>; firstMinute?: number },
): Entry[];
export function walkTranche(
  flat: readonly FlatBar[],
  entry: Entry,
  m: number,
  horizon?: number,
): Walk;
export function recoveryBy(
  trades: readonly Walk[],
  lastDay: number,
  flat: readonly FlatBar[],
  days: readonly number[],
): { day: number; n: number; pct: number | null }[];
