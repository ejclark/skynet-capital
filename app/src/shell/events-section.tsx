import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { type BookDesk, type BookEvent, bookEventsIn } from "../live/book-events";
import { dayLensFog } from "../live/fog";
import { useHorizonRange } from "../live/horizon-params";
import { ALL_RANGE, type DayRange, rangeLabel } from "../live/horizon-range";
import { fetchPlays } from "../live/options";
import { fetchResearch, type Lens, type ResearchEvent } from "../live/research";
import { EventHorizon } from "./event-horizon";
import { AgendaRow, TIER, TierMark } from "./events-agenda";

/**
 * EVENTS — the Profile page's calendar of what falls on each day for the tickers this book holds
 * (#3807 slice 2c; `docs/IA.md` §8: 2c's condition was met AS A CO-LOCATION — the book's events
 * beside the book — never as R&D's board becoming a section). Two parts, beside each other at
 * ≥861 and stacked at ≤860:
 *
 *   the grid    the market calendar (`event-horizon.tsx`, R&D's own instrument) fed ONLY the book's
 *               events — held and market-wide (`live/book-events.ts`). Its head IS the page's one
 *               range control: on this section it stands in for the cockpit's (`accounts.tsx`), the
 *               same component over the same root `?on=&span=`, so there is never a second lens row.
 *   the agenda  one row per event in the range, each with ONE link to a place (`events-agenda.tsx`).
 *
 * A PICKED DAY is this section's own param, `?events=YYYY-MM-DD` — it narrows the agenda to that
 * day and leaves the range (which R&D and Trade also read) alone. Two taps from a marked day to the
 * position row: the day, then the row's link.
 *
 * HONEST WHEN THIN: no open positions, nothing dated on what you hold, and a research payload that
 * did not arrive each say so in words; the footer counts the dated events in range and how few of
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

/** The held tier's honest state in words — never a blank where the rows would be. */
function HeldNote({
  loading,
  error,
  positions,
  held,
  phrase,
}: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly positions: number;
  readonly held: number;
  readonly phrase: string;
}): ReactElement | null {
  if (loading) return <p className="note">Reading what you hold…</p>;
  if (error)
    return <p className="note">Your positions are unreachable — only market-wide prints show.</p>;
  if (positions === 0)
    return <p className="note">No open positions on this account — market-wide prints only.</p>;
  if (held === 0) return <p className="note">Nothing dated on what you hold {phrase}.</p>;
  return null;
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
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch });

  const events = research.data?.events ?? [];
  const calls = research.data?.calls ?? [];
  const book = desks ?? [];
  const join = (range: DayRange) =>
    bookEventsIn({ desks: book, events, calls, range, lens: horizon.lens });
  const everything = join(ALL_RANGE);
  const inView = join(day ? { start: day, end: day } : horizon.range);
  const phrase = when(horizon.range, horizon.lens, day);
  const named = events.filter((e) => e.symbols.length > 0).length;
  const rows = [...inView.held, ...inView.market].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.tier === "held" ? -1 : 1,
  );

  return (
    <section className="book-events" aria-label="Events">
      <h2 className="visually-hidden">Events</h2>
      <EventHorizon
        events={[...everything.held, ...everything.market].map(asGridEvent)}
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
          held={inView.held.length}
          phrase={phrase}
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
