// Type surface for reply-resume.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec
// that imports from it needs this rather than a repo-wide tsconfig loosening for one file (same
// pattern as scripts/moneypenny/plan-claim.d.mts).
import type { IssueCommentCtx, PlanIssue } from "./plan-claim.d.mts";

export interface ReplyResumeIntent {
  resume: boolean;
  reason: string;
  issue?: PlanIssue;
  /** Which parking label the reply answered — `needs-info` or `needs-eric`. */
  answered?: string;
  /** The lane that owns the issue, derived from its labels (never recorded). */
  lane?: "feedback" | "plan";
}

/** The pure decision: does this authorized reply resume the lane blocked on it? (#3959 slices 1–2)
 *
 *  `issue.pull_request` is read here and nowhere else in the lane: `issue_comment` fires for PR
 *  comments under the same `issue` key, and that field is the only thing that tells them apart. */
export function replyResumeIntent(
  ctx: IssueCommentCtx & {
    payload?: { issue?: { pull_request?: unknown }; comment?: { id?: number } };
  },
): ReplyResumeIntent;

/** The parking labels a reply can answer — `needs-design` and `hold-merge` wait on a session and a
 *  merge click, which a comment is not. */
export const ANSWERABLE: readonly string[];

/** The lane that owns an issue, derived from its labels. `feedback` wins a dual-labelled issue. */
export function laneOf(issue: PlanIssue | undefined): "feedback" | "plan" | null;

/** The opening of the trailer `src/server/feedback-followup.ts` appends to a follow-up it relays
 *  for a member (#7286 slice 8) — the only tell that an OWNER comment is not Eric's own. */
export const RELAY_TRAILER_OPENER: string;

/** Whether a comment body carries the relay trailer. */
export function isRelayedFollowup(body: unknown): boolean;

/** The sentence that ends the relay trailer on a follow-up the app held out of the build queue
 *  for the filing check (#7548). */
export const RECHECK_MARK: string;

/** Whether a relayed follow-up ENDS with the held-for-the-filing-check trailer. */
export function isHeldForRecheck(body: unknown): boolean;
