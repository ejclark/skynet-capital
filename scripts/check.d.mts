// Type surface of scripts/check.mjs for tests/scripts/check.spec.ts — the house pattern for a
// dependency-free scripts/ module a spec imports.
export interface Gate {
  name: string;
  ok: boolean;
  note?: string;
  lines?: string[];
  logs?: string[];
}
export const CAP: number;
export function summaryLine(gates: Gate[]): string;
export function formatReport(gates: Gate[], opts?: { cap?: number }): string;
export function biomeErrors(text: string): string[];
export function tscErrors(text: string, prefix?: string): string[];
export function rstestFailures(
  text: string,
  prefix?: string,
): { failed: number; files: number; lines: string[] } | null;
