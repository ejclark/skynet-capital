import type { ReactElement } from "react";
import {
  type DayRange,
  daysOf,
  type MarketClosure,
  rangeLabel,
  sessionsIn,
} from "../live/horizon-range";
import type { ResearchEvent } from "../live/research";
import { LENSES, type Lens } from "../live/research";

/**
 * THE EVENT HORIZON (#738, rail-controls round — Eric: "view template shift controls to the left
 * rail... research can move the calendar control/filter to the left rail to drive the view").
 * A compact month calendar in the rail: dots mark event days (filled when a ledger exists);
 * clicking a day pins `on:YYYY-MM-DD` into the page's ONE query model — the rail drives the
 * view, the URL keeps the state, and typing the same token by hand works identically.
 *
 * THE LENS ROW (#1704 slice 2, Eric's brief): four lenses under the grid — day · week · month ·
 * quarter. The lens picks the RANGE around the anchor day (shaded on the grid) and the arrows
 * step by that duration; the head names the range and counts its sessions, so Labor Day week
 * reads "4 sessions" — theta decays an extra day. Weekdays the exchange is closed are coloured
 * and carry the reason. Every day is pickable now: a day with no event is a fine anchor for a
 * week, and a disabled day with nothing behind it was noise, not fog (docs/FOG-OF-WAR.md).
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const LENS_NAME: Record<Lens, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The month's grid as ISO dates, padded with nulls to Monday-first weeks. */
function monthDays(key: string): (string | null)[] {
  const first = new Date(`${key}-01T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const days: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let t = first.getTime(); new Date(t).toISOString().slice(0, 7) === key; t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

const isWeekend = (iso: string): boolean => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/** @category hero */
export function EventHorizon({
  events,
  closures,
  lens,
  anchor,
  range,
  today,
  pinned,
  onPick,
  onLens,
  onStep,
  dayFog,
}: {
  readonly events: readonly ResearchEvent[];
  readonly closures: readonly MarketClosure[];
  readonly lens: Lens;
  /** The day the range is built around — the `on:` token, or today when none is pinned. */
  readonly anchor: string;
  readonly range: DayRange;
  readonly today: string;
  /** Whether `anchor` came from the query (true) or defaulted to today (false). */
  readonly pinned: boolean;
  readonly onPick: (date: string) => void;
  readonly onLens: (lens: Lens) => void;
  readonly onStep: (direction: 1 | -1) => void;
  /** The day lens's fog (docs/FOG-OF-WAR.md): the door's label and how many calls sit behind it. */
  readonly dayFog?: { readonly reason: string; readonly held: number };
}): ReactElement | null {
  const month = anchor.slice(0, 7);
  const byDate = new Map<string, ResearchEvent[]>();
  for (const event of events) {
    byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  }
  const closedOn = new Map(closures.map((c) => [c.date, c] as const));
  const sessions = sessionsIn(range, closures);
  const rangeDays = new Set(daysOf(range));

  const titleFor = (date: string): string | undefined => {
    const parts = [
      closedOn.get(date)?.reason,
      ...(byDate.get(date)?.map((e) => e.title) ?? []),
    ].filter((p): p is string => Boolean(p));
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  return (
    <div className="eh">
      <p className="rail-label">Event horizon</p>
      <div className="eh-head">
        <button
          type="button"
          className="eh-nav"
          aria-label={`Previous ${lens}`}
          onClick={() => onStep(-1)}
        >
          ‹
        </button>
        <span className="eh-month">
          <span className="eh-range">{rangeLabel(range, lens)}</span>
          <span className="eh-sessions num">
            {sessions} {sessions === 1 ? "session" : "sessions"}
          </span>
        </span>
        <button
          type="button"
          className="eh-nav"
          aria-label={`Next ${lens}`}
          onClick={() => onStep(1)}
        >
          ›
        </button>
      </div>
      <div className="eh-grid">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}${String(i)}`} className="eh-wd" aria-hidden="true">
            {d}
          </span>
        ))}
        {monthDays(month).map((date, i) => {
          if (date === null) return <span key={`pad-${String(i)}`} />;
          const closure = closedOn.get(date);
          const className = [
            "eh-day",
            rangeDays.has(date) ? "eh-in-range" : "",
            date === today ? "eh-today" : "",
            closure && !closure.early ? "eh-closed" : "",
            closure?.early ? "eh-early" : "",
            isWeekend(date) ? "eh-weekend" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={date}
              type="button"
              className={className}
              aria-pressed={pinned && anchor === date}
              title={titleFor(date)}
              onClick={() => onPick(date)}
            >
              {Number(date.slice(8, 10))}
              {byDate.has(date) ? (
                <i
                  className={
                    byDate.get(date)?.some((e) => e.researched) ? "eh-dot eh-hot" : "eh-dot"
                  }
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <fieldset className="eh-lenses">
        <legend className="visually-hidden">Lens</legend>
        {LENSES.map((option) => {
          const fogged = option === "day" && dayFog !== undefined;
          return (
            <button
              key={option}
              type="button"
              className="eh-lens"
              aria-pressed={option === lens}
              disabled={fogged}
              title={fogged ? dayFog.reason : undefined}
              onClick={() => onLens(option)}
            >
              {LENS_NAME[option]}
              {fogged ? (
                <span className="eh-lens-lock" aria-hidden="true">
                  ◷
                </span>
              ) : null}
            </button>
          );
        })}
      </fieldset>
      {dayFog ? (
        <p className="eh-fog">
          Day lens held until rung 501 (zero-DTE) — <span className="num">{dayFog.held}</span>{" "}
          {dayFog.held === 1 ? "call" : "calls"} in range behind it.
        </p>
      ) : null}
      <p className="eh-legend">
        <i className="eh-dot eh-hot" /> researched · <i className="eh-dot" /> dated ·{" "}
        <i className="eh-swatch eh-swatch-closed" /> closed
      </p>
      {pinned ? (
        <button type="button" className="eh-clear" onClick={() => onPick(anchor)}>
          Clear {anchor} ×
        </button>
      ) : null}
    </div>
  );
}
