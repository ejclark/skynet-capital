import type { ReactElement, ReactNode } from "react";
import { dayLabel } from "../live/book-events";
import {
  type CalendarDay,
  type CalendarWeek,
  calendarDays,
  calendarWeeks,
  type Edition,
  type EditionDate,
  type EditionStory,
  waitingOn,
} from "../live/edition";
import { EditionStoryLine } from "./edition-story";

/**
 * THE PAGE'S SPINE: A VERTICAL CALENDAR OF ONE-LINERS (#7077 slice 1b; #7018 round 3). Eric: "If
 * we're able to compact this to one liners, we'd be able to leverage/integrate a vertical calendar
 * format. The line items also offer the ability for progressive disclosure to expand on details
 * below the fold." He picked More on "Today, then the days" (the members' pick, 3 of 3) and Not on
 * the week strip. So, below the sectors (AT5):
 *   - the edition's week first: each story one line, closed until tapped (AT4);
 *   - then each coming trading day, in order, with its dated events one line each.
 * An event a story waits on (it is among that story's reports) carries ◆, keyed in the header; the
 * opened event names the stories waiting. Confirmed and estimated dates keep the ⬢ ⬡ the Events and
 * R&D calendars already speak.
 *
 * WEEK HEADERS (slice 1c, AT5b): the days sit under "This week · Mon 9 – Fri 13", "Next week · Mon 16 –
 * Fri 20", each naming the market's closures and early closes that week, so a member planning around
 * Thanksgiving sees the shut day before the days themselves. Dates run down the page, never across.
 * Slice 1d replaces this component with R&D's market calendar (AT10); `calendarWeeks` is the part
 * that carries over.
 */

const DIAMOND = "◆";

const STATUS: Readonly<Record<EditionDate["status"], { glyph: string; word: string }>> = {
  confirmed: { glyph: "⬢", word: "Date confirmed by its publisher" },
  estimate: { glyph: "⬡", word: "Date estimated from its usual timing" },
};

function EventLine({
  event,
  stories,
}: {
  readonly event: EditionDate;
  readonly stories: readonly EditionStory[];
}): ReactElement {
  const waiting = waitingOn(event, stories);
  const status = STATUS[event.status];
  return (
    <li className="ecal-event">
      <details className="story-row">
        <summary className="ecal-line">
          <span className="ecal-mark">
            {waiting.length > 0 ? (
              <span className="ecal-waits" role="img" aria-label="a story waits on it">
                {DIAMOND}
              </span>
            ) : null}
          </span>
          <span className="ecal-text">{event.what}</span>
          {/* Always drawn, so the chevron keeps its column; an estimated date says so while closed. */}
          <span className="ecal-figure num">
            {[event.when, event.status === "estimate" ? "estimate" : undefined]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </summary>
        <div className="ecal-detail">
          <p>{event.what}</p>
          <p className="ecal-status">
            <span role="img" aria-label={status.word}>
              {status.glyph}
            </span>{" "}
            {status.word}
            {event.when ? ` · ${event.when}` : ""}
          </p>
          {waiting.length > 0 ? (
            <p className="ecal-status">
              {DIAMOND} Waiting on it: {waiting.map((s) => s.line).join(" · ")}
            </p>
          ) : null}
        </div>
      </details>
    </li>
  );
}

function Day({
  day,
  today,
  stories,
}: {
  readonly day: CalendarDay;
  readonly today: string;
  readonly stories: readonly EditionStory[];
}): ReactElement {
  const id = `ecal-day-${day.date}`;
  return (
    <li className="ecal-day">
      <h4 id={id} className="ecal-day-title">
        {dayLabel(day.date)}
        {day.date === today ? " · today" : ""}
      </h4>
      <ul className="ecal-lines" aria-labelledby={id}>
        {day.events.map((e) => (
          <EventLine key={`${e.date}-${e.what}`} event={e} stories={stories} />
        ))}
      </ul>
    </li>
  );
}

function Week({
  week,
  edition,
  today,
  storyAsk,
}: {
  readonly week: CalendarWeek;
  readonly edition: Edition;
  readonly today: string;
  readonly storyAsk: (story: EditionStory) => ReactNode;
}): ReactElement {
  const id = `ecal-week-${week.monday}`;
  return (
    <li className="ecal-week">
      <h3 id={id} className="ecal-week-title">
        {week.title}
      </h3>
      {week.closures.length > 0 ? (
        <ul className="ecal-closures" aria-label="Market closures this week">
          {week.closures.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
      <ol className="ecal-days" aria-labelledby={id}>
        {week.stories ? (
          <li className="ecal-day">
            <h4 id="ecal-stories" className="ecal-day-title">
              The stories, to the {dayLabel(edition.date)} close
            </h4>
            <ul className="ecal-lines" aria-labelledby="ecal-stories">
              {edition.stories.map((s, i) => (
                <EditionStoryLine key={s.id} story={s} lead={i === 0}>
                  {storyAsk(s)}
                </EditionStoryLine>
              ))}
            </ul>
          </li>
        ) : null}
        {week.days.map((d) => (
          <Day key={d.date} day={d} today={today} stories={edition.stories} />
        ))}
      </ol>
    </li>
  );
}

export function EditionCalendar({
  edition,
  today,
  storyAsk,
}: {
  readonly edition: Edition;
  readonly today: string;
  /** A story's asks, drawn inside it once opened (slice 2). */
  readonly storyAsk: (story: EditionStory) => ReactNode;
}): ReactElement {
  const weeks = calendarWeeks(edition.date, calendarDays(edition.next), today);
  return (
    <section className="ecal" aria-labelledby="ecal-title">
      <div className="ecal-head">
        <h2 id="ecal-title" className="section-title">
          The calendar
        </h2>
        <span className="ecal-key">
          <span aria-hidden="true">{DIAMOND}</span> a story waits on it
        </span>
      </div>
      <ol className="ecal-weeks">
        {weeks.map((w) => (
          <Week key={w.monday} week={w} edition={edition} today={today} storyAsk={storyAsk} />
        ))}
      </ol>
    </section>
  );
}
