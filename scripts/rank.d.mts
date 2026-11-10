// Type surface for rank.mjs (scripts/ is plain ESM with `allowJs` off; see issues.d.mts).
export interface RankRow {
  number: number;
  title: string;
  cls: string;
  why: string;
  hand: boolean;
  /** The board's Kind, the order inside a lane (#6871 §4). */
  kind: string;
  ready: boolean;
  readyHours: number | null;
  splitFirst: boolean;
  remainder: boolean;
}
export const QUEUE_LABELS: string[];
/** The board's Kind options, in lane-sort order (#6871 slice 3). */
export const KINDS: string[];
export function kindOf(input: { labels?: string[]; blocks?: number[] }): string;
/** The `blocks` list of a REST issue, from `issue_dependencies_summary.blocking` (a count, not numbers). */
export function blocksOf(
  issue: { issue_dependencies_summary?: { blocking?: number } } | null | undefined,
): number[];
/** Where a Kind sits in the lane order: 0 first, -1 when unknown. */
export function kindIndex(kind: string): number;
export function classOf(input: { labels?: string[]; blocks?: number[] }): {
  cls: string;
  why: string;
  hand?: boolean;
};
export function rankRow(
  issue: {
    number: number;
    title: string;
    body?: string | null;
    labels?: (string | { name: string })[];
    sub_issues_summary?: { total: number; completed: number };
  },
  ctx: { readyAt?: number | null; blocks?: number[]; now: number },
): RankRow | null;
export function rankOrder(rows: RankRow[]): RankRow[];
export function renderRank(rows: RankRow[]): string;
export function snapshotMarker(numbers: number[]): string;
export function parseSnapshot(text: string | null | undefined): number[] | null;
export function rankDelta(
  prev: number[],
  curr: number[],
): { movedUp: number[]; retired: number[]; added: number[] };
export function digestLine(prev: number[] | null, curr: number[], since: string | null): string;
