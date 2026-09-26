import type { ReactElement } from "react";
import {
  addDays,
  type DayRange,
  daysOf,
  type FiscalQuarterLabel,
  type MarketClosure,
  rangeLabel,
} from "../live/horizon-range";
import type { Lens, ResearchEvent } from "../live/research";
import { CalendarHead, type DayFog } from "./calendar-head";

/**
 * THE EVENT HORIZON (#738, rail-controls round — Eric: "view template shift controls to the left
 * rail... research can move the calendar control/filter to the left rail to drive the view").
 * A compact month calendar: dots mark event days (filled when a ledger exists); clicking a day
 * pins `?on=YYYY-MM-DD` — the calendar drives the view, the URL keeps the state, and typing
 * `on:YYYY-MM-DD` into the filter box lands on the same URL (one model, two carriers).
 *
 * THE BAND HEAD (#3807 slice 2a — the rail left the frame): R&D's calendar leads its stage as one
 * row — the head and the lens row from `calendar-head.tsx` (the same markup the Profile page's
 * cockpit head renders) — with the month grid FOLDED beneath it. The IA's target is a popover at
 * ≥861 and a bottom sheet at ≤860, never in flow; no popover or sheet primitive exists in the shell
 * yet, so this slice folds the grid into a plain disclosure (`<details>`) at every width, and the
 * pinned day's "Clear" stays on the row where the fold cannot hide it. Falsifier: a member on the
 * live route cannot find the grid behind the fold (a crawl step that picks a day fails, or Eric
 * asks where the calendar went) — then the fold opens by default until the popover lands. The range is root URL state (`live/horizon-params.ts`, `?on=&span=`), so
 * the day picked here is the day the whole app reads. The lens picks the RANGE around the anchor
 * day (shaded on the grid) and the arrows step by that duration (#1704 slice 2). Weekdays the
 * exchange is closed are hatched and struck (never hue alone — docs/BRAND.md → Accessibility)
 * and carry the reason. Every day is pickable now: a day with no event is a fine anchor for a
 * week, and a disabled day with nothing behind it was noise, not fog (docs/FOG-OF-WAR.md).
 *
 * THE ALL LENS HAS NO BUTTON: tapping the pressed lens again clears it, and no lens pressed IS
 * `span=all` — every ledger in view (Eric, 2026-09-06: a fifth pill "getting pushed below has a
 * clunky feel. couldn't the toggle cluster… be deselectable which implicitly enable ALL records to
 * show?"). The head names the state — "all research · N events" — so the empty cluster reads.
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The month's grid as ISO dates in complete Monday-first rows: the days before the 1st and after
 * the last day come from the neighbouring months (OUTSIDE DAYS), so a week that straddles a month
 * boundary is still one full row — Eric, 2026-09-06: "week view should show a full row, even when
 * the days are listed in different months. other visual feedback should make this obvious and
 * verifiable to which month it belongs." The cell dims an outside day and tags every 1st with its
 * month, so the boundary reads at a glance.
 */
