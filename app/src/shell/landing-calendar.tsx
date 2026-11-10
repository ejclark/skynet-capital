import type { ReactElement, ReactNode } from "react";
import { CALENDAR_ANCHOR, editionEventKey, eventAnchor } from "../../../src/domain/edition-keys";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { dayLabel } from "../live/book-events";
import {
  type CalendarDay,
  type CalendarWeek,
  calendarDays,
  calendarWeeks,
  datesIn,
  type Edition,
  type EditionDate,
  type EditionStory,
  planningDay,
  waitingOn,
} from "../live/edition";
import { useHorizonRange } from "../live/horizon-params";
import { type DayRange, rangeFor, rangeLabel, stepAnchor } from "../live/horizon-range";
import type { Lens } from "../live/research";
import { CalendarGrid, ClosedKey, type DayMark, WAITS_GLYPH } from "./calendar-grid";
import { CalendarHead, headLine } from "./calendar-head";
import { EditionStoryLine } from "./edition-story";
import { usePhoneWidth } from "./use-media";

/**
 * THE LANDING PAGE'S CALENDAR IS R&D'S (#7077 slice 1d, AT10 and AT11). Eric, live on /app/
 * (2026-11-09): "This feels like a ripe opportunity to revive our calendar widget that walks through
 * event timelines." So the page carries the market calendar's own parts, never a second calendar:
 *   - the head (`calendar-head.tsx`): ‹ › step the range, the range in words with its sessions, and
 *     the Day · Week · Month lens. NOTHING IS FOGGED HERE: R&D holds the day lens behind rung 501,
 *     but fog withholds a capability, never information (docs/FOG-OF-WAR.md), and on this page the
 *     day lens only narrows a list of public dates;
 *   - the rows: the edition's one-liners (AT4), under week headers that name closures (AT5b), ◆ on
 *     an event a story waits on (AT5). The range picks which coming dates show; the edition's
 *     stories always lead under their own week, because they are the news, not a date to step to;
 *   - at desktop width, R&D's month grid beside the rows (`calendar-grid.tsx`, AT11), the range
 *     banded and each day's events marked, ◆ where a story waits. At 390 the rows are the whole
 *     calendar: desktop adds room, never a new concept (`.claude/rules/member-surfaces.md`).
 *
 * The range is the app's one range, `?on=&span=` on the root route (`live/horizon-params.ts`), so the
 * week stepped to here is the week R&D and Trade open on. With none pinned, it is the week ahead on a
 * weekend (`planningDay`). An empty range says so and names the next date, one tap away.
 *
 * Replaces `edition-calendar.tsx` (#7144), the second calendar whose classes had to be prefixed
 * `ecal-` to keep clear of R&D's; the rows keep that prefix, the head and the grid are R&D's own.
 *
 * Moneypenny's anchors carried over (#7167): each event row's `event-<key>`, the section's
 * `calendar`, and the story rows' `story-<id>` (in `edition-story.tsx`). Only events in the selected
 * range have a row, so the landing page publishes only those keys (`calendarShows`, shared with
 * `routes/index.tsx`). `app/tests/shell/edition-anchor.spec.tsx` fails if the page drops them.
 */

const LANDING_LENSES: readonly Lens[] = ["day", "week", "month"];

const STATUS: Readonly<Record<EditionDate["status"], { glyph: string; word: string }>> = {
  confirmed: { glyph: "⬢", word: "Date confirmed by its publisher" },
  estimate: { glyph: "⬡", word: "Date estimated from its usual timing" },
};

/** What an event's row carries below its details: its ask and its side thread (#7167 criterion 11). */
type EventAsk = (event: EditionDate) => ReactNode;

function EventLine({
  event,
  stories,
  eventAsk,
}: {
  readonly event: EditionDate;
  readonly stories: readonly EditionStory[];
  readonly eventAsk?: EventAsk;
}): ReactElement {
  const waiting = waitingOn(event, stories);
  const status = STATUS[event.status];
  return (
    <li id={eventAnchor(editionEventKey(event))} className="ecal-event">
      <details className="story-row">
        <summary className="ecal-line">
          <span className="ecal-mark">
            {waiting.length > 0 ? (
              <span className="ecal-waits" role="img" aria-label="a story waits on it">
                {WAITS_GLYPH}
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
              {WAITS_GLYPH} Waiting on it: {waiting.map((s) => s.line).join(" · ")}
            </p>
          ) : null}
          {eventAsk?.(event)}
        </div>
      </details>
    </li>
  );
}

function Day({
  day,
  today,
  stories,
  eventAsk,
}: {
  readonly day: CalendarDay;
  readonly today: string;
  readonly stories: readonly EditionStory[];
  readonly eventAsk?: EventAsk;
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
          <EventLine key={`${e.date}-${e.what}`} event={e} stories={stories} eventAsk={eventAsk} />
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
  eventAsk,
}: {
  readonly week: CalendarWeek;
  readonly edition: Edition;
  readonly today: string;
  readonly storyAsk: (story: EditionStory) => ReactNode;
  readonly eventAsk?: EventAsk;
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
          <Day key={d.date} day={d} today={today} stories={edition.stories} eventAsk={eventAsk} />
        ))}
      </ol>
    </li>
  );
}

