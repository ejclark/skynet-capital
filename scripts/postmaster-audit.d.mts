// Type surface for postmaster-audit.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/postmaster.d.mts, the pattern this mirrors).
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
export interface AuditDeps {
  unclaimedIssues?: UnclaimedIssue[];
  silentFeedback?: SilentFeedbackIssue[];
  readyPlans?: ReadyPlanCandidate[];
  alreadyFlagged?: number[];
  staleAfterDays?: number;
  silentAfterHours?: number;
  planStallAfterHours?: number;
}
export interface AuditIntent {
  kind: string;
  issueNumber: number;
  title: string;
  body: string;
  quietDays?: number;
  hoursSinceFiled?: number;
  hoursSinceReady?: number;
}

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
