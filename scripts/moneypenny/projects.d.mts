// Type surface for scripts/moneypenny/projects.mjs — the pure vocabulary a spec exercises
// directly. The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts for the reasoning).
export const PROJECT_TITLE: string;
export const STATUS_OPTIONS: string[];
export const PRIORITY_OPTIONS: string[];
export const HORIZON_OPTIONS: string[];

export interface StatusFieldOption {
  name: string;
  color: "GRAY" | "BLUE" | "YELLOW" | "RED" | "GREEN" | "ORANGE" | "PINK" | "PURPLE";
  description: string;
}

export const STATUS_FIELD_OPTIONS: StatusFieldOption[];

export function statusOptionsMatch(currentNames?: string[]): boolean;

export interface ProjectField {
  name: string;
  dataType: "SINGLE_SELECT" | "DATE";
  options?: string[];
}

export const FIELDS: ProjectField[];

export function statusForIssue(issue?: {
  state?: "open" | "closed";
  labels?: string[];
  hasOpenLinkedPr?: boolean;
  decisionCalloutMissing?: boolean;
}): "Backlog" | "Ready" | "In Progress" | "Blocked" | "Done";

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
}

export function findBoardItem(items?: BoardItem[], issueUrl?: string): BoardItem | undefined;

export const BOARD_LOOKUP_ATTEMPTS: number;
export const BOARD_LOOKUP_BASE_MS: number;

export function resolveBoardItem(deps: {
  addItem: () => BoardItem;
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
}
export const VIEWS: ViewSpec[];
export function viewsToCreate(
  existingNames?: string[],
  fieldIds?: Record<string, number>,
): { name: string; body: Record<string, unknown> }[];
