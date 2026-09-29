// Type surface for rank.mjs (scripts/ is plain ESM with `allowJs` off; see issues.d.mts).
export interface RankRow {
  number: number;
  title: string;
  cls: string;
  why: string;
  hand: boolean;
  ready: boolean;
  readyHours: number | null;
  splitFirst: boolean;
  remainder: boolean;
}
export const QUEUE_LABELS: string[];
export function classOf(input: {
  labels?: string[];
  body?: string;
  blocks?: number[];
  horizon?: string | null;
}): { cls: string; why: string; hand?: boolean };
export function rankRow(
  issue: {
    number: number;
    title: string;
    body?: string | null;
    labels?: (string | { name: string })[];
    sub_issues_summary?: { total: number; completed: number };
  },
  ctx: { readyAt?: number | null; blocks?: number[]; horizon?: string | null; now: number },
): RankRow | null;
export function rankOrder(rows: RankRow[]): RankRow[];
export function renderRank(rows: RankRow[]): string;
