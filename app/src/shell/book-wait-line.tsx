import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, useId, useState } from "react";
import { MAX_WAIT_REASON } from "../../../src/domain/book-wait";
import { dayLabel } from "../live/book-events";
import { inDays } from "../live/book-lanes";
import {
  type BookWaitState,
  bookWaitKey,
  clearBookWait,
  fetchBookWait,
  printChoices,
  reopenBounds,
  setBookWait,
} from "../live/book-wait";
import type { DeskSnapshot } from "../live/desk";
import { marketToday } from "../live/horizon-range";
import { InlineResult } from "../ui";

/**
 * THE WAIT ON THE WHOLE BOOK, ON THE OVERVIEW (#4608 slice 2; `docs/members/eric.md` j4 s2). The
 * member's own call to hold off on one account, said where they read the book: "Wait until <day>"
 * with the reason they wrote and how far off the day is. The owner's hypothesis (eric.md §4) is why
 * the day is always there: "an open-ended wait reads as the app having no opinion." The record and
 * its rules are slice 1's (`src/domain/book-wait.ts`); this file reads and writes it.
 *
 * WHERE IT SITS. A standing (or just-retired) wait leads the Overview's money column, above the
 * net-worth card, so it is the first thing a phone read meets — the member's own decision about
 * this book. With no wait, a quiet "Wait until a date…" button sits under the next-date line: the
 * way in, never the top slot.
 *
 * BESIDE, NEVER OVER. A wait hides nothing: the positions, their review badges and the
 * worth-a-look sort all render below it unchanged, and the line says so. It places and cancels
 * nothing; the chain still owns expiration. From the reopen day on it reads "the question is open
 * again" — never as still standing — until the member waits again or clears it.
 *
 * Words, not tint: the state is a word and a date ("Wait until", "Open again"), so hue never carries
 * it alone (docs/BRAND.md → Accessibility).
 */

/** The wait's line, for the top of the Overview — nothing when no wait is recorded. */
export function BookWaitLine({
  accountId,
  desk,
}: {
  readonly accountId: string;
  readonly desk: DeskSnapshot["desk"] | undefined;
}): ReactElement | null {
  const read = useQuery({
    queryKey: bookWaitKey(accountId),
    queryFn: () => fetchBookWait(accountId),
  });
  const [editing, setEditing] = useState(false);
  const state = read.data;
  if (!state) return null;
  if (editing)
    return (
      <section id="book-wait" className="book-wait" aria-label="Your wait on this book">
        <WaitForm
          accountId={accountId}
          desk={desk}
          start={state.state === "standing" ? state.wait : undefined}
          onDone={() => setEditing(false)}
        />
      </section>
    );
  return <WaitShown accountId={accountId} state={state} onChange={() => setEditing(true)} />;
}

/** The way in when no wait is recorded — a quiet button that opens the form in place. */
export function BookWaitStart({
  accountId,
  desk,
}: {
  readonly accountId: string;
  readonly desk: DeskSnapshot["desk"] | undefined;
}): ReactElement | null {
  const read = useQuery({
    queryKey: bookWaitKey(accountId),
    queryFn: () => fetchBookWait(accountId),
  });
  const [open, setOpen] = useState(false);
  // A wait that could not be read offers no way to set one: the form would write over a call the
  // member may already have made.
  if (read.data !== null) return null;
  if (!open)
    return (
      <p className="book-wait-start">
        <button type="button" className="book-wait-open" onClick={() => setOpen(true)}>
          Wait until a date…
        </button>
        <span className="book-wait-hint">
          {" "}
          Decided to hold off on this book? Name the day to look again.
        </span>
      </p>
    );
  return (
    <section id="book-wait" className="book-wait" aria-label="Wait on this book">
      <WaitForm accountId={accountId} desk={desk} onDone={() => setOpen(false)} />
    </section>
  );
}

