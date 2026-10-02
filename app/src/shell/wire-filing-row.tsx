import type { ReactElement } from "react";
import type { FilingComments as FilingThreads } from "../live/filing-comments";
import type { WireFeedbackItem } from "../live/wire";
import { FilingComments } from "./filing-comments";

/**
 * ONE FILING ROW on the Activity feed (#784 slice 3) — `wire-trade-row.tsx`'s sibling, the second
 * kind of the page's one list. Extracted for the same reason the trade row was: `activity.tsx` sits
 * at the architecture cap, and a feed of several kinds wants one row component per kind rather than
 * a branch inside the list.
 *
 * The row leads with its KIND WORD plus icon, so the feed's left edge always says what each row is
 * where a trade row says BUY or SELL — scannable at 390px without reading across (and legible to a
 * reader for whom one 12px glyph is not a signal, `docs/BRAND.md` → Accessibility). It then says
 * where the filing landed (the status pill, a word not a hue) and what members have said about it
 * (the comments fold, issue #2224 shape 3 — the app's own store, never the GitHub thread). Status
 * is ABSENT, not "In the queue", when nothing has observed one: a filing nobody has polled is
 * honestly state-unknown (`feedback-event-feed.ts`).
 */
export function FilingRow({
  filing,
  threads,
  onCommentSaved,
}: {
  readonly filing: WireFeedbackItem;
  /** Absent when the comments read is unwired or failed — the row still renders, minus its fold. */
  readonly threads?: FilingThreads;
  readonly onCommentSaved: () => Promise<unknown>;
}): ReactElement {
  return (
    <li className="wire-filing">
      <span className="wire-filing-kind">
        <span aria-hidden="true">{filing.icon}</span> {filing.kindLabel}
      </span>
      <a href={filing.url} target="_blank" rel="noopener noreferrer">
        {filing.title}
      </a>
      {filing.status ? (
        <span className={`wire-status wire-status-${filing.statusKey}`}>{filing.status}</span>
      ) : null}
      <span className="wire-fdbk-meta num">{filing.meta}</span>
      {threads ? (
        <FilingComments
          issueNumber={filing.issueNumber}
          comments={threads.comments[String(filing.issueNumber)] ?? []}
          isOwn={threads.ownFilings.includes(filing.issueNumber)}
          onSaved={onCommentSaved}
        />
      ) : null}
    </li>
  );
}
