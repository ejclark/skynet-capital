import type { ReactElement, ReactNode } from "react";
import { addDays, type DayRange, daysOf, type MarketClosure } from "../live/horizon-range";
import type { Lens } from "../live/research";

/**
 * THE MARKET CALENDAR'S MONTH GRID — extracted from `event-horizon.tsx` (#7077 AT10, AT11) so ONE
 * grid draws on R&D, the Profile page's Events section and the landing page. Each caller says what
 * marks a day (`marks`) and what the legend reads; the grid owns the shape: complete Monday-first
 * rows, the range as one band per row, closures hatched and struck, outside days dimmed.
 *
 * OUTSIDE DAYS: the days before the 1st and after the last day come from the neighbouring months, so
 * a week that straddles a month boundary is still one full row — Eric, 2026-09-06: "week view should
 * show a full row, even when the days are listed in different months. other visual feedback should
 * make this obvious and verifiable to which month it belongs." The cell dims an outside day and tags
 * every 1st with its month, so the boundary reads at a glance.
 *
 * COMMON REGION (docs/BRAND.md → Visual grammar): "in range" is a fact about the week, so it is drawn
 * as ONE band per row — a cell is band-start/band-end where the band begins or ends on its row —
 * never as seven outlined cells (Tufte's 1 + 1 = 3). At the month and quarter lenses every visible day
 * is in range, so the grid itself is the region. Weekends and full closures share the dimmed inactive
 * state; a closure keeps its strike (never hue alone — docs/BRAND.md → Accessibility).
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

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

/** The month's grid as ISO dates in complete Monday-first rows, outside days included. */
export function monthGrid(key: string): string[] {
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

const isWeekend = (iso: string): boolean => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

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

/** What a day's cell carries: its events' titles (the cell's `title`) and the shape that marks it —
 *  a dot (dated), a filled dot (researched, R&D) or ◆ (a story waits on it, the landing page). */
export interface DayMark {
  readonly titles: readonly string[];
  readonly glyph: "dot" | "hot" | "waits";
}

/** The ◆ a story waits on, drawn in a cell and in a legend. */
export const WAITS_GLYPH = "◆";

/** The legend's key for a closed day: a struck number, as the grid draws one. */
export function ClosedKey(): ReactElement {
  return (
    <>
      <s className="eh-legend-closed num">7</s> closed
    </>
  );
}

/** @category hero */
export function CalendarGrid({
  month,
  lens,
  range,
  today,
  closures,
  marks,
  picked,
  decideDays,
  legend,
  label,
  onPick,
}: {
  /** The month the grid draws, `YYYY-MM`. */
  readonly month: string;
  readonly lens: Lens;
  readonly range: DayRange;
  readonly today: string;
  readonly closures: readonly MarketClosure[];
  readonly marks: ReadonlyMap<string, DayMark>;
  /** The day shown pressed, when one is pinned. */
  readonly picked: string | undefined;
  /** Days a "Needs a decision" card is due (#3977 slice 4): a ▲ in the cell. */
  readonly decideDays?: ReadonlySet<string>;
  /** The legend under the grid: the caller's marks and `<ClosedKey />`, in the caller's order. */
  readonly legend: ReactNode;
  /** The grid's accessible name, when the page holds more than one. */
  readonly label?: string;
  readonly onPick: (date: string) => void;
}): ReactElement {
  const blockLens = lens === "month" || lens === "quarter";
  const closedOn = new Map(closures.map((c) => [c.date, c] as const));
  const rangeDays = new Set(lens === "all" ? [] : daysOf(range));
  const titleFor = (date: string): string | undefined => {
    const parts = [closedOn.get(date)?.reason, ...(marks.get(date)?.titles ?? [])].filter(
      (p): p is string => Boolean(p),
    );
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };
  return (
    <div className="eh" {...(label ? { role: "group", "aria-label": label } : {})}>
      <div className={blockLens ? "eh-grid eh-block" : "eh-grid"}>
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}${String(i)}`} className="eh-wd" aria-hidden="true">
            {d}
          </span>
        ))}
        {monthGrid(month).map((date, i) => {
          const closure = closedOn.get(date);
          const outside = date.slice(0, 7) !== month;
          const mark = marks.get(date);
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
              aria-pressed={picked === date}
              title={titleFor(date)}
              onClick={() => onPick(date)}
            >
              {date.endsWith("-01") ? (
                <span className="eh-month-tag" aria-hidden="true">
                  {MONTH_TAGS[Number(date.slice(5, 7)) - 1]}
                </span>
              ) : null}
              <span className="eh-num">{Number(date.slice(8, 10))}</span>
              {decideDays?.has(date) ? (
                <i className="eh-decide" aria-hidden="true">
                  ▲
                </i>
              ) : null}
              {mark?.glyph === "waits" ? (
                <i className="eh-waits" aria-hidden="true">
                  {WAITS_GLYPH}
                </i>
              ) : mark ? (
                <i className={mark.glyph === "hot" ? "eh-dot eh-hot" : "eh-dot"} />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="eh-legend">{legend}</p>
    </div>
  );
}
