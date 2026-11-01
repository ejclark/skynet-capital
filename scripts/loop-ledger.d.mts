// Type surface for loop-ledger.mjs (see scripts/moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
import type { LoopRow } from "./loop-list-decide.mjs";

export interface LedgerRow {
  date: string;
  loop: string;
  before: number;
  after: number;
  /** Only on a loop's first row: how far an iteration must move the number to be worth running. */
  worth?: number;
  /** Only on a loop's first row, when the number should climb. */
  aim?: "up";
  /** Millions of tokens, or null when unknown. */
  tokensM: number | null;
  /** Dollars, or null when unknown. */
  usd: number | null;
  changed: string;
}

export interface Verdict {
  state: "running" | "stopped" | "closed";
  why: string;
}

export interface Price {
  usdPerUnit: number | null;
  tokensMPerUnit: number | null;
  spentUsd: number;
  spentTokensM: number;
}

export interface LoopSummary {
  loop: string;
  baseline: number;
  latest: number;
  iterations: number;
  worth: number | null;
  verdict: Verdict;
  price: Price;
}

export function slugOf(loop: string): string;
export function moved(first: Partial<LedgerRow>, row: Pick<LedgerRow, "before" | "after">): number;
export function verdict(rows: Partial<LedgerRow>[]): Verdict;
export function pricePerUnit(rows: LedgerRow[]): Price;
export function parseLedger(text: string, file: string): { rows: LedgerRow[]; problems: string[] };
export function readLedger(dir?: string): { rows: LedgerRow[]; problems: string[] };
export function unrecordedChecks(args: {
  today: string;
  registry: LoopRow[];
  ledger: LedgerRow[];
}): LoopRow[];
export function summarize(rows: LedgerRow[]): LoopSummary[];
export function lineOf(summary: LoopSummary): string;
