// Type surface for audit.mjs (formerly postmaster-audit.mjs) — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/moneypenny/index.d.mts (formerly postmaster.d.mts), the pattern this mirrors).
import type { WorkModeState } from "./work-mode-title.d.mts";
export interface AuditIssue {
  number?: number;
  title?: string;
  state?: string;
  closedByPullRequests?: unknown[];
  linkedPullRequests?: unknown[];
  labels?: readonly ({ name?: string } | string)[];
  createdAt?: string;
  updatedAt?: string;
}
/** One REST issue-timeline event, as far as `waitingSince` reads it (#6042). */
export interface TimelineEvent {
  event?: string;
  created_at?: string;
  label?: { name?: string };
  /** A `commented` event's text — the plan-stall clock reads ready-flips from it. */
  body?: unknown;
}
export interface UnclaimedIssue {
  title: string;
  number: number;
  quietDays: number;
}
export interface SilentFeedbackIssue {
  title: string;
  number: number;
  /** Whole hours since the issue last began waiting for an answer (#6042), not since it was filed. */
  hoursWaiting: number;
}
/** A silent-feedback or plan-stall flag whose test no longer holds — a `clear-stall` target (#6042). */
export interface StaleStallFlag {
  title: string;
  number: number;
}
export interface ReadyPlanCandidate {
  title: string;
  number: number;
  hoursSinceReady: number;
}
/** A PR the audit sees as currently `mergeable === "CONFLICTING"` (#1403). */
export interface ConflictedPR {
  title: string;
  number: number;
  headRefOid?: string;
}
/** The (PR, head sha) memory `commentAndFlagConflict`'s marker records for a re-dispatch decision
 *  (#1403) — a bare `number` (the pre-#1403 shape) means "flagged, sha unknown". */
export interface AlreadyFlaggedPR {
  number: number;
  sha: string | null;
  attempt: number;
}
/** An open issue carrying `in-progress`, and how long it has been quiet (#3960). */
export interface InProgressIssue {
  title: string;
  number: number;
  hoursQuiet: number;
}
export interface AuditDeps {
  /** The work spigot's dial and the title it currently shows (#3960 criterion 4) — null when it
   *  could not be read, which skips the title sync without touching the other checks. */
  workMode?: WorkModeState | null;
  /** The instruction-drift chore's ticket intent (#5729), from `driftChoreIntent` — null for none. */
  driftChore?: AuditIntent | null;
  /** Green, unarmed PRs whose arm job failed — the re-arm act stage (stranded-pr.mjs). */
  stranded?: import("./stranded-pr.mjs").StrandedPr[];
  unclaimedIssues?: UnclaimedIssue[];
  silentFeedback?: SilentFeedbackIssue[];
  readyPlans?: ReadyPlanCandidate[];
  conflictedPRs?: ConflictedPR[];
  staleInProgress?: InProgressIssue[];
  staleStallFlags?: StaleStallFlag[];
  alreadyFlagged?: number[];
  alreadyFlaggedPRs?: (number | AlreadyFlaggedPR)[];
  staleAfterDays?: number;
  silentAfterHours?: number;
  planStallAfterHours?: number;
  inProgressStaleAfterHours?: number;
}
export interface AuditIntent {
  kind: string;
  issueNumber?: number;
  prNumber?: number;
  title: string;
  /** Every flag intent posts a comment; `retitle-work-mode` deliberately does not — a title is a
   *  display, and its own value is the memory that stops the next push repeating the edit. */
  body?: string;
  /** The title a `retitle-work-mode` intent writes (#3960 criterion 4). */
  newTitle?: string;
  /** The position a `retitle-work-mode` intent is syncing the title to. */
  position?: string;
  /** Why that position resolved, carried from the dial's reader for the run receipt. */
  reason?: string;
  quietDays?: number;
  hoursWaiting?: number;
  hoursSinceReady?: number;
  /** How long a `clear-in-progress` intent's issue had been quiet (#3960). */
  hoursQuiet?: number;
  /** Which re-dispatch this is for a `flag-conflict`/`flag-conflict-cap` intent (#1403). */
  attempt?: number;
}
/** How many times a conflicted PR is re-dispatched before this escalates to `needs-eric` (#1403). */
export const CONFLICT_REPAIR_CAP: number;
/** The `<!-- moneypenny:conflict sha=… attempt=… -->` marker a conflict-flag comment embeds. */
export const CONFLICT_MARKER: RegExp;

/** Did this issue get an ANSWER — closed, or linked to a PR? */
export function answered(issue?: AuditIssue): boolean;
/** A `ready` feedback issue with no PR and no terminal label — what the stall audit pings (#5667). */
export function owedAnswer(issue?: AuditIssue): boolean;
/** When the issue last began waiting for an answer — `ready`/`feedback` added, any parking label or
 *  `next-slice` removed — from its REST timeline; `fallback` if never (#6042, #6287). */
export function waitingSince(timeline?: TimelineEvent[], fallback?: string): string | undefined;
/** The silent-feedback candidates, timed from `waitingSince`, minus `in-progress` and already-flagged. */
export function silentFeedbackFrom(
  issues?: AuditIssue[],
  timelineOf?: (n: number | undefined) => TimelineEvent[],
  nowMs?: number,
  flagged?: number[],
): SilentFeedbackIssue[];
/** Silent-feedback `stall-flagged` issues no longer owed an answer — each gets one `clear-stall`. */
export function staleStallFlags(issues?: AuditIssue[]): StaleStallFlag[];
/** The pure stall/silent-feedback/plan-stall audit: dependencies in, flag intents out. */
export function audit(deps?: AuditDeps): AuditIntent[];
/** A plan answered, handed on, parked or in build, by labels alone — no read needed (#6042). */
export function planSpokenFor(issue?: AuditIssue): boolean;
/** The latest ready-flip (comment or `ready` added) in ms; null if none or `ready` was taken back. */
export function latestPlanFlip(timeline?: TimelineEvent[]): number | null;
/** The pure per-issue plan-stall decision — is this a live candidate, and if so how long waiting? */
export function readyPlanCandidate(
  issue: AuditIssue,
  timeline?: TimelineEvent[],
  hasClaim?: boolean,
  nowMs?: number,
): ReadyPlanCandidate | null;
/** The plan-stall writer: unflagged candidates to threshold, and flagged plans to clear (#6042). */
export function planStallFrom(
  issues?: AuditIssue[],
  timelineOf?: (n: number | undefined) => TimelineEvent[],
  claimOf?: (n: number | undefined) => boolean,
  nowMs?: number,
  flagged?: number[],
): { readyPlans: ReadyPlanCandidate[]; staleFlags: StaleStallFlag[] };
/** The open issues carrying `in-progress`, each with whole hours since `updatedAt` (#3960). */
export function staleInProgressFrom(
  issues?: { title: string; number: number; updatedAt: string; labels?: { name: string }[] }[],
  nowMs?: number,
): InProgressIssue[];
/** The open-issue list ceiling `gatherAuditDeps` reads up to. */
export const OPEN_ISSUE_LIMIT: number;
/** Pass a `gh … list --limit` result through, or throw when it came back at the limit (may be truncated). */
export function untruncated<T>(rows: T[] | undefined, limit: number, label: string): T[];
/** Read the real audit dependencies over `gh` — network, not fixture-drivable. */
export function gatherAuditDeps(nowMs: number): AuditDeps;
