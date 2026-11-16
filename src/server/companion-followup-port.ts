import type { CompanionFollowup, FollowupDraft } from "../companion/companion-followup.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";

/**
 * MONEYPENNY'S FOLLOW-UP READS, BOUND TO ONE SESSION (#7286, named next slice 8). The chat route
 * builds this per turn, so `draft_followup` checks a number against exactly the filings
 * `POST /api/feedback/followup` checks for the same signed-in member — the feedback log, keyed by
 * `opaqueMemberId(session.email)`, never a body field or another member's log.
 *
 * Reads only, on purpose: there is no post here. `onDraft` writes the card to this turn's stream,
 * and the member's tap on it posts to `/api/feedback/followup`, which checks ownership again and
 * refuses a plan issue (`feedback-followup.ts`). A deployment without the feedback log answers an
 * empty list, so the tool says "nothing filed" rather than guessing.
 */
export function companionFollowupFor(
  config: Pick<DashboardServerConfig, "readFeedback">,
  session: Session,
  onDraft: (draft: FollowupDraft) => void,
): CompanionFollowup {
  return {
    ownFilings: async () => {
      if (!config.readFeedback) return [];
      const entries = await config.readFeedback(opaqueMemberId(session.email));
      return entries.map((e) => ({ issueNumber: e.issueNumber, title: e.title }));
    },
    onDraft,
  };
}
