import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import {
  type BookDesk,
  type BookEvent,
  bookEventsIn,
  dayLabel,
  nextOnBook,
} from "../live/book-events";
import { dayLensFog } from "../live/fog";
import { useHorizonRange } from "../live/horizon-params";
import { ALL_RANGE, type DayRange, rangeLabel } from "../live/horizon-range";
import { fetchPlays } from "../live/options";
import { fetchResearchCalendar, type Lens, type ResearchEvent } from "../live/research";
import { EventHorizon } from "./event-horizon";
import { AgendaRow, TIER, TierMark } from "./events-agenda";

/**
 * EVENTS — the Profile page's calendar of what falls on each day for the tickers this book holds
 * (#3807 slice 2c; `docs/IA.md` §8: 2c's condition was met AS A CO-LOCATION — the book's events
 * beside the book — never as R&D's board becoming a section). Two parts, beside each other at
 * ≥861 and stacked at ≤860:
 *
 *   the grid    the market calendar (`event-horizon.tsx`, R&D's own instrument) fed ONLY the book's
 *               events — decisions due (▲ in the cell, #3977 slice 4), held and market-wide
 *               (`live/book-events.ts`). Its head IS the page's one range control: on this section
 *               it stands in for the cockpit's (`accounts.tsx`), the same component over the same
 *               root `?on=&span=`, so there is never a second lens row.
 *   the agenda  one row per event in the range, each with ONE link to a place (`events-agenda.tsx`).
 *
 * A PICKED DAY is this section's own param, `?events=YYYY-MM-DD` — it narrows the agenda to that
 * day and leaves the range (which R&D and Trade also read) alone. Two taps from a marked day to the
 * position row: the day, then the row's link.
 *
 * HONEST WHEN THIN: no open positions, nothing dated on what you hold, and a research payload that
 * did not arrive each say so in words; an empty range names the next event on what you hold and
 * moves onto it in one tap (#5045); the footer counts the dated events in range and how few of
 * the calendar's records name a ticker, with R&D one link away for the full board.
 */

/** "in October 2026", "on Sep 28, 2026", "on any date" — the range as a phrase for a sentence. */
function when(range: DayRange, lens: Lens, day: string | undefined): string {
  if (day) return `on ${rangeLabel({ start: day, end: day }, "day")}`;
  if (lens === "all") return "on any date";
  return lens === "day" ? `on ${rangeLabel(range, lens)}` : `in ${rangeLabel(range, lens)}`;
}

/** The grid reads `ResearchEvent`s: the tier rides in the day's title (glyph + word, never hue). */
const asGridEvent = (event: BookEvent): ResearchEvent => ({
  id: event.id,
  title: `${TIER[event.tier].glyph} ${TIER[event.tier].word}: ${event.title}`,
  date: event.date,
  symbols: [],
  researched: event.call !== undefined,
});

/** On one day: what to decide, then what you hold, then market-wide. */
const TIER_ORDER: Record<BookEvent["tier"], number> = { decide: 0, held: 1, market: 2 };

/** "Oct 5 – Oct 11", "October 2026", "Oct 6, 2026" — the range as a label that leads a line. */
function rangeName(range: DayRange, lens: Lens, day: string | undefined): string {
  if (day) return rangeLabel({ start: day, end: day }, "day");
  return lens === "all" ? "Any date" : rangeLabel(range, lens);
}

/**
 * The held tier's honest state in words — never a blank where the rows would be. An empty range
 * leads with the range, in plain words (F-c5ebc986e1), then names the next event on what you hold
 * and moves the range onto it in one tap (#5045): three members met an empty week and read it as
 * "nothing coming" while their prints sat later in the month. The tap is the head's own `?on=`
 * write, so the lens — which R&D and Trade read too — stays theirs. Nothing dated at any time is
 * said without a range.
 */
function HeldNote({
  loading,
  error,
  positions,
  onBook,
  label,
  dated,
  next,
  onJump,
}: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly positions: number;
  /** Decisions due plus held events in view — a decision due is on what you hold too. */
  readonly onBook: number;
  readonly label: string;
  /** Every event on what you hold, at any date; undefined until the calendar can vouch for a 0. */
  readonly dated: number | undefined;
  /** The next one after the range; null when nothing later is dated; undefined when not offered. */
  readonly next: BookEvent | null | undefined;
  readonly onJump: (date: string) => void;
}): ReactElement | null {
  if (loading) return <p className="note">Reading what you hold…</p>;
  if (error)
    return <p className="note">Your positions are unreachable — only market-wide prints show.</p>;
  if (positions === 0)
    return <p className="note">No open positions on this account — market-wide prints only.</p>;
  if (dated === 0) return <p className="note">Nothing dated on what you hold yet.</p>;
  if (onBook > 0) return null;
  return (
    <>
      <p className="note">{label}: nothing on what you hold.</p>
      {next ? (
        <p className="note book-next">
          Next on what you hold:{" "}
          <button type="button" className="book-next-jump" onClick={() => onJump(next.date)}>
            {next.title}
            <span className="book-next-when"> · {dayLabel(next.date)} →</span>
          </button>
        </p>
      ) : next === null ? (
        <p className="note">Nothing later on what you hold is dated yet.</p>
      ) : null}
    </>
  );
}

