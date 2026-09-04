import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchFeedbackIndex } from "../live/feedback";
import { meetMoneypenny } from "../live/moneypenny";
import { CommunityUnlockBanner } from "../shell/community-banner";
import { RecentFeedback } from "../shell/feedback-recent";
import { PageFrame } from "../shell/frame";
import { ProfileRail } from "../shell/profile-rail";

/**
 * YOUR FEEDBACK (#738 phase 9d; door retired by the 2026-09-03 handoff) — the member's own
 * filings ledger, a Profile-rail item (Eric, 2026-09-03: "feedback can be a navigation item under
 * profile, where the history of feedback that resulted in github issues … can be retained").
 * Filing itself is Moneypenny's rail (`shell/moneypenny-rail.tsx`), which is why there is no
 * Feedback tab and no form here: this page keeps what the rail doesn't carry — every filing with
 * its live status, the follow-up fold, and a fresh community-track unlock's one-time celebration.
 * The one action is opening the rail.
 */

function FeedbackPage(): ReactElement {
  const queryClient = useQueryClient();
  const index = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["feedback"] });

  if (index.isPending)
    return (
      <PageFrame rail={<ProfileRail current="feedback" />}>
        <p className="note">Opening the mailbox…</p>
      </PageFrame>
    );
  if (index.isError || !index.data)
    return (
      <PageFrame rail={<ProfileRail current="feedback" />}>
        <p className="note">Feedback is unreachable.</p>
      </PageFrame>
    );

  const data = index.data;
  return (
    <PageFrame rail={<ProfileRail current="feedback" />}>
      <header className="page-header">
        <h1>Your feedback</h1>
        <p>
          Bugs, features, enhancements — filed straight onto the build queue as GitHub issues.
          Moneypenny files them from her rail; every filing gets a real answer.
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
          <RecentFeedback recent={data.recent} followupEnabled={data.followupEnabled} />
        </>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/feedback")({ component: FeedbackPage });
