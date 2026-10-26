/**
 * Boot-time wiring for the in-app feedback pipeline: submission (GitHub-backed, optional), the
 * AI coach that helps a member phrase a filing (optional), the local log correlating a filing to
 * the issue it became, live status for that issue, and the follow-up path for a member adding
 * more to a filing they already own. Pulled out of `serve-dashboard.ts` to keep that file's own
 * complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate) — env-only wiring, no state of
 * its own beyond the stores it constructs.
 */
import { createCommunityProgressionService } from "../server/community-progression-service.js";
import { createCommunityProgressionStore } from "../server/community-progression-store.js";
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
  /** The community milestone track — filing feedback earns it, never a trade code. */
  communityProgression: ReturnType<typeof createCommunityProgressionService>;
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
  // What a member filed, correlated to the issue it became.
  const feedbackLog = createFeedbackLogStore(env);
  // Live status for those filings — GitHub itself, never a local store.
  const feedbackStatus = resolveFeedbackStatus(env);
  // A member adding more to a filing they already own, and the re-trigger that comes with it.
  const feedbackFollowup = resolveFeedbackFollowup(env);
  // The community milestone track — own store, own derivation; never the trade ladder's.
  const communityProgression = createCommunityProgressionService({
    readFeedback: (id) => feedbackLog.list(id),
    store: createCommunityProgressionStore(env, (m) => console.error(m)),
  });

  return {
    feedback,
    feedbackCoach,
    feedbackLog,
    feedbackStatus,
    feedbackFollowup,
    communityProgression,
  };
}
