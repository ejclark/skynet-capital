import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import {
  type FilingComment,
  removeFilingComment,
  submitFilingComment,
} from "../live/filing-comments";

/**
 * A FILING'S COMMENTS, ON ITS PULSE CARD (issue #2224 shape 3) — any member can weigh in on a
 * filing someone else made, right where they see it on Activity → Feedback pulse.
 *
 * THE GUARD, SAID TO THE MEMBER: these comments stay in the app. They are never posted to the
 * GitHub issue, so they never reach the build that reads that thread (#2224's 2026-09-30 call
 * sheet). The fold says so in one line, because "comment on an idea" otherwise reads as "steer
 * it". The filer's own card offers no comment box — their words belong on the thread, through
 * Follow up on their Profile, which is the one in-app path that reaches the build.
 *
 * Collapsed by default: the pulse is a list of ideas first, and a thread per card at 390px would
 * bury it. The toggle carries the count as a word, never a colour.
 *
 * DELETE (author only): your own comments carry a Delete that takes two taps — the first arms it
 * and says so, the second removes it — the same guard the Council's take-back uses.
 */

const COMMENT_MAX_CHARS = 500;

function CommentRow({
  issueNumber,
  comment,
  onSaved,
}: {
  readonly issueNumber: number;
  readonly comment: FilingComment;
  readonly onSaved: () => Promise<unknown>;
}): ReactElement {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const remove = async () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    try {
      const result = await removeFilingComment(issueNumber, comment.id);
      if (result.ok) await onSaved();
      else setNote(result.error ?? "Couldn't delete that.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setArmed(false);
    }
  };
  return (
    <li className="fc-comment">
      <span className="fc-text">{comment.text}</span>
      <span className="fc-meta num">
        {comment.mine ? <strong className="fc-you">you</strong> : null}
        {new Date(comment.at).toLocaleDateString()}
      </span>
      {comment.mine ? (
        <button type="button" className="fc-delete" disabled={busy} onClick={() => void remove()}>
          {armed ? "Tap again to delete" : "Delete"}
        </button>
      ) : null}
      {note ? <p className="set-err">{note}</p> : null}
    </li>
  );
}

function CommentCompose({
  issueNumber,
  onSaved,
}: {
  readonly issueNumber: number;
  readonly onSaved: () => Promise<unknown>;
}): ReactElement {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const inputId = useId();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(undefined);
    try {
      const result = await submitFilingComment(issueNumber, text);
      if (result.ok) {
        setText("");
        await onSaved();
      } else {
        setNote(result.error ?? "Couldn't post that.");
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="fc-compose" onSubmit={(e) => void submit(e)}>
      <label className="visually-hidden" htmlFor={inputId}>
        Your comment on #{issueNumber}
      </label>
      <input
        id={inputId}
        type="text"
        value={text}
        maxLength={COMMENT_MAX_CHARS}
        placeholder="Agree, add detail, or say you want it too…"
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary mc-btn"
        disabled={busy || text.trim() === ""}
      >
        {busy ? "Posting…" : "Comment"}
      </button>
      {note ? <p className="set-err">{note}</p> : null}
    </form>
  );
}

/** @category feedback */
export function FilingComments({
  issueNumber,
  comments,
  isOwn,
  onSaved,
}: {
  readonly issueNumber: number;
  readonly comments: readonly FilingComment[];
  /** The viewer filed this one — Follow up on the Profile replaces the comment box. */
  readonly isOwn: boolean;
  /** Refresh the shared read after a write — the caller invalidates its comments query. */
  readonly onSaved: () => Promise<unknown>;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const count = comments.length;
  const label = count === 0 ? "Comment" : `${count} comment${count === 1 ? "" : "s"}`;
  return (
    <div className="fc">
      <button
        type="button"
        className="fc-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "▾" : "▸"} {label}
      </button>
      {open ? (
        <div className="fc-body">
          {count > 0 ? (
            <ul className="fc-list">
              {comments.map((c) => (
                <CommentRow key={c.id} issueNumber={issueNumber} comment={c} onSaved={onSaved} />
              ))}
            </ul>
          ) : null}
          {isOwn ? (
            <p className="note fc-note">
              This is your filing. To add to it, use Follow up on{" "}
              <a href="/app/accounts?section=feedback">your Profile</a> — that reaches the build.
            </p>
          ) : (
            <>
              <CommentCompose issueNumber={issueNumber} onSaved={onSaved} />
              <p className="note fc-note">
                Comments stay in the app for members to read. They don't go to the GitHub issue or
                change what gets built.
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