/** Each coming date's mark on the grid: ◆ when a story waits on one of the day's events. */
function gridMarks(edition: Edition): ReadonlyMap<string, DayMark> {
  const marks = new Map<string, DayMark>();
  for (const event of edition.next) {
    const prev = marks.get(event.date);
    const waits = waitingOn(event, edition.stories).length > 0;
    marks.set(event.date, {
      titles: [...(prev?.titles ?? []), event.what],
      glyph: prev?.glyph === "waits" || waits ? "waits" : "dot",
    });
  }
  return marks;
}

/** Brings a picked day's rows into view, when the range shows them. */
function scrollToDay(date: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(`ecal-day-${date}`);
  if (!el) return;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  el.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
}

/**
 * The range the calendar shows and the coming dates inside it. One function, so the rows drawn and
 * the keys the page publishes to Moneypenny (`routes/index.tsx`) can't disagree.
 */
export function calendarShows(
  edition: Edition,
  today: string,
  horizon: Pick<ReturnType<typeof useHorizonRange>, "lens" | "pinned" | "anchor">,
): {
  readonly anchor: string;
  readonly range: DayRange;
  readonly inside: readonly EditionDate[];
  readonly after: EditionDate | undefined;
} {
  const anchor = horizon.pinned ? horizon.anchor : planningDay(today);
  const range = rangeFor(anchor, horizon.lens);
  return { anchor, range, ...datesIn(edition.next, range) };
}

export function LandingCalendar({
  edition,
  today,
  storyAsk,
  eventAsk,
}: {
  readonly edition: Edition;
  /** The exchange's today, as the server cut the edition's passed dates against it. */
  readonly today: string;
  /** A story's asks, drawn inside it once opened (slice 2). */
  readonly storyAsk: (story: EditionStory) => ReactNode;
  /** An event's ask and side thread, drawn under its details once opened (#7167 criterion 11). */
  readonly eventAsk?: EventAsk;
}): ReactElement {
  const phone = usePhoneWidth();
  const horizon = useHorizonRange();
  const lens = horizon.lens;
  const { anchor, range, inside, after } = calendarShows(edition, today, horizon);
  const weeks = calendarWeeks(edition.date, calendarDays(inside), today);
  // No lens pressed is the all lens (`calendar-head.tsx`): every coming date, counted.
  const all = { name: "Every coming date", count: `${String(edition.next.length)} dated` };
  const words = (date: string): string =>
    headLine({ lens, range: rangeFor(date, lens), closures: MARKET_CLOSURES, all }).name;
  const month = rangeLabel(rangeFor(anchor, "month"), "month");

  const heading = (
    <div className="ecal-head">
      <h2 id="ecal-title" className="section-title">
        The calendar
      </h2>
      <span className="ecal-key">
        <span aria-hidden="true">{WAITS_GLYPH}</span> a story waits on it
      </span>
    </div>
  );

  return (
    <section id={CALENDAR_ANCHOR} className="ecal" aria-labelledby="ecal-title">
      <div className="cal-head ecal-cal-head">
        <CalendarHead
          lens={lens}
          range={range}
          closures={MARKET_CLOSURES}
          all={all}
          lenses={LANDING_LENSES}
          heading={heading}
          onStep={(direction) => horizon.setOn(stepAnchor(anchor, lens, direction))}
          onLens={(next) => horizon.setLens(next)}
        />
      </div>
      <div className="ecal-body">
        <div className="ecal-agenda">
          <ol className="ecal-weeks">
            {weeks.map((w) => (
              <Week
                key={w.monday}
                week={w}
                edition={edition}
                today={today}
                storyAsk={storyAsk}
                eventAsk={eventAsk}
              />
            ))}
          </ol>
          {inside.length === 0 ? (
            <div className="ecal-empty">
              <p className="note">
                Nothing on the edition's calendar{lens === "all" ? "" : ` in ${words(anchor)}`}.
              </p>
              {after ? (
                <button
                  type="button"
                  className="ecal-jump"
                  onClick={() => horizon.setOn(after.date)}
                >
                  Next: {after.what}, {dayLabel(after.date)}. Move to {words(after.date)} ›
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {phone ? null : (
          <div className="ecal-grid">
            <CalendarGrid
              month={anchor.slice(0, 7)}
              lens={lens}
              range={range}
              today={today}
              closures={MARKET_CLOSURES}
              marks={gridMarks(edition)}
              picked={horizon.pinned ? anchor : undefined}
              label={`${month}, each day's events marked`}
              legend={
                <>
                  <span className="eh-waits">{WAITS_GLYPH}</span> a story waits on it ·{" "}
                  <i className="eh-dot" /> dated · <ClosedKey />
                </>
              }
              onPick={(date) => {
                horizon.setOn(date);
                scrollToDay(date);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
