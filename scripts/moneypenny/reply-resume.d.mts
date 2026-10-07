// Type surface for reply-resume.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec
// that imports from it needs this rather than a repo-wide tsconfig loosening for one file (same
// pattern as scripts/moneypenny/plan-claim.d.mts).
import type { IssueCommentCtx, PlanIssue } from "./plan-claim.d.mts";

export interface ReplyResumeIntent {
  resume: boolean;
  reason: string;
  issue?: PlanIssue;
  /** Which parking label the reply answered — `needs-info` in slice 1. */
  answered?: string;
}

/** The pure decision: does this authorized reply resume a blocked feedback build? (#3959 slice 1)
 *
 *  `issue.pull_request` is read here and nowhere else in the lane: `issue_comment` fires for PR
 *  comments under the same `issue` key, and that field is the only thing that tells them apart. */
export function replyResumeIntent(
  ctx: IssueCommentCtx & {
    payload?: { issue?: { pull_request?: unknown }; comment?: { id?: number } };
  },
): ReplyResumeIntent;
