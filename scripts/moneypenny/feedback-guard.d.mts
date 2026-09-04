// Type surface for feedback-guard.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/moneypenny/index.d.mts, the pattern this mirrors).
export interface GuardIssue {
  state?: string;
  labels?: Array<{ name?: string }>;
  commentCount?: number;
}
export interface GuardResult {
  visible: boolean;
}

/** Did this build leave something a member (or Eric) could actually see? */
export function visibleOutcome(issue?: GuardIssue, hasMatchingPR?: boolean): boolean;
/** The comment this guard posts when it catches a silent stall. */
export function stallGuardComment(issueNumber: number, runUrl?: string): string;
/** Read what happened to this issue after a build attempt; comment + label needs-eric if silent. */
export function guardFeedbackOutcome(issueNumber: number | string, runUrl?: string): GuardResult;
