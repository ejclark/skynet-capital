import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { type BookDesk, bookEventsIn, dayLabel, nextOnBook } from "../live/book-events";
import { dayBefore, glyphOf, inDays } from "../live/book-lanes";
import { ALL_RANGE, marketToday } from "../live/horizon-range";
import { GLYPH_WORD, LaneGlyphIcon } from "./book-lanes";

/**
 * THE NEXT DATE ON WHAT YOU HOLD — one line on the Overview (#3807 slice 2·1; reshaped by #5074,
 * the calendar's V1 from #5037 round 2). It always names the next date on this book, from today,
 * and never reads a range: the Overview has no calendar to drive it (the range lives on Events
 * alone, "controls that do nothing is an oxy moron"), so the line is a fact with a link, not a
 * control's output. "Events ›" opens the calendar on the range that holds that date.
 *
 * The date comes from the desk payload the Overview already fetched — a decision due, a held
 * name's next print, an option's expiry, a position's own next event (`bookEventsIn` with no
 * corpus) — so it costs no request. Its glyph is the lanes picture's (⧗ decide by · ◆ confirmed ·
 * ◇ estimated) with the word for a screen reader; a book with nothing dated says so in words.
 */
export function HeldEventsLine({ desks }: { readonly desks: readonly BookDesk[] }): ReactElement {
  const today = marketToday();
  const book = bookEventsIn({ desks, events: [], calls: [], range: ALL_RANGE, lens: "all" });
  const next = nextOnBook(book, dayBefore(today));
  return (
    <div className="held-next">
      <p className="held-next-label">Next date on what you hold</p>
      <p className="held-next-line">
        {book.positions === 0 ? (
          <span>No open positions — nothing dated.</span>
        ) : next ? (
          <span>
            <LaneGlyphIcon glyph={glyphOf(next)} />
            <span className="visually-hidden">{GLYPH_WORD[glyphOf(next)]}:</span>{" "}
            <span className="held-next-when num">{dayLabel(next.date)}</span> ·{" "}
            {next.what ?? next.title} · {inDays(today, next.date)}
          </span>
        ) : (
          <span>Nothing dated on what you hold yet.</span>
        )}
        <Link
          to="/accounts"
          search={(prev) => ({
            ...prev,
            section: "events" as const,
            q: undefined,
            events: undefined,
            ...(next ? { on: next.date } : {}),
          })}
          className="held-next-link"
        >
          Events ›
        </Link>
      </p>
    </div>
  );
}
