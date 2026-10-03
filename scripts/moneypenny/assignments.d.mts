// Type surface for scripts/moneypenny/assignments.mjs (see index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
export const ASSIGN_MARKER: string;
export const HOLD_MERGE: string;
export const HELD_PR_HOURS: number;
export const ASSIGN_CAP: number;

type Named = string | { name?: string };
type User = string | { login?: string };

export interface PlanIssue {
  number: number;
  title?: string;
  body?: string | null;
  state?: string;
  created_at?: string;
  labels?: Named[];
  assignees?: User[];
  user?: { login?: string };
}
export interface PlanPr {
  number: number;
  title?: string;
  state?: string;
  draft?: boolean;
  created_at?: string;
  labels?: Named[];
  assignees?: User[];
  head?: { ref?: string };
}
export interface QueueRow {
  number: number;
  title?: string;
  decision: string | null;
  author: string;
  assigned: boolean;
  ageDays: number;
}
export interface PlannedAction {
  kind: "assign" | "unassign";
  criterion: 1 | 2 | 4;
  number: number;
  title?: string;
  why: string;
  /** Present on every `assign` — the line criterion 1's comment quotes. */
  decision?: string;
}
export interface AssignIntent {
  kind: "assign-eric" | "unassign-eric";
  number: number;
  title?: string;
  criterion: 1 | 2 | 4;
  why: string;
  body?: string;
}
export interface NeedsYouRow {
  number: number;
  title?: string;
  criterion: 1 | 4;
  why: string;
  decision?: string;
}
export interface Planned {
  queue: QueueRow[];
  actions: PlannedAction[];
  needsYou: NeedsYouRow[];
}
export interface PlanInput {
  issues?: PlanIssue[];
  prs?: PlanPr[];
  markers?: Set<number>;
  now?: number;
}

export function decisionLine(body?: string | null): string | null;
export function assignmentComment(opts: { decision: string }): string;
export function plan(input?: PlanInput): Planned;
export function report(planned: Pick<Planned, "queue" | "actions">): string;
export function gather(): Required<Pick<PlanInput, "issues" | "prs" | "markers">>;
export function routeAssignments(deps?: {
  assignments?: Required<Pick<PlanInput, "issues" | "prs" | "markers">> | null;
  now?: number;
}): AssignIntent[];
export function executeAssignments(
  intent: AssignIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
