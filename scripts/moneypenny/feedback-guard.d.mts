// Type surface for feedback-guard.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/moneypenny/index.d.mts, the pattern this mirrors).
export interface GuardIssue {
  state?: string;
  labels?: Array<{ name?: string }>;
  comments?: Array<{ body?: string; createdAt?: string }>;
  commentCount?: number;
  /** #3959 slice 1: on a reply-resumed run, the timestamp silence is measured from. */
  since?: string;
}
export interface GuardResult {
  visible: boolean;
  handedOff?: boolean;
  /** #3959 slice 1: the build ended on `needs-info`, so the caller releases its lease. */
  waitingOnMember?: boolean;
}

/** Did this build leave something a member (or Eric) could actually see? */
export function visibleOutcome(issue?: GuardIssue, hasMatchingPR?: boolean): boolean;
/** Did this build hand its remainder to an interactive session? (#1357) */
export function interactiveHandoff(issue?: GuardIssue): boolean;
/** The comment this guard posts when it catches a silent stall. */
export function stallGuardComment(issueNumber: number, runUrl?: string): string;
/** Read what happened to this issue after a build attempt; comment + label needs-eric if silent. */
export function guardFeedbackOutcome(
  issueNumber: number | string,
  runUrl?: string,
  since?: string,
): GuardResult;
