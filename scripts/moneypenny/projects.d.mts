// Type surface for scripts/moneypenny/projects.mjs — the pure vocabulary a spec exercises
// directly. The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts for the reasoning).
export const PROJECT_TITLE: string;
export const STATUS_OPTIONS: string[];
export const BUILDING: "Building now";
export const WAITING_ON_PERSON: "Waiting on a person";
export const NEXT_QUEUED: "Next part queued";
export const NEXT_NEEDS_APPROVAL: "Next part needs approval";
export const RENAMED_STATUS_OPTIONS: Record<string, string>;
export const PRIORITY_OPTIONS: string[];
/** The hidden text field recording each Priority the sync wrote (#6871). */
export const SYNCED_PRIORITY: "Synced priority";
export const HORIZON_OPTIONS: string[];
/** The Kind field's options, in lane-sort order; equal to rank.mjs's `KINDS` (#6871 slice 3). */
export const KIND_OPTIONS: string[];
export const KIND: "Kind";
export const WAITING_ON: "Waiting on";
export const IN_COLUMN_SINCE: "In this column since";

export interface StatusFieldOption {
  name: string;
  color: "GRAY" | "BLUE" | "YELLOW" | "RED" | "GREEN" | "ORANGE" | "PINK" | "PURPLE";
  /** Undefined only for a dial column with no dial reading: keep what the board shows. */
  description: string | undefined;
}

/** The dial reading the two limit columns print (`readWorkMode()`'s result, or a test's). */
export interface DialReading {
  position?: string;
  unreadable?: boolean;
  caps?: { inFlightCap?: number; startedPlanCap?: number };
}

/** Building now's and Next part queued's descriptions for a dial reading; null when unreadable. */
export function dialSentences(
  mode?: DialReading | null,
): { "Building now": string; "Next part queued": string } | null;

/** The Status options to write for one dial reading. */
export function statusFieldOptions(mode?: DialReading | null): StatusFieldOption[];

export const STATUS_FIELD_OPTIONS: StatusFieldOption[];

export function statusOptionsMatch(currentNames?: string[]): boolean;

/** The option list to write so the live field matches, ids kept for survivors — or null. */
export function statusFieldUpdate(
  current?: { id?: string; name?: string; color?: string; description?: string }[],
  opts?: { keepExtras?: boolean; mode?: DialReading | null },
): (Omit<StatusFieldOption, "description"> & { id?: string; description: string })[] | null;

export interface SubIssueCounts {
  total: number;
  completed: number;
}

export function subIssueCounts(issue?: {
  sub_issues_summary?: { total?: number; completed?: number } | null;
  subIssues?: { total?: number; completed?: number } | null;
}): SubIssueCounts;

export function isStartedPlan(issue?: {
  labels?: string[];
  subIssues?: Partial<SubIssueCounts>;
}): boolean;

export interface ProjectField {
  name: string;
  dataType: "SINGLE_SELECT" | "DATE" | "TEXT";
  options?: string[];
  /** Shown on no view this module creates (#6871's "Synced priority"). */
  hidden?: boolean;
}

export const FIELDS: ProjectField[];

type Label = string | { name?: string };

/** A started plan holds a cap seat only while a lane could pull its next work (2026-10-18). */
export function holdsCapSeat(
  plan:
    | {
        labels?: readonly Label[];
        openSubIssues?: ReadonlyArray<{ number?: number; labels?: readonly Label[] }>;
      }
    | undefined,
): boolean;

export type StatusColumn =
  | "Backlog"
  | "Ready"
  | "Building now"
  | "Waiting on a person"
  | "Next part queued"
  | "Next part needs approval"
  | "Done"
  // the pre-#6871 names a lagging board still carries (the `columns` fallback)
  | "In Progress"
  | "Waiting"
  | "Blocked";

export function statusForIssue(issue?: {
  number?: number;
  state?: string;
  labels?: string[];
  hasOpenLinkedPr?: boolean;
  decisionCalloutMissing?: boolean;
  subIssues?: Partial<SubIssueCounts>;
  openSubIssues?: ReadonlyArray<{ number?: number; labels?: readonly Label[] }>;
  blockedBy?: number;
  boardedOn?: ReadonlyMap<number, number>;
  namedByOpenPr?: boolean;
  columns?: readonly string[];
}): StatusColumn;

export function isBacklogCandidate(issue?: { labels?: string[] }): boolean;

export const MASKED_OWNER_FAILURE: RegExp;

export function isMaskedOwnerFailure(text: unknown): boolean;

export function isRetryableProjectsGhError(text: unknown): boolean;

export const CURL_SERVER_ERROR: RegExp;

export function isRetryableRestError(text: unknown): boolean;

