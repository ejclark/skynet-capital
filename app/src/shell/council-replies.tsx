import type { ReactElement } from "react";
import { type CouncilReply, removeCouncilReply, submitCouncilReply } from "../live/council-replies";
import { ThreadCompose, ThreadFold, ThreadRow } from "./member-thread";

/**
 * REPLIES UNDER ONE WEEKLY COUNCIL LINE (#5097 — #2224 option A; Eric, 2026-10-10: "bringing
 * commentary to the trading section… engagement, note taking"). The line used to be a broadcast
 * nobody could answer; `docs/THE-GAME.md:117` says the argument is the product. Built the same way
 * as comments on a filing — `member-thread.tsx`'s fold, row and two-tap delete — so a member who
 * has used one already knows the other.
 *
 * Two words keep the argument honest, both said rather than coloured:
 *  - "line's writer" beside a reply the line's own writer left, so their answer doesn't read as a
 *    third voice;
 *  - "answered an earlier version of this line" under a reply written before the line was edited,
 *    so it never passes as an answer to words its writer didn't see.
 *
 * Anyone in the gate may answer, the line's writer included. The footnote says where the words go:
 * nowhere but here, and only their writer can take them back.
 */

const REPLY_MAX_CHARS = 500;

export function CouncilReplies({
  lineId,
  lineAt,
  replies,
  onSaved,
}: {
  /** The line's id (`CouncilEntry.id`) — what the reply hangs on. */
  readonly lineId: string;
  /** The version of the line on screen — the server refuses if it changed since. */
  readonly lineAt: string;
  readonly replies: readonly CouncilReply[];
  /** Refresh the Council and its replies after a write. */
  readonly onSaved: () => Promise<unknown>;
}): ReactElement {
  // A refusal may mean the line moved under the member (edited or taken back): refresh the read so
  // the words on screen catch up, and keep what they typed.
  const answer = async (text: string) => {
    const result = await submitCouncilReply(lineId, lineAt, text);
    if (!result.ok) void onSaved();
    return result;
  };
  return (
    <ThreadFold count={replies.length} none="Reply" one="reply" many="replies">
      {replies.length > 0 ? (
        <ul className="fc-list">
          {replies.map((r) => (
            <ThreadRow
              key={r.id}
              item={r}
              {...(r.byLineAuthor ? { tag: "line's writer" } : {})}
              {...(r.earlierLine ? { aside: "Answered an earlier version of this line." } : {})}
              onRemove={() => removeCouncilReply(lineId, r.id)}
              onSaved={onSaved}
            />
          ))}
        </ul>
      ) : null}
      <ThreadCompose
        label="Your reply to this line"
        placeholder="Answer this line…"
        submitWord="Reply"
        busyWord="Replying…"
        maxChars={REPLY_MAX_CHARS}
        onSubmit={answer}
        onSaved={onSaved}
      />
      <p className="note fc-note">
        Replies stay in the app for members to read. Only the writer can delete one.
      </p>
    </ThreadFold>
  );
}
