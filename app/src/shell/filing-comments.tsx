import type { ReactElement } from "react";
import {
  type FilingComment,
  removeFilingComment,
  submitFilingComment,
} from "../live/filing-comments";
import { ThreadCompose, ThreadFold, ThreadRow } from "./member-thread";

/**
 * A FILING'S COMMENTS, ON ITS PULSE CARD (issue #2224 shape 3) — any member can weigh in on a
 * filing someone else made, right where they see it on Activity → Feedback pulse. The fold, row,
 * compose box and two-tap delete are `member-thread.tsx`'s, shared with replies under a Council
 * line (#5097); the words and the write path are this file's.
 *
 * THE GUARD, SAID TO THE MEMBER: these comments stay in the app. They are never posted to the
 * GitHub issue, so they never reach the build that reads that thread (#2224's 2026-09-30 call
 * sheet). The fold says so in one line, because "comment on an idea" otherwise reads as "steer
 * it". The filer's own card offers no comment box — their words belong on the thread, through
 * Follow up on their Profile, which is the one in-app path that reaches the build.
 */

const COMMENT_MAX_CHARS = 500;

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
  return (
    <ThreadFold count={comments.length} none="Comment" one="comment" many="comments">
      {comments.length > 0 ? (
        <ul className="fc-list">
          {comments.map((c) => (
            <ThreadRow
              key={c.id}
              item={c}
              onRemove={() => removeFilingComment(issueNumber, c.id)}
              onSaved={onSaved}
            />
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
          <ThreadCompose
            label={`Your comment on #${issueNumber}`}
            placeholder="Agree, add detail, or say you want it too…"
            submitWord="Comment"
            busyWord="Posting…"
            maxChars={COMMENT_MAX_CHARS}
            onSubmit={(text) => submitFilingComment(issueNumber, text)}
            onSaved={onSaved}
          />
          <p className="note fc-note">
            Comments stay in the app for members to read. They don't go to the GitHub issue or
            change what gets built.
          </p>
        </>
      )}
    </ThreadFold>
  );
}
