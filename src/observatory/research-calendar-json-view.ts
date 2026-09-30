import { HEADLINE_MACRO } from "./position-event.js";
import type { ResearchShelfJson } from "./research-json-view.js";

/**
 * THE CALENDAR'S SLICE OF RESEARCH — `/api/research/calendar` (#3977 slice 5). Three surfaces draw
 * the market calendar — R&D's grid, the Profile page's Events, Trade's line under its head — and
 * all three used to fetch the whole shelf (`/api/research`, 2.58 MB on 2026-09-30) to read a few
 * fields of it. 2.2 MB of that is the call board's TL;DRs, adjacents and horizon rows, which only
 * R&D's board body reads. This is a PROJECTION of that one view, never a second producer: the
 * shelf's own rows, narrowed, so the two payloads cannot disagree about an event.
 *
 * What each field is for — drop one and a surface loses something:
 *   events   id · title · date for every grid (its dots and day titles); `researched` is the dot;
 *            `kind` names an earnings print on Trade's line; `symbols` is how Events and Trade
 *            match a ticker. `called` marks an event whose ledger states a call, so R&D's fog line
 *            can count the calls held behind the day lens without the calls themselves. `impact`
 *            is left out: only R&D's facet filter reads it, and that reads the full shelf.
 *   closures the grid's struck-through days and every session count.
 *   calls    only the rows a calendar can PRINT: the Profile page's agenda shows a call beside an
 *            event that names a ticker or is a headline macro print (`app/src/live/book-events.ts`
 *            joins nothing else), so calls on any other event stay on the shelf. Each keeps its
 *            headline row and its horizon rows, since the agenda reads the one for the lens in force.
 */

type ShelfEvent = ResearchShelfJson["events"][number];
type ShelfCall = ResearchShelfJson["calls"][number];

export interface CalendarEventView {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly kind: ShelfEvent["kind"];
  readonly symbols: readonly string[];
  readonly researched: boolean;
  /** Present (and true) only when the event's ledger states a call. */
  readonly called?: true;
}

export type CalendarCallView = Pick<ShelfCall, "eventId" | "call" | "horizon" | "href"> &
  Partial<Pick<ShelfCall, "confidence" | "horizons">>;

export interface ResearchCalendarJson {
  readonly events: readonly CalendarEventView[];
  readonly closures: ResearchShelfJson["closures"];
  readonly calls: readonly CalendarCallView[];
}

/** An event a calendar can print a call beside: it names a ticker, or it is the Fed / CPI / jobs. */
const printable = (event: ShelfEvent): boolean =>
  event.symbols.length > 0 || HEADLINE_MACRO.some(([prefix]) => event.id.startsWith(prefix));

export function researchCalendarJson(shelf: ResearchShelfJson): ResearchCalendarJson {
  const called = new Set(shelf.calls.map((call) => call.eventId));
  const shown = new Set(shelf.events.filter(printable).map((event) => event.id));
  return {
    events: shelf.events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      kind: event.kind,
      symbols: event.symbols,
      researched: event.researched,
      ...(called.has(event.id) ? { called: true as const } : {}),
    })),
    closures: shelf.closures,
    calls: shelf.calls
      .filter((call) => shown.has(call.eventId))
      .map((call) => ({
        eventId: call.eventId,
        call: call.call,
        horizon: call.horizon,
        ...(call.confidence ? { confidence: call.confidence } : {}),
        href: call.href,
        ...(call.horizons ? { horizons: call.horizons } : {}),
      })),
  };
}
