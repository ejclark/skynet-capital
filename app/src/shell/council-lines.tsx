import type { ReactElement } from "react";
import type { CouncilEntry } from "../live/council";
import type { CouncilReplies as CouncilThreads } from "../live/council-replies";
import { CouncilReplies } from "./council-replies";

/**
 * THIS WEEK'S COUNCIL LINES, EACH WITH ITS REPLIES (#2224 shape 1's list; replies #5097) — the
 * league's read on Activity → The Council. Lifted out of `routes/activity.tsx` when the replies
 * arrived, so the route stays a page of sections rather than growing a thread inside a list.
 *
 * A line's thread is attached by the line's id, and only when the replies read is for the SAME
 * week as the lines: a member's line id is the same every week, so across a Monday rollover a
 * stale read would otherwise hang last week's argument under this week's line. No read, or another
 * week's, and the lines render with no fold — the list itself never waits on the replies.
 */
export function CouncilLines({
  week,
  entries,
  threads,
  onReplySaved,
}: {
  /** The week the lines belong to (`CouncilWeek.week`). */
  readonly week: string | undefined;
  readonly entries: readonly CouncilEntry[];
  /** Absent when the replies read is unwired, pending or failed. */
  readonly threads?: CouncilThreads;
  readonly onReplySaved: () => Promise<unknown>;
}): ReactElement {
  const live = threads?.enabled && week !== undefined && threads.week === week ? threads : null;
  return (
    <ul className="wire-fdbk council-entries">
      {entries.map((entry) => (
        <li key={entry.id}>
          <span>{entry.text}</span>
          {entry.playbookId ? <span className="council-play-tag">{entry.playbookId}</span> : null}
          {live ? (
            <CouncilReplies
              lineId={entry.id}
              lineAt={entry.at}
              replies={Object.hasOwn(live.replies, entry.id) ? (live.replies[entry.id] ?? []) : []}
              onSaved={onReplySaved}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
