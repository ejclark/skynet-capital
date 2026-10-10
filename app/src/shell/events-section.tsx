import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { type BookDesk, type BookEvent, bookEventsIn, nextOnBook } from "../live/book-events";
import { bookLanes, bookLens, countsAround } from "../live/book-lanes";
import { useHorizonRange } from "../live/horizon-params";
import { ALL_RANGE, type DayRange, inRange, rangeFor, stepAnchor } from "../live/horizon-range";
import { useRefineSearch } from "../live/refine-search";
import { DEFAULT_LENS, fetchResearchCalendar } from "../live/research";
import { BookLanesPicture } from "./book-lanes";
import { BookRangeHead, rangeWords } from "./book-range-head";
import { AgendaRow } from "./events-agenda";

/**
 * EVENTS — the Profile page's calendar of what you hold (#3807 slice 2c; reshaped by #5074, the
 * calendar's R2 from #5037 round 2, Eric's pick on 2026-10-10: "I love high fidelity interactive
 * widgets for specialized tasks. Simple and effective with a beautiful and delightful
 * experience."). The one dated section on the page, so the one place the range lives — the
 * cockpit head carries no calendar on any section. Three parts, in one card:
 *
 *   the head   the range, with room (`book-range-head.tsx`): arrows, the range in words, and
 *              Week · Month · Quarter each counting the dates on what you hold it would show
 *   the lanes  the picture the range drives (`book-lanes.tsx`): one lane per position plus the
 *              market-wide lane, glyph marks, a lane's next date pinned at its edge when it is past
 *              the range — one tap moves the range onto it
 *   the list   the same dates in words, one row each with ONE link to a place (`events-agenda.tsx`)
 *
 * At ≤860 they stack; from 861 the head spans the card and the list sits beside the lanes — room
 * added, no new concept. The range is the root `?on=&span=` R&D and Trade read; a day the shared
 * range names (`span=day`) reads its week here with that day picked, and the unbounded all lens
 * reads its month. A PICKED DAY is this section's own `?events=` — a tap on a mark — and narrows
 * the list, never the range.
 *
 * HONEST WHEN THIN: no open positions, nothing dated on what you hold, and a research payload that
 * did not arrive each say so in words; an empty range names the next date on what you hold and
 * moves onto it in one tap (#5045); the footer counts how few of the calendar's records name a
 * ticker, with R&D one link away for the full board.
 */

/** "in October 2026", "on Wed, Oct 14" — the range as a phrase for a sentence. */
const when = (title: string, picked: string | undefined): string =>
  picked ? `on ${dayName(picked)}` : `in ${title}`;

const DAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const dayName = (iso: string): string => DAY.format(new Date(`${iso}T00:00:00Z`));

/** On one day: what to decide, then what you hold, then market-wide. */
const TIER_ORDER: Record<BookEvent["tier"], number> = { decide: 0, held: 1, market: 2 };

type HoldState = "reading" | "unreachable" | "empty" | "undated" | "dated";

/** What the lanes say in place of the holdings when there are none to draw. */
const HOLD_NOTE: Partial<Record<HoldState, string>> = {
  reading: "Reading what you hold…",
  unreachable: "Your positions are unreachable — only market-wide prints show.",
  empty: "No open positions on this account — market-wide prints only.",
  undated: "Nothing dated on what you hold yet.",
};

/** The list's first line: the range, then what is in it — never a count it cannot vouch for. */
function headLine(name: string, state: HoldState, onBook: number, market: number): string {
  // Unread, unreachable, empty or never dated: the lanes say which in words; the line adds no claim.
  const held =
    state !== "dated"
      ? null
      : onBook === 0
        ? "nothing on what you hold"
        : `${String(onBook)} on what you hold`;
  return [name, held, `${String(market)} market-wide`].filter(Boolean).join(" · ");
}

/** A "none" claim — nothing dated at all — waits for the calendar to arrive (`vouched`); an event
 *  a position carries on its own (the backstop) can be named before it does. */
function holdState(o: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly positions: number;
  readonly dated: number;
  readonly vouched: boolean;
}): HoldState {
  if (o.loading) return "reading";
  if (o.error) return "unreachable";
  if (o.positions === 0) return "empty";
  return o.dated === 0 && o.vouched ? "undated" : "dated";
}

/** An empty range names the next date on what you hold, and moves onto it in one tap (#5045). */
function NextOnBook({
  next,
  nothingLater,
  landsIn,
  onJump,
}: {
  readonly next: BookEvent | undefined;
  /** The calendar vouches there is nothing later — said, never left blank. */
  readonly nothingLater: boolean;
  /** The name of the range the jump lands on: "November 2026", "Oct 26 – Nov 1". */
  readonly landsIn: (date: string) => string;
  readonly onJump: (date: string) => void;
}): ReactElement | null {
  if (!next)
    return nothingLater ? (
      <p className="note">Nothing later on what you hold is dated yet.</p>
    ) : null;
  return (
    <div className="agenda-next">
      <p className="agenda-next-head">Next on what you hold</p>
      <ol className="agenda" aria-label="Next on what you hold">
        <AgendaRow event={next} />
      </ol>
      <button type="button" className="book-next-jump" onClick={() => onJump(next.date)}>
        Move the range to {landsIn(next.date)} ›
      </button>
    </div>
  );
}

