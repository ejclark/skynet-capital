// Type surface for scripts/moneypenny/projects-sync.mjs — the board context #4183 added, which a
// spec exercises directly with injected readers (no network). The scripts/ tree is plain ESM with
// `allowJs` off (see index.d.mts for the same reasoning).
import type { AdmissionIssue } from "./admission.d.mts";
import type { BoardItem, StatusColumn } from "./projects.d.mts";
import type { PriorityIssue, PriorityPlan } from "./projects-priority.d.mts";

export interface BoardItemPage {
  items?: BoardItem[];
  totalCount?: number;
}

export interface SyncIssueRef {
  number?: number | string;
  html_url?: string;
}

export interface BoardContext {
  items(opts?: { refresh?: boolean }): BoardItemPage;
  /** One issue's candidate board items, from the cached list if there is one, else asked of GitHub about that issue alone (#4439). */
  itemsFor(issue: SyncIssueRef): BoardItem[];
  /** Always the per-issue read, never a cached list — the re-check after `Content already exists` (#6775). */
  issueItems(issue: SyncIssueRef): BoardItem[];
  fields(opts?: { refresh?: boolean }): {
    id: string;
    name: string;
    options?: { id: string; name: string; color?: string; description?: string }[];
  }[];
  project(): { id: string; number: number };
  noteAdded(item?: BoardItem): void;
}

export function createBoardContext(readers?: {
  readItems?: () => BoardItemPage;
  readFields?: () => {
    id: string;
    name: string;
    options?: { id: string; name: string; color?: string; description?: string }[];
  }[];
  readProject?: () => { id: string; number: number };
  readIssueItems?: (issue: SyncIssueRef) => BoardItem[];
  log?: (line: string) => void;
}): BoardContext;

/** Write the Status field's whole option list (`statusFieldUpdate`'s output) in place. */
export function writeStatusOptions(
  fieldId: string,
  options: { id?: string; name: string; color?: string; description?: string }[],
): unknown;

export function readIssueItemsFromGh(
  issue: SyncIssueRef,
  deps?: { gh?: (argv: string[]) => string },
): BoardItem[];

/** Every card's id, url and Status in one paginated GraphQL read, ~1 point per 100 cards (#4760). */
export function readBoardItemsFromGh(deps?: {
  gh?: (argv: string[]) => string;
  log?: (line: string) => void;
  maxPages?: number;
}): Required<BoardItemPage>;

/** The project's id and fields in one GraphQL call that skips gh's owner lookup (#4933). */
export function readProjectShapeFromGh(deps?: { gh?: (argv: string[]) => string }): {
  project: { id: string; number: number };
  fields: { id: string; name: string; type?: string; options?: { id: string; name: string }[] }[];
};

/** Add one issue to the board by id — `addProjectV2ItemById`, no gh owner lookup (#5792). */
export function addIssueToBoardFromGh(
  target: { projectId: string; issue: SyncIssueRef & { node_id?: string } },
  deps?: { gh?: (argv: string[]) => string },
): BoardItem;

export function readIssue(
  issueNumber: string,
  deps?: { read?: (path: string) => unknown; sleep?: (ms: number) => void },
): {
  number?: number;
  labels?: { name: string }[];
  state?: string;
  body?: string;
  html_url?: string;
  user?: { login?: string };
};

/** The open-PR reads one column needs: issue → platter that closes it, issue → open PR naming it. */
export interface PrMaps {
  boardedOn: ReadonlyMap<number, number>;
  openPrOn: ReadonlyMap<number, number>;
}

/** An issue as a REST row: the admission shape, with GitHub's nullable body. */
export type ColumnIssue = Omit<AdmissionIssue, "body" | "issue_dependencies_summary"> & {
  body?: string | null;
  issue_dependencies_summary?: { blocked_by?: number } | null;
};

/** The reads beyond an issue's own row that `wantedColumn` takes (#6871 slice 2). */
export interface ColumnContext {
  columns?: readonly string[];
  openSubIssuesOf?: (issue: ColumnIssue) => AdmissionIssue["openSubIssues"] | undefined;
  prMaps?: () => PrMaps;
}

/** The column an issue (a REST row) belongs in, or null for a card the board never carries. */
export function wantedColumn(issue: ColumnIssue, context?: ColumnContext): StatusColumn | null;

/** One memoized, fail-open `pulls?state=open` read, as both PR maps. */
export function openPrMaps(deps?: {
  read?: () => unknown[];
  log?: (line: string) => void;
}): () => PrMaps;

/** A started plan's open sub-issues (one REST read); undefined for anything else. */
export function readOpenSubIssuesOf(
  issue: ColumnIssue,
  readAll?: (path: string) => unknown[],
): AdmissionIssue["openSubIssues"] | undefined;

/** The reads a one-issue sync makes for itself. */
export function oneIssueContext(): ColumnContext;

export function syncIssue(
  issueNumber: string,
  opts?: { horizon?: string; board?: BoardContext; context?: ColumnContext },
):
  | { skipped: true; reason: string }
  | {
      status: string;
      horizon: string | null;
      added: boolean;
      decisionCalloutMissing?: boolean;
      priority?: PriorityPlan | { action: "skipped"; reason: string };
      /** The parent issue the events lane re-syncs after this one (#6871 slice 2). */
      parent: number | null;
    };

/** The hand Horizon triage file (issue number → Now/Next/Later), read once per process. */
export function readHorizons(): Record<string, string>;

/** One open issue's Priority card brought in line, or a drag carried back to its labels (#6871). */
export function syncPriority(input: {
  issue: PriorityIssue;
  item?: BoardItem;
  fresh?: boolean;
  ready?: boolean;
  horizons?: Record<string, string>;
  io: {
    readFresh: () => BoardItem | undefined;
    setPriority: (name: string) => void;
    setRecord: (text: string) => void;
    addLabel: (name: string) => void;
    removeLabel: (name: string) => void;
  };
}): PriorityPlan | { action: "skipped"; reason: string };
