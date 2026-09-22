// Type surface for the part of doctrine-decide.mjs worth testing directly — same arrangement as
// event-material-decide.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this rather than a repo-wide loosening.

export interface LedgerRow {
  date: string;
  change: string;
  why: string;
  evidence: string;
  nextCheck: string | null;
}

export function cells(line: string): string[];
export function parseLedgerRows(md: string): LedgerRow[];
export function readDossier(path: string): string;
export const DEFAULT_REVIEW_DAYS: number;

export interface DoctrineDecision {
  due: boolean;
  reason: "never-scored" | "scoring-interval-elapsed" | "past-score-by-unscored" | null;
  nextDueDate: string | null;
}

export function decide(state: { today: string; rows: LedgerRow[] }): DoctrineDecision;

export function appendLedgerRow(
  md: string,
  row: { date: string; change: string; why: string; evidence: string; nextCheck?: string },
): string;