export function EventsSection({
  desks,
  desksLoading,
  desksError,
  day,
  onPickDay,
}: {
  readonly desks: readonly BookDesk[] | undefined;
  readonly desksLoading: boolean;
  readonly desksError: boolean;
  /** The picked day, `?events=` — undefined when none is. */
  readonly day: string | undefined;
  readonly onPickDay: (day: string | undefined) => void;
}): ReactElement {
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays, retry: false });
  const fog = dayLensFog(plays.data);
  const horizon = useHorizonRange({ fogged: fog.fogged });
  const research = useQuery({ queryKey: ["research-calendar"], queryFn: fetchResearchCalendar });

  const events = research.data?.events ?? [];
  const calls = research.data?.calls ?? [];
  const book = desks ?? [];
  const join = (range: DayRange) =>
    bookEventsIn({ desks: book, events, calls, range, lens: horizon.lens });
  const everything = join(ALL_RANGE);
  const inView = join(day ? { start: day, end: day } : horizon.range);
  const phrase = when(horizon.range, horizon.lens, day);
  // A "none" claim — nothing dated at all, nothing later — waits for the calendar to arrive; an
  // event a position carries on its own (the backstop) can be named before it does.
  const dated = everything.decide.length + everything.held.length;
  const vouched = research.isSuccess;
  const onBook = inView.decide.length + inView.held.length;
  const quiet = !day && onBook === 0;
  const next = quiet ? nextOnBook(everything, horizon.range.end) : undefined;
  const named = events.filter((e) => e.symbols.length > 0).length;
  const rows = [...inView.decide, ...inView.held, ...inView.market].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
  );

  return (
    <section className="book-events" aria-label="Events">
      <h2 className="visually-hidden">Events</h2>
      <EventHorizon
        events={[...everything.decide, ...everything.held, ...everything.market].map(asGridEvent)}
        decideDays={new Set(everything.decide.map((e) => e.date))}
        closures={research.data?.closures.length ? research.data.closures : MARKET_CLOSURES}
        lens={horizon.lens}
        anchor={day ?? horizon.anchor}
        range={horizon.range}
        today={horizon.today}
        pinned={day !== undefined}
        onPick={(date) => onPickDay(date === day ? undefined : date)}
        onLens={horizon.setLens}
        onStep={horizon.step}
        open
        {...(fog.fogged ? { dayFog: { door: fog.door, reason: fog.reason } } : {})}
      />
      <div className="book-agenda">
        <p className="book-tiers">
          {everything.decide.length > 0 ? (
            <>
              <TierMark tier="decide" /> <span className="num">{inView.decide.length}</span>
              {" · "}
            </>
          ) : null}
          <TierMark tier="held" /> <span className="num">{inView.held.length}</span>
          {" · "}
          <TierMark tier="market" /> <span className="num">{inView.market.length}</span>
          {" · "}
          {phrase}
        </p>
        <HeldNote
          loading={desksLoading}
          error={desksError}
          positions={inView.positions}
          onBook={onBook}
          label={rangeName(horizon.range, horizon.lens, day)}
          dated={dated > 0 || vouched ? dated : undefined}
          next={next ?? (quiet && vouched ? null : undefined)}
          onJump={horizon.setOn}
        />
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
        <p className="agenda-foot">
          <span className="num">{rows.length}</span> dated {rows.length === 1 ? "event" : "events"}{" "}
          on this book {phrase}. Coverage is thin:{" "}
          {research.data ? (
            <>
              <span className="num">{named}</span> of{" "}
              <span className="num">{events.length.toLocaleString("en-US")}</span> dated records on
              the calendar name a ticker.
            </>
          ) : (
            "few dated records on the calendar name a ticker."
          )}{" "}
          <Link to="/research" className="agenda-foot-link">
            The full board on R&amp;D →
          </Link>
        </p>
      </div>
    </section>
  );
}
