// Type surface for scripts/moneypenny/projects-reconcile.mjs — the hourly board sweep (#4393 slice
// 1), driven by a spec through injected IO. The scripts/ tree is plain ESM with `allowJs` off.
import type { BoardItem } from "./projects.d.mts";
import type { BoardContext } from "./projects-sync.d.mts";

export interface ReconcileItem extends BoardItem {
  status?: string | null;
}

export interface RestIssue {
  number: number;
  state?: string;
  body?: string | null;
  user?: { login?: string };
  labels?: ({ name?: string } | string)[];
  pull_request?: unknown;
  sub_issues_summary?: { total?: number; completed?: number };
}

export interface Drift {
  number: number;
  have: string | null;
  want: string;
}

export function readOpenIssuesWithRetry(deps?: {
  read?: (path: string) => RestIssue[];
  sleep?: (ms: number) => void;
}): RestIssue[];

export function boardItemsOrThrow(board: {
  items(opts?: { refresh?: boolean }): { items?: ReconcileItem[]; totalCount?: number };
}): ReconcileItem[];

export function boardIssueNumber(item: ReconcileItem | undefined, repo?: string): number | null;

export function wantedStatusOf(issue: RestIssue, columns?: readonly string[]): string | null;

export interface StatusFieldOption {
  id?: string;
  name: string;
  color?: string;
  description?: string;
}

export function ensureStatusColumns(deps: {
  board: BoardContext;
  write?: (fieldId: string, options: StatusFieldOption[]) => unknown;
  dryRun?: boolean;
  log?: (line: string) => void;
}): string[];

export function planReconcile(input?: {
  items?: ReconcileItem[];
  openIssues?: RestIssue[];
  statusOf?: (item: ReconcileItem) => string | null | undefined;
  repo?: string;
  columns?: readonly string[];
}): Drift[];

export function reconcileBoard(deps?: {
  board?: BoardContext;
  readOpenIssues?: () => RestIssue[];
  rateLimit?: () => { remaining?: number; reset?: number };
  sync?: (
    number: number,
    opts: { board: BoardContext },
  ) => { skipped?: boolean; reason?: string; status?: string };
  ensureColumns?: (deps: {
    board: BoardContext;
    dryRun: boolean;
    log: (line: string) => void;
  }) => readonly string[];
  statusOf?: (item: ReconcileItem) => string | null | undefined;
  dryRun?: boolean;
  log?: (line: string) => void;
}): {
  started: boolean;
  reason?: string;
  drift: Drift[];
  fixed: (Drift & { now?: string })[];
  failed: { number: number; message?: string }[];
  aborted?: boolean;
};
