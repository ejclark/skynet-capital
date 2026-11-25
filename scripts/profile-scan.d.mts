// Type surface for profile-scan.mjs (scripts/ is plain ESM with `allowJs` off).

export interface Hypothesis {
  file: string;
  id: string | null;
  written: string | null;
  checkBy: string | null;
  falsifier: boolean;
  text: string;
}

export interface LedgerRow {
  date: string;
  ask: string;
  predicted: string;
  given: string;
  askId: string;
  cite: string;
  score: "match" | "miss" | null;
  raw: string;
  skip: boolean;
}

export interface Verdict {
  status: "pass" | "fail";
  detail: string;
}

export const FILES: { ledger: string; profile: string[]; members: string };
export const GRACE_DAYS: number;
export const AUDIT_DATE: string;
export const MATCH_BAR: number;
export const MISSES_MARKER: string;

export function parseHypotheses(md: string, file?: string): Hypothesis[];
export function invalidHypotheses(hyps: Hypothesis[], home?: string): Hypothesis[];
export function dueHypotheses(hyps: Hypothesis[], today: string): Hypothesis[];
export function memberHypotheses(dir?: string): Hypothesis[];
export function askIdOf(ask: string): string;
export function ledgerRows(ledgerMd: string): LedgerRow[];
export function missRows(rows: LedgerRow[]): LedgerRow[];
export function cites(text: string, cite: string): boolean;
export function uncitedMisses(
  rows: LedgerRow[],
  profileTexts: string[],
  today: string,
): (LedgerRow & { age: number })[];
export function matchShare(
  rows: LedgerRow[],
  since?: string,
): { match: number; scored: number; share: number | null };
export function judge(opts: {
  ledgerMd: string;
  profileTexts: string[];
  today: string;
  graceDays?: number;
}): Verdict;
export function missesIssue(misses: (LedgerRow & { age: number })[]): {
  title: string;
  labels: string[];
  body: string;
};