/** How thin the calendar is, said plainly, with the full board one link away. */
function AgendaFoot({
  rows,
  phrase,
  events,
}: {
  readonly rows: number;
  readonly phrase: string;
  /** The calendar's records, when it arrived. */
  readonly events: readonly { readonly symbols: readonly string[] }[] | undefined;
}): ReactElement {
  return (
    <p className="agenda-foot">
      <span className="num">{rows}</span> dated {rows === 1 ? "event" : "events"} on this book{" "}
      {phrase}. Coverage is thin:{" "}
      {events ? (
        <>
          <span className="num">{events.filter((e) => e.symbols.length > 0).length}</span> of{" "}
          <span className="num">{events.length.toLocaleString("en-US")}</span> dated records on the
          calendar name a ticker.
        </>
      ) : (
        "few dated records on the calendar name a ticker."
      )}{" "}
      <Link to="/research" className="agenda-foot-link">
        The full board on R&amp;D →
      </Link>
    </p>
  );
}

export function EventsSection({
  desks,
  desksLoading,
  desksError,
  day,
  onPickDay,
  accounts,
}: {
  readonly desks: readonly BookDesk[] | undefined;
  readonly desksLoading: boolean;
  readonly desksError: boolean;
  /** The picked day, `?events=` — undefined when none is. */
  readonly day: string | undefined;
  readonly onPickDay: (day: string | undefined) => void;
  /** Each desk's name, for a lane's detail when more than one book is in view. */
  readonly accounts?: ReadonlyMap<string, string>;
}): ReactElement {
  const horizon = useHorizonRange();
  const research = useQuery({ queryKey: ["research-calendar"], queryFn: fetchResearchCalendar });
  const lens = bookLens(horizon.lens);
  const range = rangeFor(horizon.anchor, lens);
  const asked = day ?? (horizon.lens === "day" ? horizon.anchor : undefined);
  const picked = asked && inRange(asked, range) ? asked : undefined;
  const closures = research.data?.closures.length ? research.data.closures : MARKET_CLOSURES;

  const events = research.data?.events ?? [];
  const calls = research.data?.calls ?? [];
  const book = desks ?? [];
  const join = (r: DayRange) =>
    bookEventsIn({ desks: book, events, calls, range: r, lens: horizon.lens });
  const everything = join(ALL_RANGE);
  const inView = join(picked ? { start: picked, end: picked } : range);
  const lanes = bookLanes({
    desks: book,
    events: everything,
    range,
    today: horizon.today,
    ...(accounts ? { accounts } : {}),
  });
  const state = holdState({
    loading: desksLoading,
    error: desksError,
    positions: inView.positions,
    dated: everything.decide.length + everything.held.length,
    vouched: research.isSuccess,
  });
  const onBook = inView.decide.length + inView.held.length;
  const quiet = !picked && state === "dated" && onBook === 0;
  const title = rangeWords(range, lens, closures).title;
  const phrase = when(title, picked);
  const rows = [...inView.decide, ...inView.held, ...inView.market].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
  );
  const note = HOLD_NOTE[state];
  // A shared day lens (`span=day`, set on R&D or Trade) reads here as its week with that day
  // picked, so letting the pick go has to drop the day lens with `?events=`, in one write. Without
  // it, Show all, a second tap on the mark and the pressed Week would all do nothing.
  const refine = useRefineSearch();
  const clearPick = (): void =>
    horizon.lens === "day"
      ? refine((prev) => ({
          ...prev,
          events: undefined,
          span: DEFAULT_LENS === "week" ? undefined : "week",
        }))
      : onPickDay(undefined);

  return (
    <section className="book-cal" aria-label="Events">
      <h2 className="visually-hidden">Events</h2>
      <BookRangeHead
        lens={lens}
        range={range}
        closures={closures}
        counts={countsAround(everything, horizon.anchor)}
        onStep={(direction) => horizon.setOn(stepAnchor(horizon.anchor, lens, direction))}
        onLens={(next) => (next === horizon.lens ? undefined : horizon.setLens(next))}
      />
      <div className="book-cal-body">
        <BookLanesPicture
          lanes={lanes}
          lens={lens}
          range={range}
          closures={closures}
          picked={picked}
          today={horizon.today}
          label={`Dates on what you hold, ${title}`}
          {...(note ? { note: <p className="note lanes-note">{note}</p> } : {})}
          onPick={(date) => (date === picked ? clearPick() : onPickDay(date))}
          onJump={horizon.setOn}
          onToday={() => horizon.setOn(undefined)}
        />
        <div className="book-agenda">
          <p className="agenda-head">
            {headLine(picked ? dayName(picked) : title, state, onBook, inView.market.length)}
            {picked ? (
              <button type="button" className="agenda-clear" onClick={clearPick}>
                Show all of {title} ×
              </button>
            ) : null}
          </p>
          {research.isError ? (
            <p className="note">
              The research calendar is unreachable — each position's own next event still shows.
            </p>
          ) : null}
          {rows.length > 0 ? (
            <ol className="agenda" aria-label={`Events ${phrase}`}>
              {rows.map((event) => (
                <AgendaRow key={`${event.tier} ${event.id}`} event={event} />
              ))}
            </ol>
          ) : null}
          {quiet ? (
            <NextOnBook
              next={nextOnBook(everything, range.end)}
              nothingLater={research.isSuccess}
              landsIn={(date) => rangeWords(rangeFor(date, lens), lens, closures).title}
              onJump={horizon.setOn}
            />
          ) : null}
          <AgendaFoot rows={rows.length} phrase={phrase} events={research.data?.events} />
        </div>
      </div>
    </section>
  );
}
