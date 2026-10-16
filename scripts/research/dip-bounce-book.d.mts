import type { Entry, FlatBar, Walk } from "./dip-bounce-sim.mjs";

export interface BookName {
  sym: string;
  flat: FlatBar[];
  entries: Entry[];
  ruled: Walk[];
  open: Walk[];
}

export interface BookOptions {
  rule?: "full" | "signal" | "off";
  slots?: number;
  tranche?: number;
  costBps?: number;
  signalDay?: number;
  signalShare?: number;
  gateShare?: number;
  weeklyStop?: number;
}

export interface BookResult {
  trades: number;
  targets: number;
  realizedTargets: number;
  handedOff: number;
  handoffPl: number;
  stillOpen: number;
  totalPl: number;
  totalPct: number;
  handoffAfterPl: number;
  accountPct: number;
  meanTied: number;
  maxTied: number;
  daysOver30: number;
  daysOver50: number;
  sessions: number;
  trips: { date: string; weekPl: number }[];
  refused: Record<string, number>;
}

export function runBook(names: readonly BookName[], options?: BookOptions): BookResult;
