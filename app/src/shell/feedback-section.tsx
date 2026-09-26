import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchFeedbackIndex } from "../live/feedback";
import { meetMoneypenny } from "../live/moneypenny";
import { CommunityUnlockBanner } from "./community-banner";
import { RecentFeedback } from "./feedback-recent";

/**
 * YOUR FEEDBACK — A VIEWER-LEVEL SECTION OF THE PROFILE PAGE (#3807 slice 2b; #888: a user-level
 * feature belongs on the page itself, never inside an account). What `/feedback` was (#738 phase
 * 9d; the member's own filings ledger under Profile, Eric 2026-09-03: "the history of feedback
 * that resulted in github issues … can be retained"), moved as it was. Filing itself is
 * Moneypenny's rail (`moneypenny-rail.tsx`), which is why there is no form here: this section keeps
 * what the rail doesn't carry — every filing with its live status, the follow-up fold, and a fresh
 * community-track unlock's one-time celebration. The one action is opening the rail. These are
 * YOUR filings; the league's mirror board (#1977) is Activity's pulse, not this.
 * @category feedback
 */
export function FeedbackSection(): ReactElement {
  const queryClient = useQueryClient();
  const index = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["feedback"] });

  if (index.isPending) return <p className="note">Opening the mailbox…</p>;
  if (index.isError || !index.data) return <p className="note">Feedback is unreachable.</p>;

  const data = index.data;
  return (
    <div className="feedback-section">
      <header className="page-header">
        <h2>Your feedback</h2>
        <p>
          Bugs, features, enhancements — filed straight onto the build queue as GitHub issues.
          Moneypenny files them for you; every filing gets a real answer.
        </p>
        {data.feedbackCount > 0 ? (
          <p className="fb-count num">
            You've filed {data.feedbackCount} {data.feedbackCount === 1 ? "time" : "times"}.
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary set-save"
          onClick={() => void meetMoneypenny()}
        >
          ✦ Talk to Moneypenny
        </button>
      </header>
      {!data.enabled ? (
        <p className="note">Feedback isn't switched on yet — ask Eric to set the feedback token.</p>
      ) : (
        <>
          {data.celebrating.length > 0 ? (
            <CommunityUnlockBanner celebrations={data.celebrating} onClaimed={refresh} />
          ) : null}
          <RecentFeedback
            recent={data.recent}
            followupEnabled={data.followupEnabled}
            appVersion={data.appVersion}
          />
        </>
      )}
    </div>
  );
}
