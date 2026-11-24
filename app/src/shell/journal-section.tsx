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

  if (index.isPending) return <p className="note">Opening your journal…</p>;
  if (index.isError || !index.data) return <p className="note">Your journal is unreachable.</p>;

  const data = index.data;
  const journal = journalRead.data ?? (journalRead.isError ? JOURNAL_DOWN : JOURNAL_OPENING);
  return (
    <div className="feedback-section journal-section">
      <header className="page-header">
        <h2>Your journal</h2>
        <p>
          Wishes, what happened, and trade notes, in your own words. A wish goes to the builders as
          a GitHub issue and shows its progress here; your notes stay private to you. For a bug,
          talk to Moneypenny.
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
      <JournalComposer
        wishesEnabled={data.enabled && journal.wishesEnabled}
        notesAvailable={journal.available}
        notesReason={journal.reason}
      />
      {!data.enabled ? (
        <p className="note">Your wishes and filings show here once filing is switched on.</p>
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
      <JournalNotes notes={journal.notes} available={journal.available} reason={journal.reason} />
    </div>
  );
}
