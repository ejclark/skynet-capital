import type { Readback } from "./answer-readback.mjs";
import type { AskItem } from "./ask-card.mjs";
// Type surface for scripts/moneypenny/assignments.mjs (see index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
export const ASSIGN_MARKER: string;
export const UNASSIGN_MARKER: string;
export const HOLD_MERGE: string;
export const HELD_PR_HOURS: number;
export const ASSIGN_CAP: number;
export const OPEN_CAP: number;
export const BATCH_STARTS_UTC: readonly (readonly [number, number])[];

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
  kind: "assign" | "unassign" | "readback";
  criterion: 1 | 2 | 4;
  number: number;
  title?: string;
  why: string;
  /** Present on every `assign` — the line criterion 1's comment quotes. */
  decision?: string;
  /** Every numbered question of the callout, parsed (ask-card.mjs). */
  items?: AskItem[];
  /** 1 stops bots or production now … 4 internal (`askRank`). */
  rank?: 1 | 2 | 3 | 4;
  heldPr?: boolean;
  readback?: Readback;
}
export interface AssignIntent {
  kind: "assign-eric" | "unassign-eric" | "readback-eric";
  number: number;
  title?: string;
  criterion: 1 | 2 | 4;
  why: string;
  body?: string;
  /** A read-back's first line, for the run log. */
  said?: string;
}
export interface NeedsYouRow {
  number: number;
  title?: string;
  criterion: 1 | 4;
  why: string;
  decision?: string;
}
/** An ask his answer cannot complete yet, or a `needs-session` issue (#6953 slice 2). */
export interface NeedsSessionRow {
  number: number;
  title?: string;
  why: string;
  decision?: string;
}
export interface Planned {
  queue: QueueRow[];
  actions: PlannedAction[];
  needsYou: NeedsYouRow[];
  needsSession: NeedsSessionRow[];
  /** Asks he holds or is about to, whose callout lacks part of the card (options, prediction, silence line). */
  incomplete: { number: number; title?: string; missing: string[] }[];
  /** Asks he already holds, counted against `OPEN_CAP`. */
  holding: number;
}
/** A `needs-session` issue as REST lists it, open or closed. */
export interface SessionIssue extends PlanIssue {
  state_reason?: string | null;
  closed_at?: string | null;
  pull_request?: unknown;
}
export interface PlanInput {
  issues?: PlanIssue[];
  prs?: PlanPr[];
  markers?: Set<number>;
  /** Open PR numbers whose files are all `*.patch`. */
  patchOnly?: Set<number>;
  sessionIssues?: SessionIssue[];
  /** His readable replies under asks (`readbackFor`). */
  replies?: Readback[];
  /** When the lane last posted an ask, ms; 0 when none is known. */
  lastAskAt?: number;
  now?: number;
}

export function decisionLine(body?: string | null): string | null;
/** Why an ask cannot be completed by his answer yet, or null. */
export function artifactGap(
  item: { number: number; body?: string | null },
  ctx?: { openHeads?: Set<string>; patchOnly?: Set<number> },
): string | null;
export { assignmentComment } from "./ask-card.mjs";
export function batchStart(now?: number): number;
export function lastAskedAt(comments?: readonly MarkerComment[]): number;
export function unassignmentComment(opts: { why: string }): string;
/** A REST comment as `markedByComments` reads it: body plus the author fields `trustedComment` checks. */
export interface MarkerComment {
  body?: string | null;
  author_association?: string;
  user?: { type?: string; login?: string };
}
export function markedByComments(comments?: readonly MarkerComment[]): boolean;
export function plan(input?: PlanInput): Planned;
export function report(
  planned: Pick<Planned, "queue" | "actions"> & Partial<Pick<Planned, "needsSession">>,
): string;
export function gather(opts?: {
  /** Injected for specs; production reads through gh.mjs's `ghRestAll` at the wall clock. */
  rest?: (path: string) => unknown[];
  now?: number;
}): Required<
  Pick<
    PlanInput,
    "issues" | "prs" | "markers" | "patchOnly" | "sessionIssues" | "replies" | "lastAskAt"
  >
>;
export function routeAssignments(deps?: {
  assignments?: Pick<
    PlanInput,
    "issues" | "prs" | "markers" | "patchOnly" | "sessionIssues" | "replies" | "lastAskAt"
  > | null;
  now?: number;
}): AssignIntent[];
export const ASK_LEASE_MS: number;
/** How long a closed capsule's carried ask stays on the needs-session list. */
export const REOPEN_SINCE_MS: number;
export interface AskLease {
  claim: (slug: string) => { claimed: boolean; reason?: string };
  release: (slug: string) => unknown;
}
export function withAskLease<T>(
  number: number | string,
  lease: AskLease | null | undefined,
  work: () => T,
): T | string;
export function askOnce(
  intent: AssignIntent,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
    rest?: (path: string) => unknown[];
    read?: (path: string) => { body?: string | null } | null;
    lease?: AskLease | null;
  },
): string;
export function executeAssignments(
  intent: AssignIntent,
  opts?: {
    run?: (cmd: string, args: string[]) => string;
    /** Injected for specs; production uses gh.mjs's `withRetry` on every write. */
    retry?: <T>(fn: () => T) => T;
  },
): string;
