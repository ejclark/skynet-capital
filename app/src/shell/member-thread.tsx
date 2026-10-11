import type { FormEvent, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

/**
 * A THREAD OF MEMBER WORDS UNDER SOMETHING ANOTHER MEMBER POSTED — the shared parts of the two
 * places one exists: comments on a filing (`filing-comments.tsx`, #2224 shape 3) and replies under
 * a weekly Council line (`council-replies.tsx`, #5097). Lifted out when the second one arrived so
 * the two can't drift: the same fold, the same row, the same compose box, the same two-tap delete.
 * Each caller keeps its own words and its own write path.
 *
 * Collapsed by default: the list above it is the point, and an open thread per row at 390px would
 * bury it. The toggle carries the count as a word, never a colour.
 *
 * DELETE (writer only): your own words carry a Delete that takes two taps — the first arms it and
 * says so, the second removes it — the same guard the Council's take-back uses.
 */

export interface ThreadItem {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  /** The viewer wrote it — the only thing that offers Delete. */
  readonly mine: boolean;
}

type WriteResult = { readonly ok: boolean; readonly error?: string };

export function ThreadFold({
  count,
  none,
  one,
  many,
  children,
}: {
  readonly count: number;
  /** The toggle's word with nothing in the thread yet — the action, e.g. "Reply". */
  readonly none: string;
  readonly one: string;
  readonly many: string;
  readonly children: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const label = count === 0 ? none : `${count} ${count === 1 ? one : many}`;
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
      {open ? <div className="fc-body">{children}</div> : null}
    </div>
  );
}

export function ThreadRow({
  item,
  tag,
  aside,
  onRemove,
  onSaved,
}: {
  readonly item: ThreadItem;
  /** A word beside the date naming who wrote it when it isn't you — never a hue alone. */
  readonly tag?: string;
  /** One sentence under the words, when they need context to read honestly. */
  readonly aside?: string;
  readonly onRemove: () => Promise<WriteResult>;
  /** Refresh the shared read after a write. */
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
      const result = await onRemove();
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
      <span className="fc-text">{item.text}</span>
      {aside ? <span className="fc-aside">{aside}</span> : null}
      <span className="fc-meta num">
        {item.mine ? <strong className="fc-you">you</strong> : null}
        {!item.mine && tag ? <strong className="fc-tag">{tag}</strong> : null}
        {new Date(item.at).toLocaleDateString()}
      </span>
      {item.mine ? (
        <button type="button" className="fc-delete" disabled={busy} onClick={() => void remove()}>
          {armed ? "Tap again to delete" : "Delete"}
        </button>
      ) : null}
      {note ? <p className="set-err">{note}</p> : null}
    </li>
  );
}

export function ThreadCompose({
  label,
  placeholder,
  submitWord,
  busyWord,
  maxChars,
  onSubmit,
  onSaved,
}: {
  /** The input's accessible name — said for a screen reader, hidden on screen. */
  readonly label: string;
  readonly placeholder: string;
  readonly submitWord: string;
  readonly busyWord: string;
  readonly maxChars: number;
  readonly onSubmit: (text: string) => Promise<WriteResult>;
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
      const result = await onSubmit(text);
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
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={text}
        maxLength={maxChars}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary mc-btn"
        disabled={busy || text.trim() === ""}
      >
        {busy ? busyWord : submitWord}
      </button>
      {note ? <p className="set-err">{note}</p> : null}
    </form>
  );
}
