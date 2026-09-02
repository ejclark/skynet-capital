import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchFeedbackIndex } from "../live/feedback";
import { CommunityUnlockBanner } from "../shell/community-banner";
import { FeedbackDoor } from "../shell/feedback-door";
import { RecentFeedback } from "../shell/feedback-recent";
import { PageFrame } from "../shell/frame";

/**
 * FEEDBACK (#738 phase 9d) — `/feedback` in the shell, AI-first exactly like the legacy page
 * (#449). The page owns the index query and the surrounding furniture; `FeedbackDoor` owns the
 * coach/manual modes and the one form that files.
 */

/** The one starter the shell knows: onboarding's "meet Moneypenny" step seeds the coach's note. */
const STARTERS: Readonly<Record<string, string>> = {
  onboarding:
    "First filing from my onboarding: one thing that would make this desk better for me is …",
};

function FeedbackPage(): ReactElement {
  const { starter } = Route.useSearch();
  const queryClient = useQueryClient();
  const index = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["feedback"] });

  if (index.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the mailbox…</p>
      </PageFrame>
    );
  if (index.isError || !index.data)
    return (
      <PageFrame>
        <p className="note">Feedback is unreachable.</p>
      </PageFrame>
    );

  const data = index.data;
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Feedback</h1>
        <p>
          Bugs, features, enhancements — filed straight onto the build queue as GitHub issues. The
          coach shapes a rough note into something buildable; nothing sends until you hit Send.
        </p>
        {data.feedbackCount > 0 ? (
          <p className="fb-count num">
            You've filed {data.feedbackCount} {data.feedbackCount === 1 ? "time" : "times"}.
          </p>
        ) : null}
      </header>
      {!data.enabled ? (
        <p className="note">Feedback isn't switched on yet — ask Eric to set the feedback token.</p>
      ) : (
        <>
          {data.celebrating.length > 0 ? (
            <CommunityUnlockBanner celebrations={data.celebrating} onClaimed={refresh} />
          ) : null}
          <FeedbackDoor
            coachEnabled={data.coachEnabled}
            onFiled={refresh}
            starter={starter ? STARTERS[starter] : undefined}
          />
          <RecentFeedback recent={data.recent} followupEnabled={data.followupEnabled} />
        </>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/feedback")({
  // `?starter=onboarding` seeds the coach's note (M·01's step 2); anything else is dropped.
  validateSearch: (search: Record<string, unknown>) =>
    typeof search.starter === "string" && search.starter in STARTERS
      ? { starter: search.starter }
      : {},
  component: FeedbackPage,
});
