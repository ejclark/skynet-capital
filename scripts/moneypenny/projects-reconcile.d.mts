// Type surface for scripts/moneypenny/projects-reconcile.mjs — the hourly board sweep (#4393 slice
// 1), driven by a spec through injected IO. The scripts/ tree is plain ESM with `allowJs` off.
import type { BoardItem, DialReading } from "./projects.d.mts";
import type { CardFieldWrite } from "./projects-fields.d.mts";
import type { PriorityPlan } from "./projects-priority.d.mts";
import type { SeatRegistry } from "./projects-role.d.mts";
import type { BoardContext, ColumnContext } from "./projects-sync.d.mts";

export interface ReconcileItem extends BoardItem {
  status?: string | null;
}

/** A merged drift entry: Status drift (`have`/`want`), priority drift (`priority`), or both. */
export interface MergedDrift {
  number: number;
  have?: string | null;
  want?: string;
  priority?: PriorityPlan;
  /** Kind / "Waiting on" writes the card is due (#6871 slice 3). */
  fields?: CardFieldWrite[];
}

export function mergeDrift(
  statusDrift?: Drift[],
  priorityDrift?: { number: number; plan: PriorityPlan }[],
  fieldDrift?: { number: number; writes: CardFieldWrite[] }[],
): MergedDrift[];

export interface RestIssue {
  number: number;
  state?: string;
  body?: string | null;
  user?: { login?: string };
  labels?: ({ name?: string } | string)[];
  pull_request?: unknown;
  sub_issues_summary?: { total?: number; completed?: number };
  issue_dependencies_summary?: { blocking?: number; blocked_by?: number } | null;
  parent_issue_url?: string | null;
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

export function wantedStatusOf(
  issue: RestIssue,
  columns?: readonly string[],
  context?: ColumnContext,
): string | null;

/** The sweep's shared reads, once: sub-issues grouped by parent, and the open PRs (#6871 slice 2). */
export function sweepContext(
  openIssues?: RestIssue[],
  deps?: {
    readAll?: (path: string) => unknown[];
    readPulls?: () => unknown[];
    log?: (line: string) => void;
  },
): ColumnContext;

/** One log line: open cards per column, from the same rule. */
export function columnCounts(input: {
  items?: ReconcileItem[];
  openIssues?: RestIssue[];
  columns?: readonly string[];
  context?: ColumnContext;
}): string;

export interface StatusFieldOption {
  id?: string;
  name: string;
  color?: string;
  description?: string;
}

export function ensureStatusColumns(deps: {
  board: BoardContext;
  mode?: DialReading | null;
  write?: (fieldId: string, options: StatusFieldOption[]) => unknown;
  dryRun?: boolean;
  log?: (line: string) => void;
}): string[];

/** A live single-select field as the board context reads it. */
export interface LiveSelectField {
  id: string;
  name: string;
  options?: { id: string; name: string; color?: string; description?: string }[];
}

/** Make the Role field, or keep its options equal to the seat registry's (#6886 slice 1b). */
export function ensureRoleField(deps: {
  board: BoardContext;
  seats?: SeatRegistry;
  write?: (fieldId: string, options: StatusFieldOption[]) => unknown;
  create?: (input: {
    projectId: string;
    name: string;
    options: { name: string; color: string; description: string }[];
  }) => unknown;
  dryRun?: boolean;
  log?: (line: string) => void;
}): LiveSelectField | undefined;

export function planReconcile(input?: {
  items?: ReconcileItem[];
  openIssues?: RestIssue[];
  statusOf?: (item: ReconcileItem) => string | null | undefined;
  repo?: string;
  columns?: readonly string[];
  context?: ColumnContext;
}): Drift[];

export function reconcileBoard(deps?: {
  board?: BoardContext;
  readOpenIssues?: () => RestIssue[];
  rateLimit?: () => { remaining?: number; reset?: number };
  sync?: (
    number: number,
    opts: { board: BoardContext; context: ColumnContext },
  ) => {
    skipped?: boolean;
    reason?: string;
    status?: string;
    priority?: PriorityPlan | { action: "skipped"; reason: string };
  };
  ensureColumns?: (deps: {
    board: BoardContext;
    mode?: DialReading | null;
    dryRun: boolean;
    log: (line: string) => void;
  }) => readonly string[];
  ensureRole?: (deps: {
    board: BoardContext;
    dryRun: boolean;
    log: (line: string) => void;
  }) => LiveSelectField | undefined;
  readMode?: () => DialReading & { warning?: string };
  buildContext?: (openIssues: RestIssue[]) => ColumnContext;
  statusOf?: (item: ReconcileItem) => string | null | undefined;
  horizons?: Record<string, string>;
  dryRun?: boolean;
  log?: (line: string) => void;
}): {
  started: boolean;
  reason?: string;
  drift: MergedDrift[];
  fixed: (MergedDrift & { now?: string })[];
  failed: { number: number; message?: string }[];
  aborted?: boolean;
};
