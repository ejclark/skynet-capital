import { type FormEvent, type ReactElement, useEffect, useId, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMoneypenny } from "../live/moneypenny";
import { type MpThread, messageCount, rowLines } from "../live/moneypenny-threads";
import { Message } from "./mp-message";

/**
 * A SIDE THREAD, ON THE ROW IT IS ABOUT (#7167 criterion 11; `live/moneypenny-threads.ts` has the
 * why). Eric placed threads on their row (#7018 round 5, C) and asked that they collapse: "the
 * thread body is noise to the user when it's not the content of focus". So the row carries ONE
 * closed line — "Your thread with Moneypenny · 3 messages" — and only a tap opens the lines, drawn
 * exactly as the rail draws them. "Continue in the chat" opens the rail on this thread, where the
 * member can reply; the rail links back here. A row with no thread yet shows nothing.
 *
 * `RowAsk` starts one: a one-line question about this row, sent to the chat as this row's thread.
 * A story's ask already exists ("Ask your own", `landing-ask.tsx`) and points at its thread; an
 * event's row had none, so it takes this one.
 */

export function RowThread({ thread }: { readonly thread: MpThread }): ReactElement | null {
  // Only this row's lines, compared line by line: a reply streaming into another row's thread
  // (or the main conversation) re-renders nothing here.
  const lines = useMoneypenny(useShallow((s) => rowLines(s.messages, thread.key)));
  const openThread = useMoneypenny((s) => s.openThread);
  // The store loads the member's saved conversation only when something binds it; without this,
  // a reload showed the row empty until the chat opened (#7308). One read, shared by every row.
  const hydrate = useMoneypenny((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  if (lines.length === 0) return null;
  return (
    <details className="story-more row-thread">
      <summary>
        Your thread with Moneypenny <span className="num">· {messageCount(lines.length)}</span>
      </summary>
      <ol className="row-thread-lines">
        {lines.map((m, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: an append-only thread — position is identity
          <li key={i} className="mp-entry">
            <Message m={m} />
          </li>
        ))}
      </ol>
      <button type="button" className="btn row-thread-go" onClick={() => openThread(thread)}>
        Continue in the chat
      </button>
    </details>
  );
}

/** A one-line question about this row, starting (or continuing) its side thread in the chat. */
export function RowAsk({
  thread,
  question,
}: {
  readonly thread: MpThread;
  /** The member's words, given the row as their referent (`eventQuestion`). */
  readonly question: (text: string) => string;
}): ReactElement {
  const [text, setText] = useState("");
  const inputId = useId();
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (text.trim() && useMoneypenny.getState().ask(question(text), thread)) setText("");
  };
  return (
    <form className="ask-own row-ask" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={inputId}>
        Ask Moneypenny about this
      </label>
      <div className="ask-row">
        <input
          id={inputId}
          className="ask-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Moneypenny about this"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary ask-send" disabled={!text.trim()}>
          Ask
        </button>
      </div>
    </form>
  );
}
