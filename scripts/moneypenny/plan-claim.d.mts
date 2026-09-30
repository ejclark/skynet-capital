// Type surface for plan-claim.mjs (formerly postmaster-plan-claim.mjs) — the scripts/ tree is plain ESM with `allowJs` off,
// so a spec that imports from it needs this rather than a repo-wide tsconfig loosening for one file
// (see scripts/moneypenny/index.d.mts (formerly postmaster.d.mts), the pattern this mirrors).
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
  payload?: {
    issue?: PlanIssue;
    comment?: PlanComment;
    /** Present on an `issues` event: `labeled` / `unlabeled` plus the label that moved. */
    action?: string;
    label?: { name?: string };
  };
}
export interface PlanReadyIntent {
  ready: boolean;
  reason: string;
  issue?: PlanIssue;
}

/** Does this comment read as a ready-flip ("ready", "go", "aligned, execute", or similar)? */
export function isReadySignal(text: unknown): boolean;
/** The one first line a Claude-authored comment may use to flip a plan ready (#3818 slice 2). */
export const CLAUDE_READY_LINE: string;
/** Does this comment carry the Claude Code footer? */
export function isClaudeComment(text: unknown): boolean;
/** Is the comment's first line exactly CLAUDE_READY_LINE (em dash or ASCII hyphen)? */
export function isClaudeReadyLine(text: unknown): boolean;
/** Does this issue carry the `plan` label? */
export function hasPlanLabel(issue: PlanIssue | undefined): boolean;
/** The pure decision: is this `issue_comment` payload a ready-flip on an open plan issue? */
export function planReadyIntent(ctx: IssueCommentCtx): PlanReadyIntent;
/** The label-event ready decision both lanes share (labeled `ready`, or an unpark while ready). */
export function labelEventReady(
  payload: NonNullable<IssueCommentCtx["payload"]>,
  lane: "plan" | "feedback",
): PlanReadyIntent;
/** The feedback lane's pure decision: a buildable feedback issue, plus the unpark path. */
export function feedbackReadyIntent(ctx: IssueCommentCtx): PlanReadyIntent;
