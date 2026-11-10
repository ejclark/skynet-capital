import type { ReactElement } from "react";
import { useMoneypenny } from "../live/moneypenny";
import { type MpThread, messageCount, threadIndex } from "../live/moneypenny-threads";
import { PlaceLink } from "./mp-message";

/**
 * THE RAIL'S SIDE THREADS (#7167 criterion 11; `live/moneypenny-threads.ts` has the why). The rail
 * shows one conversation at a time, and these are the two ways between them:
 *   - on the main conversation, every thread the member started on a row, behind ONE collapsed
 *     line, since "the thread body is noise to the user when it's not the content of focus" (Eric,
 *     #7018 round 5). Opened, the threads are one line each, newest first, with a divider between
 *     them (his note on the same pin);
 *   - inside a thread, a bar that names its row as a link back to it (the row lands and outlines,
 *     the way her links do), and a button back to the main conversation.
 * Both wait while an answer is still arriving: her reply lands in the thread it was asked in.
 */

/** Inside a thread: which row it is about, and the way back. */
export function ThreadBar({
  thread,
  disabled,
}: {
  readonly thread: MpThread;
  readonly disabled: boolean;
}): ReactElement {
  const closeThread = useMoneypenny((s) => s.closeThread);
  return (
    <div className="mp-thread-bar">
      <button type="button" className="mp-thread-back" disabled={disabled} onClick={closeThread}>
        <span aria-hidden="true">← </span>Main conversation
      </button>
      <p className="mp-thread-name">
        <span className="mp-thread-word num">Thread on</span>{" "}
        <PlaceLink path={thread.path} text={thread.title} />
      </p>
    </div>
  );
}

/** On the main conversation: the member's side threads, collapsed until asked for. */
export function ThreadIndex({ disabled }: { readonly disabled: boolean }): ReactElement | null {
  const threads = useMoneypenny((s) => s.threads);
  const messages = useMoneypenny((s) => s.messages);
  const openThread = useMoneypenny((s) => s.openThread);
  const index = threadIndex(threads, messages);
  if (index.length === 0) return null;
  return (
    <details className="mp-threads">
      <summary>
        Your side threads <span className="num">· {index.length}</span>
      </summary>
      <ul className="mp-thread-list">
        {index.map(({ thread, count }) => (
          <li key={thread.key}>
            <button
              type="button"
              className="mp-thread-open"
              disabled={disabled}
              onClick={() => openThread(thread)}
            >
              <span className="mp-thread-title">{thread.title}</span>
              <span className="mp-thread-count num">{messageCount(count)}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
