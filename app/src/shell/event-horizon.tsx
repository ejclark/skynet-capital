import type { ReactElement } from "react";
import { useState } from "react";
import type { ResearchEvent } from "../live/research";

/**
 * THE EVENT HORIZON (#738, rail-controls round — Eric: "view template shift controls to the left
 * rail... research can move the calendar control/filter to the left rail to drive the view").
 * A compact month calendar in the rail: dots mark event days (filled when a ledger exists),
 * clicking a day pins `on:YYYY-MM-DD` into the page's ONE query model — the rail drives the
 * view, the URL keeps the state, and typing the same token by hand works identically.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** "YYYY-MM" of the month `offset` months after the first event month (or today's). */
function monthKey(base: string, offset: number): string {
  const [y, m] = base.split("-").map(Number);
  const d = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + offset, 1));
  return d.toISOString().slice(0, 7);
}

function monthLabel(key: string): string {
  return new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

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

/** @category hero */
export function EventHorizon({
  events,
  selected,
  onPick,
}: {
  readonly events: readonly ResearchEvent[];
  readonly selected?: string;
  readonly onPick: (date: string) => void;
}): ReactElement | null {
  const firstMonth = (selected ?? events[0]?.date ?? new Date().toISOString()).slice(0, 7);
  const [offset, setOffset] = useState(0);
  if (events.length === 0) return null;

  const month = monthKey(firstMonth, offset);
  const byDate = new Map<string, ResearchEvent[]>();
  for (const event of events) {
    byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  }
  const lastMonth = (events[events.length - 1]?.date ?? month).slice(0, 7);

  return (
    <div className="eh">
      <p className="rail-label">Event horizon</p>
      <div className="eh-head">
        <button
          type="button"
          className="eh-nav"
          aria-label="Previous month"
          disabled={offset <= 0}
          onClick={() => setOffset(offset - 1)}
        >
          ‹
        </button>
        <span className="eh-month">{monthLabel(month)}</span>
        <button
          type="button"
          className="eh-nav"
          aria-label="Next month"
          disabled={month >= lastMonth}
          onClick={() => setOffset(offset + 1)}
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
        {monthDays(month).map((date, i) =>
          date === null ? (
            <span key={`pad-${String(i)}`} />
          ) : (
            <button
              key={date}
              type="button"
              className="eh-day"
              aria-pressed={selected === date}
              disabled={!byDate.has(date)}
              title={byDate
                .get(date)
                ?.map((e) => e.title)
                .join(" · ")}
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
          ),
        )}
      </div>
      <p className="eh-legend">
        <i className="eh-dot eh-hot" /> researched · <i className="eh-dot" /> dated
      </p>
      {selected ? (
        <button type="button" className="eh-clear" onClick={() => onPick(selected)}>
          Clear {selected} ×
        </button>
      ) : null}
    </div>
  );
}
