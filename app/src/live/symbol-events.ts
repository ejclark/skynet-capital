import { dayLabel, isHeadlineMacro } from "./book-events";
import { type DayRange, inRange } from "./horizon-range";
import type { ResearchEvent } from "./research";

/**
 * EVENTS ON THE TICKET'S SYMBOL (#3807 slice 3b-2): the market calendar's line on Trade, joined to
 * the ONE name the ticket is on rather than to a book. The same corpus the Profile page's Events
 * section reads (`/api/research/calendar` — every dated event, earnings prints included; `book-events.ts`),
 * in the same two tiers the net-worth card's line draws (`held-events.ts`):
 *
 *   on <SYM>     an event naming the symbol — its earnings print, a launch, a court date
 *   market-wide  the headline macro prints every position feels — the Fed decision, CPI, the jobs
 *                report — by the same ids `src/observatory/position-event.ts` names
 *
 * The nouns are the server's own (`position-event.ts`: "Earnings", "Fed meeting", "CPI report",
 * "Jobs report"), so the line on Trade and the "Next event" column on the book say one thing.
 * Thin, and said so: 31 of 1184 event records carry a symbol, so most weeks read "Nothing dated on
 * META" beside the market-wide print — a zero is research coverage, never a defect of the line.
 */

export interface SymbolEvent {
  readonly id: string;
  /** "Earnings", "Fed meeting" — the words the book's "Next event" column prints. */
  readonly noun: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
}

export interface SymbolEvents {
  /** Events naming the symbol — empty when there is no symbol. */
  readonly on: readonly SymbolEvent[];
  readonly market: readonly SymbolEvent[];
}

/** The headline macro prints, by id prefix, in the server's words (`position-event.ts`). */
const MACRO_NOUN: ReadonlyArray<readonly [prefix: string, noun: string]> = [
  ["fomc-2", "Fed meeting"],
  ["cpi-2", "CPI report"],
  ["jobs-2", "Jobs report"],
];

/** A stock's own event in the server's words: its print is "Earnings"; else the title, trimmed. */
function stockNoun(event: ResearchEvent): string {
  if (event.kind === "earnings") return "Earnings";
  return event.title.replace(/\s*\(.*\)\s*$/, "");
}

const byDate = (a: SymbolEvent, b: SymbolEvent): number =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : a.noun.localeCompare(b.noun);

/** The events in `range` on `symbol` (upper-case ticker, "" for none) and market-wide, by date. */
export function symbolEventsIn(
  events: readonly ResearchEvent[],
  symbol: string,
  range: DayRange,
): SymbolEvents {
  const on: SymbolEvent[] = [];
  const market: SymbolEvent[] = [];
  for (const event of events) {
    if (!inRange(event.date, range)) continue;
    if (symbol !== "" && event.symbols.includes(symbol)) {
      on.push({ id: event.id, noun: stockNoun(event), date: event.date });
    } else if (isHeadlineMacro(event)) {
      const noun = MACRO_NOUN.find(([prefix]) => event.id.startsWith(prefix))?.[1] ?? event.title;
      market.push({ id: event.id, noun, date: event.date });
    }
  }
  return { on: on.sort(byDate), market: market.sort(byDate) };
}

/** "Earnings Wed Oct 28" — the noun, then the day the Monday read wants. */
export const describeSymbolEvent = (event: SymbolEvent): string =>
  `${event.noun} ${dayLabel(event.date).replace(",", "")}`;
