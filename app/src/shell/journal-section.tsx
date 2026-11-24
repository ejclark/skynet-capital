import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchFeedbackIndex } from "../live/feedback";
import { fetchJournal, type JournalIndex } from "../live/journal";
import { meetMoneypenny } from "../live/moneypenny";
import { CommunityUnlockBanner } from "./community-banner";
import { RecentFeedback } from "./feedback-recent";
import { JournalComposer } from "./journal-composer";
import { JournalNotes } from "./journal-notes";

/**
 * YOUR JOURNAL — A VIEWER-LEVEL SECTION OF THE PROFILE PAGE (#8190, a slice of #8161; it was the
 * Feedback section, #3807 slice 2b; #888: a user-level feature belongs on the page itself, never
 * inside an account). One journal, three jobs (#8161 points 14 and 16, Eric 2026-11-23): a wish
 * that feeds builds, a note on what happened, a trade note. Its home is `docs/IA.md` §5.6 *Me*.
 *
 * At 390, in this order (the slice's mobile-first ranking): the composer · your wishes and filings
 * with their status (`RecentFeedback`, a wish marked "Wish" in words) · your notes, newest first.
 *
 * A WISH IS A FILING. It lives in the feedback log, and this section only presents it — the
 * journal store holds notes, never a copy of a wish (#8161: "a concept has one home in the model;
 * a view may present it, never own a copy"). "✦ Talk to Moneypenny" stays: the chat is still the
 * door for a bug, a follow-up and a fresh community-track unlock's one-time celebration.
 *
 * The URL key stays `feedback` for this slice (the journeys and two in-app links point at it);
 * stage 2 of #8161 moves the section into the phone's journal app, where its route is settled once.
 * @category feedback
 */

/** What the composer and the notes read while the journal read is out, and when it failed: notes
 *  off, said plainly, so a slow or broken notes store never holds up or takes down the filings.
 *  Wishes stay governed by the feedback read's own `enabled` (the same token decides both). */
const JOURNAL_OPENING: JournalIndex = {
  available: false,
  wishesEnabled: true,
  notes: [],
  reason: "Opening your notes…",
};
const JOURNAL_DOWN: JournalIndex = {
  ...JOURNAL_OPENING,
  reason: "Your notes are unreachable right now.",
};

export function JournalSection(): ReactElement {
  const queryClient = useQueryClient();
  const index = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const journalRead = useQuery({ queryKey: ["journal"], queryFn: fetchJournal });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["feedback"] });

  // A FAILED READ NEVER TAKES A DRAFT WITH IT (#8355). The composer sits at one place in one tree
  // whatever the feedback read is doing, so a refetch that fails (a tab return during a deploy's
  // restart, a dropped network, the refetch a sent wish triggers) can neither unmount it nor
  // remount it empty when the read recovers. TanStack keeps the last good `data` on a failed
  // refetch; it is shown with one honest line that it could not refresh. Only a first load that
  // failed, with nothing to show, says the filings are unreachable. The first paint waits for the
  // first answer: nothing is mounted yet, so no words can be lost, and a query that has failed
  // stays `error` (never `pending`) while it retries.
  if (index.isPending) return <p className="note">Opening your journal…</p>;
  const data = index.data;
  const journal = journalRead.data ?? (journalRead.isError ? JOURNAL_DOWN : JOURNAL_OPENING);
  // With no feedback read, the notes read's own flag (the same token decides both) says whether
  // a wish can still be sent from here.
  const wishesEnabled = (data?.enabled ?? true) && journal.wishesEnabled;
  return (
    <div className="feedback-section journal-section">
      <header className="page-header">
        <h2>Your journal</h2>
        <p>
          Wishes, what happened, and trade notes, in your own words. A wish goes to the builders as
          a GitHub issue and shows its progress here; your notes stay private to you. For a bug,
          talk to Moneypenny.
        </p>
        {data && data.feedbackCount > 0 ? (
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
      <JournalComposer
        wishesEnabled={wishesEnabled}
        notesAvailable={journal.available}
        notesReason={journal.reason}
      />
      {!data ? (
        <p className="note" role="status">
          Your wishes and filings are unreachable right now. You can still write here.
        </p>
      ) : !data.enabled ? (
        <p className="note">Your wishes and filings show here once filing is switched on.</p>
      ) : (
        <>
          {index.isError ? (
            <p className="note" role="status">
              Your wishes and filings couldn't refresh just now; this is the last list we had.
            </p>
          ) : null}
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
      <JournalNotes notes={journal.notes} available={journal.available} reason={journal.reason} />
    </div>
  );
}