function WaitShown({
  accountId,
  state,
  onChange,
}: {
  readonly accountId: string;
  readonly state: BookWaitState;
  readonly onChange: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const clear = useMutation({
    mutationFn: () => clearBookWait(accountId),
    onSuccess: (result) => {
      if (result.ok) void queryClient.invalidateQueries({ queryKey: bookWaitKey(accountId) });
    },
  });
  const failed =
    clear.error instanceof Error
      ? clear.error.message
      : clear.data && !clear.data.ok
        ? (clear.data.error ?? "The wait couldn't be cleared just now.")
        : undefined;
  const { wait } = state;
  const standing = state.state === "standing";
  const today = marketToday();
  return (
    <section
      id="book-wait"
      className="book-wait"
      data-state={state.state}
      aria-label="Your wait on this book"
    >
      <p className="book-wait-head">
        {standing ? (
          <>
            <span className="book-wait-word">Wait until</span>{" "}
            <span className="book-wait-day num">{dayLabel(wait.reopensOn)}</span>
            <span className="book-wait-left"> · {inDays(today, wait.reopensOn)}</span>
          </>
        ) : (
          <>
            <span className="book-wait-word">Open again</span>{" "}
            <span className="book-wait-left">
              — your wait ran to <span className="num">{dayLabel(wait.reopensOn)}</span>. The
              question is open again.
            </span>
          </>
        )}
      </p>
      <p className="book-wait-reason">
        {standing ? "Why: " : "You waited because: "}
        <q>{wait.reason}</q>
      </p>
      {standing ? (
        <p className="book-wait-note">
          A wait hides nothing — every position and its review flag still shows below.{" "}
          <Link
            to="/accounts"
            search={(prev) => ({
              ...prev,
              section: "events" as const,
              q: undefined,
              events: undefined,
              on: wait.reopensOn,
            })}
            className="book-wait-link"
          >
            On the calendar ›
          </Link>
        </p>
      ) : null}
      <p className="book-wait-actions">
        <button type="button" className="book-wait-act" onClick={onChange}>
          {standing ? "Change" : "Wait again"}
        </button>
        <button
          type="button"
          className="book-wait-act"
          disabled={clear.isPending}
          onClick={() => clear.mutate()}
        >
          {standing ? "Stop waiting" : "Dismiss"}
        </button>
      </p>
      {failed ? <InlineResult tone="err">{failed}</InlineResult> : null}
    </section>
  );
}

function WaitForm({
  accountId,
  desk,
  start,
  onDone,
}: {
  readonly accountId: string;
  readonly desk: DeskSnapshot["desk"] | undefined;
  /** The standing wait being changed — its day and reason fill the form. */
  readonly start?: { readonly reopensOn: string; readonly reason: string } | undefined;
  readonly onDone: () => void;
}): ReactElement {
  const ids = { day: useId(), reason: useId() };
  const today = marketToday();
  const { min, max } = reopenBounds(today);
  const prints = printChoices(desk, today);
  const [day, setDay] = useState(start?.reopensOn ?? "");
  const [reason, setReason] = useState(start?.reason ?? "");
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () => setBookWait({ participantId: accountId, reopensOn: day, reason }),
    onSuccess: (result) => {
      if (!result.ok) return;
      void queryClient.invalidateQueries({ queryKey: bookWaitKey(accountId) });
      onDone();
    },
  });
  const refused =
    save.error instanceof Error
      ? save.error.message
      : save.data && !save.data.ok
        ? (save.data.error ?? "The wait couldn't be saved just now.")
        : undefined;
  return (
    <form
      className="book-wait-form"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <p className="book-wait-head">
        <span className="book-wait-word">Wait until</span> — hold off on this whole book until a day
        you name.
      </p>
      {prints.length > 0 ? (
        <fieldset className="book-wait-prints">
          <legend>Reopen on a held name's next earnings</legend>
          {prints.map((p) => (
            <button
              key={p.symbol}
              type="button"
              className="book-wait-print"
              aria-pressed={day === p.at}
              onClick={() => setDay(p.at)}
            >
              {p.symbol} · <span className="num">{dayLabel(p.at)}</span>
              {p.estimated ? " (estimated date)" : ""}
            </button>
          ))}
        </fieldset>
      ) : null}
      <div className="book-wait-fields">
        <label htmlFor={ids.day}>The day it reopens</label>
        <input
          id={ids.day}
          type="date"
          className="num"
          required
          min={min}
          max={max}
          value={day}
          disabled={save.isPending}
          onChange={(e) => setDay(e.target.value)}
        />
        <label htmlFor={ids.reason}>Why you're waiting</label>
        <input
          id={ids.reason}
          type="text"
          required
          maxLength={MAX_WAIT_REASON}
          placeholder="e.g. no new entries until the Fed decision"
          value={reason}
          disabled={save.isPending}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <p className="book-wait-actions">
        <button type="submit" className="book-wait-act book-wait-save" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save the wait"}
        </button>
        <button type="button" className="book-wait-act" onClick={onDone}>
          Cancel
        </button>
      </p>
      {refused ? <InlineResult tone="err">{refused}</InlineResult> : null}
    </form>
  );
}
