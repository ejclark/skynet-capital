/**
 * The one question the app server asks before it writes onto an issue that already exists: is this
 * a plan? (#7286, named next slice 7.)
 *
 * Why it matters: the server's GitHub token posts as the owner's login. On a plan issue, a `ready`
 * label from that login is the go that starts the plan lane's build, and so is a comment that reads
 * as "ready" (`plan-claim.mjs`: `labelEventReady`, `isReadySignal`). A member's words relayed
 * through the app must never become that go, so any write onto an existing issue (a follow-up
 * comment, a `ready` cycle) checks this first and leaves a plan alone. The app may file feedback
 * and research asks; it never steers the plan lanes. `tests/arch/server-label-guard.spec.ts` fails
 * when a file under src/server writes `ready` without asking this.
 *
 * "Plan" is the same rule the lanes use (`inFeedbackLane` in scripts/moneypenny/labels.mjs: an
 * issue carrying the `plan` label belongs to the plan lane), so the two can never disagree.
 */
import { inFeedbackLane, type PullableIssue } from "../../scripts/moneypenny/labels.mjs";

/** True when the issue carries the `plan` label, so the app server must not write onto it. */
export function isPlanIssue(issue: Pick<PullableIssue, "labels">): boolean {
  return !inFeedbackLane(issue);
}

/** What a member reads when their own filing has since become a plan issue. */
export const PLAN_FILING_REFUSAL =
  "This filing is now part of a planned piece of work, and the app doesn't post on those. " +
  "Send what you wanted to add as new feedback instead.";
