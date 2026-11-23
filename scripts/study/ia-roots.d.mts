// Type surface for ia-roots.mjs (`allowJs` is off).

export interface LedgerRow {
  id: string;
  root: string;
  status: string;
}
export type Root = { kind: "ledger"; id: string } | { kind: "new"; name: string };

export const ROOTS_TOP: number;
export function ledgerRows(markdown: string): LedgerRow[];
export function parseRoot(raw: unknown): Root | null;
export function rootKey(r: Root): string;
export function rootsProblems(
  roots: Record<string, string> | null | undefined,
  ctx: { rows: LedgerRow[]; ids: Set<string> },
): string[];
export function groupRoot(ids: string[], roots: Record<string, string> | undefined): Root | null;

export interface RootGroup<T> {
  key: string;
  kind: "ledger" | "new" | "unplaced";
  title: string;
  status: string | null;
  items: T[];
  reports: number;
  members: number;
}
export function groupByRoot<
  T extends {
    ids?: string[];
    finding?: { id?: string; severity?: unknown };
    severity?: unknown;
    also?: number;
    members?: number;
  },
>(
  items: T[],
  ctx: { roots: Record<string, string>; rows: LedgerRow[]; rank: (raw: unknown) => number },
): RootGroup<T>[];
export function rooterText(args: {
  rows: LedgerRow[];
  named: string[];
  findings: {
    id: string;
    what: string;
    surface?: { route?: string | null; viewport?: string | null };
  }[];
}): string;
export function readPlacings(
  answer: unknown,
  ctx: { asked: Set<string>; rows: LedgerRow[] },
): { placed: Record<string, string>; skipped: string[] };
