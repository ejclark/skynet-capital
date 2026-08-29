// Type surface for postmaster-plan-claim.mjs — the scripts/ tree is plain ESM with `allowJs` off,
// so a spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/postmaster.d.mts, the pattern this mirrors).
export interface PlanIssue {
  number?: number;
  state?: string;
  labels?: Array<{ name?: string }>;
  body?: string;
}
export interface PlanComment {
  body?: string;
}
export interface IssueCommentCtx {
  payload?: { issue?: PlanIssue; comment?: PlanComment };
}
export interface PlanReadyIntent {
  ready: boolean;
  reason: string;
  issue?: PlanIssue;
}

/** Does this comment read as a ready-flip ("ready", "go", "aligned, execute", or similar)? */
export function isReadySignal(text: unknown): boolean;
/** Does this issue carry the `plan` label? */
export function hasPlanLabel(issue: PlanIssue | undefined): boolean;
/** The pure decision: is this `issue_comment` payload a ready-flip on an open plan issue? */
export function planReadyIntent(ctx: IssueCommentCtx): PlanReadyIntent;
