import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { type BookEvent, dayLabel, describeTouch } from "../live/book-events";
import { glyphOf } from "../live/book-lanes";
import { LaneGlyphIcon } from "./book-lanes";

/**
 * THE AGENDA (#3807 slice 2c): one row per event on the book in the range — the date, the glyph
 * the lanes picture draws for it (#5074: ▲ ◆ ◇ ○, one shape language above and below) with the
 * tier in a word (hue never alone, docs/BRAND.md → Accessibility), the title as visible text, the
 * ledger's call when one exists, and the held position it lands on. ONE link per row, and it goes
 * to a PLACE, never a filter: the position's own row on the Overview (`#pos-<symbol>`) — for a
 * market-wide print, the position it is the next event for — or, when it is nobody's next event,
 * that day on R&D (its ledger when the event is researched).
 */

const TIER_WORD: Record<BookEvent["tier"], string> = {
  decide: "decide by",
  held: "on what you hold",
  market: "market-wide",
};

function RowLink({ event }: { readonly event: BookEvent }): ReactElement {
  const [first, ...more] = event.touches;
  if (first)
    return (
      <>
        <Link
          to="/accounts"
          search={(prev) => ({ ...prev, section: undefined, events: undefined })}
          hash={`pos-${first.rowSymbol}`}
          className="agenda-link"
        >
          {describeTouch(first)} →
        </Link>
        {more.length > 0 ? (
          <span className="agenda-more">
            {" "}
            · also {more.map((t) => describeTouch(t)).join("; ")}
          </span>
        ) : null}
      </>
    );
  if (event.call)
    return (
      <a href={event.call.href} className="agenda-link">
        Read the research on it ↗
      </a>
    );
  return (
    <Link to="/research" search={{ on: event.date }} className="agenda-link">
      See {dayLabel(event.date)} on R&amp;D →
    </Link>
  );
}

export function AgendaRow({ event }: { readonly event: BookEvent }): ReactElement {
  return (
    <li className="agenda-row" data-tier={event.tier}>
      <span className="agenda-when num">{dayLabel(event.date)}</span>
      <span className="agenda-glyph">
        <LaneGlyphIcon glyph={glyphOf(event)} />
      </span>
      <span className="agenda-title">{event.title}</span>
      <span className={`book-tier book-tier-${event.tier}`}>{TIER_WORD[event.tier]}</span>
      {event.call ? (
        <span className="agenda-call">
          The call ({event.call.horizon.toLowerCase()}): {event.call.call}
          {event.call.confidence ? ` · ${event.call.confidence} confidence` : ""}
        </span>
      ) : null}
      <span className="agenda-touch">
        <RowLink event={event} />
      </span>
    </li>
  );
}
