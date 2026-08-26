/**
 * Boot-time wiring for the in-app feedback pipeline: submission (GitHub-backed, optional), the
 * AI coach that helps a member phrase a filing (optional), the local log correlating a filing to
 * the issue it became, live status for that issue, and the follow-up path for a member adding
 * more to a filing they already own. Pulled out of `serve-dashboard.ts` to keep that file's own
 * complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate) — env-only wiring, no state of
 * its own beyond the stores it constructs.
 */
import { resolveFeedbackCoach } from "../server/feedback-coach.js";
import { resolveFeedbackFollowup } from "../server/feedback-followup.js";
import { createFeedbackLogStore } from "../server/feedback-log.js";
import { resolveFeedback } from "../server/feedback-service.js";
import { resolveFeedbackStatus } from "../server/feedback-status.js";

export interface FeedbackSetup {
  feedback: ReturnType<typeof resolveFeedback>;
  feedbackCoach: ReturnType<typeof resolveFeedbackCoach>;
  feedbackLog: ReturnType<typeof createFeedbackLogStore>;
  feedbackStatus: ReturnType<typeof resolveFeedbackStatus>;
  feedbackFollowup: ReturnType<typeof resolveFeedbackFollowup>;
}

/** Resolve every feedback-pipeline dependency for one boot, warning on anything left dark. */
export function setupFeedback(env: NodeJS.ProcessEnv): FeedbackSetup {
  const feedback = resolveFeedback(env);
  if (!feedback) {
    console.warn(
      "ℹ️  In-app feedback is off (no SKYNET_FEEDBACK_GITHUB_TOKEN) — the /feedback form renders but submissions won't file issues.",
    );
  }
  const feedbackCoach = resolveFeedbackCoach(env);
  if (!feedbackCoach) {
    console.warn(
      "ℹ️  The feedback coach is off (no ANTHROPIC_API_KEY) — the plain /feedback form still works.",
    );
  }
  // What a member filed, correlated to the issue it became (#429).
  const feedbackLog = createFeedbackLogStore(env);
  // Live status for those filings — GitHub itself, never a local store (#429 follow-up).
  const feedbackStatus = resolveFeedbackStatus(env);
  // A member adding more to a filing they already own, and the re-trigger that comes with it.
  const feedbackFollowup = resolveFeedbackFollowup(env);

  return { feedback, feedbackCoach, feedbackLog, feedbackStatus, feedbackFollowup };
}