export function explainMaskedOwnerFailure(probe?: { ok?: boolean; text?: string }): string;

export const ALREADY_ON_BOARD_FAILURE: RegExp;

export function isAlreadyOnBoardError(text: unknown): boolean;

export const RATE_LIMIT_EXHAUSTED: RegExp;

export function isRateLimitExhausted(text: unknown): boolean;

export function explainRateLimitExhausted(detail?: {
  call?: string;
  remaining?: number;
  reset?: number;
  now?: number;
}): string;

export const THROTTLE_BUDGET_FLOOR: number;
export const THROTTLE_ATTEMPTS: number;
export const THROTTLE_BASE_MS: number;

export function classifyRateLimitRefusal(budget?: {
  remaining?: number;
  floor?: number;
}): "spent" | "throttled";

export function explainThrottled(detail?: {
  call?: string;
  remaining?: number;
  attempts?: number;
  baseMs?: number;
}): string;

/** #4438/#6746: the `::warning::` line for a rate-limited or GitHub-faulted board sync, or null to re-throw. */
export function boardSyncSkip(opts?: {
  issueNumber?: number | string;
  error?: unknown;
  budget?: { reset?: number; remaining?: number };
  now?: number;
}): string | null;

export function runThroughRateLimit<T>(opts: {
  call?: string;
  run: () => T;
  firstError?: unknown;
  readBudget: () => Record<string, { limit?: number; remaining?: number; reset?: number }>;
  sleep?: (ms: number) => void;
  attempts?: number;
  baseMs?: number;
  now?: number;
}): T;

export const SWEEP_MIN_GRAPHQL_POINTS: number;

export function planBoardSweep(budget?: {
  issueCount?: number;
  remaining?: number;
  reset?: number;
  now?: number;
  minPoints?: number;
}): { ok: boolean; reason: string };

export interface BoardItem {
  id: string;
  content?: { type?: string; number?: number; url?: string };
  /** The card's Status option name, when the read carried it (#6871 slice 2). */
  status?: string | null;
  /** The card's Priority option name, when set (#6871). */
  priority?: string;
  /** The card's "Synced priority" record, when set (#6871). */
  syncedPriority?: string;
  /** The card's Kind option name, when set (#6871 slice 3). */
  kind?: string;
  /** The card's "Waiting on" text, when set (#6871 slice 3). */
  waitingOn?: string;
  /** The card's "In this column since" day (YYYY-MM-DD), when set (#6871 slice 3). */
  since?: string;
}

export function findBoardItem(items?: BoardItem[], issueUrl?: string): BoardItem | undefined;

export interface PriorityNode {
  priority?: { name?: string } | null;
  synced?: { text?: string } | null;
}

export interface CardFieldNode {
  kind?: { name?: string } | null;
  waiting?: { text?: string } | null;
  since?: { date?: string } | null;
}

/** `{kind, waitingOn, since}` from a GraphQL node's aliases — only the keys GitHub set (#6871). */
export function cardFieldValues(node?: CardFieldNode | null): {
  kind?: string;
  waitingOn?: string;
  since?: string;
};

/** `{priority, syncedPriority}` from a GraphQL node's aliases — only the keys GitHub set. */
export function priorityValues(node?: PriorityNode | null): {
  priority?: string;
  syncedPriority?: string;
};

export function boardItemsFromProjectItems(args?: {
  nodes?: (
    | ({ id?: string; project?: { number?: number } } & PriorityNode & CardFieldNode)
    | null
    | undefined
  )[];
  projectNumber?: number;
  issueUrl?: string;
}): BoardItem[];

export const BOARD_LOOKUP_ATTEMPTS: number;
export const BOARD_LOOKUP_BASE_MS: number;

export function resolveBoardItem(deps: {
  addItem: () => BoardItem;
  /** This issue's own board items (#4439's per-issue read), asked before each whole-board re-read (#6775). */
  lookupItems?: () => BoardItem[];
  listItems: () => { items?: BoardItem[]; totalCount?: number };
  issueUrl?: string;
  cachedItems?: BoardItem[];
  attempts?: number;
  baseMs?: number;
  sleep?: (ms: number) => void;
}): { item: BoardItem; added: boolean };

export interface ViewSpec {
  name: string;
  layout: "board" | "table" | "roadmap";
  filter?: string;
  columnsBy?: string;
  groupBy?: string;
  sortBy?: string;
  /** Card/column fields the view shows; a name the project lacks is skipped. */
  visibleFields?: string[];
}
export const VIEWS: ViewSpec[];
export function viewsToCreate(
  existingNames?: string[],
  fieldIds?: Record<string, number>,
): { name: string; body: Record<string, unknown> }[];