function monthGrid(key: string): string[] {
  const first = new Date(`${key}-01T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const start = first.getTime() - lead * DAY_MS;
  const days: string[] = [];
  for (
    let t = start;
    days.length < lead || new Date(t).toISOString().slice(0, 7) <= key;
    t += DAY_MS
  ) {
    const iso = new Date(t).toISOString().slice(0, 10);
    if (days.length >= lead && iso.slice(0, 7) > key) break;
    days.push(iso);
  }
  while (days.length % 7 !== 0) days.push(addDays(days[days.length - 1] as string, 1));
  return days;
}

const MONTH_TAGS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const isWeekend = (iso: string): boolean => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/**
 * COMMON REGION (docs/BRAND.md → Visual grammar): "in range" is a fact about the week, so it is
 * drawn as ONE band per row — a cell is band-start/band-end where the band begins or ends on its
 * row — never as seven outlined cells (Tufte's 1 + 1 = 3). At the month and quarter lenses every
 * visible day is in range, so the caller passes `inRange: false` and the grid itself is the region.
 * Weekends and full closures share the dimmed inactive state; a closure keeps its strike.
 */
function dayClassName({
  date,
  column,
  inRange,
  rangeDays,
  today,
  closure,
}: {
  readonly date: string;
  readonly column: number;
  readonly inRange: boolean;
  readonly rangeDays: ReadonlySet<string>;
  readonly today: string;
  readonly closure: MarketClosure | undefined;
}): string {
  const bandStart = inRange && (column === 0 || !rangeDays.has(addDays(date, -1)));
  const bandEnd = inRange && (column === 6 || !rangeDays.has(addDays(date, 1)));
  return [
    "eh-day",
    inRange ? "eh-band" : "",
    bandStart ? "eh-band-start" : "",
    bandEnd ? "eh-band-end" : "",
    date === today ? "eh-today" : "",
    closure && !closure.early ? "eh-closed" : "",
    closure?.early ? "eh-early" : "",
    isWeekend(date) ? "eh-weekend" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

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
  fiscal,
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
  /** The day lens's fog (docs/FOG-OF-WAR.md): the door, its why, and how many calls sit behind it. */
  readonly dayFog?: DayFog;
  /** The quarter lens's fiscal identity (#1736) — set only when exactly one symbol is in scope
   *  and has a confirmed fiscal year-end; absent, the quarter lens reads (and is) the calendar. */
  readonly fiscal?: FiscalQuarterLabel;
}): ReactElement | null {
  const month = anchor.slice(0, 7);
  const allLens = lens === "all";
  const blockLens = lens === "month" || lens === "quarter";
  const byDate = new Map<string, ResearchEvent[]>();
  for (const event of events) {
    byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  }
  const closedOn = new Map(closures.map((c) => [c.date, c] as const));
  const rangeDays = new Set(allLens ? [] : daysOf(range));

  const titleFor = (date: string): string | undefined => {
    const parts = [
      closedOn.get(date)?.reason,
      ...(byDate.get(date)?.map((e) => e.title) ?? []),
    ].filter((p): p is string => Boolean(p));
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  return (
    <section className="cal-head rx-band" aria-label="Market calendar">
      <CalendarHead
        lens={lens}
        range={range}
        closures={closures}
        all={{
          name: rangeLabel(range, "all"),
          count: `${String(events.length)} ${events.length === 1 ? "event" : "events"}`,
        }}
        onLens={onLens}
        onStep={onStep}
        {...(fiscal ? { fiscal } : {})}
        {...(dayFog ? { dayFog } : {})}
      />
      {pinned ? (
        <button type="button" className="eh-clear" onClick={() => onPick(anchor)}>
          Clear {anchor} ×
        </button>
      ) : null}
      <details className="eh-fold">
        <summary className="eh-fold-toggle">Month · pick a day</summary>
        <div className="eh">
          <div className={blockLens ? "eh-grid eh-block" : "eh-grid"}>
            {WEEKDAYS.map((d, i) => (
              <span key={`${d}${String(i)}`} className="eh-wd" aria-hidden="true">
                {d}
              </span>
            ))}
            {monthGrid(month).map((date, i) => {
              const closure = closedOn.get(date);
              const outside = date.slice(0, 7) !== month;
              const className = `${dayClassName({
                date,
                column: i % 7,
                inRange: !blockLens && rangeDays.has(date),
                rangeDays,
                today,
                closure,
              })}${outside ? " eh-outside" : ""}`;
              return (
                <button
                  key={date}
                  type="button"
                  className={className}
                  aria-pressed={pinned && anchor === date}
                  title={titleFor(date)}
                  onClick={() => onPick(date)}
                >
                  {date.endsWith("-01") ? (
                    <span className="eh-month-tag" aria-hidden="true">
                      {MONTH_TAGS[Number(date.slice(5, 7)) - 1]}
                    </span>
                  ) : null}
                  <span className="eh-num">{Number(date.slice(8, 10))}</span>
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
          <p className="eh-legend">
            <i className="eh-dot eh-hot" /> researched · <i className="eh-dot" /> dated ·{" "}
            <s className="eh-legend-closed num">7</s> closed
          </p>
        </div>
      </details>
    </section>
  );
}
