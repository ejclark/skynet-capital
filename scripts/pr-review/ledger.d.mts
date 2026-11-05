// Type surface for ledger.mjs: scripts/ is plain ESM.
import type { Json, ReviewApi } from "./rest.mjs";

export type LedgerRow = { kind: string; at: string; pr: number } & Record<string, unknown>;
type Opts = { api?: ReviewApi };

export const LEDGER_BRANCH: string;
export const KINDS: string[];
export const ROW_OUTCOMES: string[];
export function ledgerPath(date: string): string;
export function receiptPath(date: string): string;
export function ledgerRow(
  kind: string,
  fields: Record<string, unknown>,
  opts?: { now?: () => Date },
): LedgerRow;
export function parseJsonl(body: string | null | undefined): Json[];
export function appendJsonl(body: string | null | undefined, rows: object[]): string;
export function reviewTokens(rows: object[]): number;
export function readLedgerFile(path: string, opts?: Opts): { body: string; sha: string } | null;
export function ensureLedgerBranch(opts?: Opts): boolean;
export function appendLedgerRows(
  path: string,
  rows: object[],
  opts?: Opts & { attempts?: number; sleep?: (ms: number) => void; message?: string },
): string;
export function readLedgerDays(
  dates: string[],
  opts?: Opts & { path?: (date: string) => string },
): Json[];
export function datesBetween(sinceMs: number, untilMs: number): string[];
