// Type surface for audit.mjs (formerly postmaster-audit.mjs) — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/moneypenny/index.d.mts (formerly postmaster.d.mts), the pattern this mirrors).
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
export interface AuditDeps {
  unclaimedIssues?: UnclaimedIssue[];
  silentFeedback?: SilentFeedbackIssue[];
  readyPlans?: ReadyPlanCandidate[];
  conflictedPRs?: ConflictedPR[];
  alreadyFlagged?: number[];
  alreadyFlaggedPRs?: (number | AlreadyFlaggedPR)[];
  staleAfterDays?: number;
  silentAfterHours?: number;
  planStallAfterHours?: number;
}
export interface AuditIntent {
  kind: string;
  issueNumber?: number;
  prNumber?: number;
  title: string;
  body: string;
  quietDays?: number;
  hoursSinceFiled?: number;
  hoursSinceReady?: number;
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
