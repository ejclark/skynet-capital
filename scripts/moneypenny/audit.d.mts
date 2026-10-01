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
}
export interface AuditComment {
  body?: unknown;
  createdAt?: string;
}
export interface UnclaimedIssue {
  title: string;
  number: number;
  quietDays: number;
}
export interface SilentFeedbackIssue {
  title: string;
  number: number;
  hoursSinceFiled: number;
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
  unclaimedIssues?: UnclaimedIssue[];
  silentFeedback?: SilentFeedbackIssue[];
  readyPlans?: ReadyPlanCandidate[];
  conflictedPRs?: ConflictedPR[];
  staleInProgress?: InProgressIssue[];
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
  hoursSinceFiled?: number;
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
/** The pure stall/silent-feedback/plan-stall audit: dependencies in, flag intents out. */
export function audit(deps?: AuditDeps): AuditIntent[];
/** The pure per-issue plan-stall decision — is this a live candidate, and if so how old? */
export function readyPlanCandidate(
  issue: AuditIssue,
  comments?: AuditComment[],
  hasClaim?: boolean,
  nowMs?: number,
): ReadyPlanCandidate | null;
/** Read the real audit dependencies over `gh` — network, not fixture-drivable. */
export function gatherAuditDeps(nowMs: number): AuditDeps;
