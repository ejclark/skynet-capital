import { daysBetween, marketClosures } from "../../../src/domain/market-calendar";
import { dayLabel } from "./book-events";
import { addDays } from "./horizon-range";
import type { SectorsView } from "./edition-sectors";

/**
 * The day's edition, client side (#7077) — mirrors `EditionView` in `src/domain/edition.ts`. The
 * honesty checks (a base rate carries its sample size, nothing frames a time as good to buy, every
 * line is marked) run when the server loads the record; this file renders what passed them.
 */

export type EditionMark = "measured" | "reported" | "modeled" | "call";

/** Which way a key fact moved. */
export type EditionMove = "up" | "down" | "mixed";

export interface EditionFact {
  readonly label: string;
  readonly value: string;
  /** A level's signed move with its unit ("−0.07 pts"); the server's check requires it on a lead
   *  fact whose value is a level (#7182). */
  readonly change?: string;
  readonly move: EditionMove;
  readonly note?: string;
  readonly mark?: EditionMark;
  readonly n?: number;
}

/** The figure a story's one-line row shows: the move, never a bare level (#7182). A level's
 *  `change` stands in for it; a change's own value already is the move. */
export function rowFigure(fact: EditionFact): string {
  return fact.change ?? fact.value;
}

export interface EditionDate {
  readonly date: string;
  readonly when?: string;
  readonly what: string;
  readonly status: "confirmed" | "estimate";
}

export interface EditionLine {
  readonly text: string;
  readonly mark: EditionMark;
  readonly source: string;
  readonly n?: number;
}

/** A story's report; `passed` once its day is behind today (the story is written as of its close). */
export type EditionReport = EditionDate & { readonly passed?: true };

export interface EditionStory {
  readonly id: string;
  readonly headline: string;
  /** The headline cut to one line, drawn beside the lead fact's number (AT4). */
  readonly line: string;
  readonly narrator?: string;
  readonly symbols: readonly string[];
  readonly facts: readonly EditionFact[];
  readonly reports: readonly EditionReport[];
  readonly more: readonly EditionLine[];
}

export interface Edition {
  readonly date: string;
  readonly campaign?: string;
  readonly campaignTitle?: string;
  readonly writtenBy: string;
  /** Calendar days from the close it describes to today. */
  readonly ageDays: number;
  readonly stories: readonly EditionStory[];
  readonly next: readonly EditionDate[];
  /** The whole market's moves, when the edition carries its closes (AT1–AT3). */
  readonly sectors?: SectorsView;
}

export interface EditionView {
  readonly edition: Edition | null;
  readonly today: string;
}

export async function fetchEdition(): Promise<EditionView> {
  const res = await fetch("/api/edition", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`edition ${res.status}`);
  return (await res.json()) as EditionView;
}

/** A move's shape and its word: the shape carries it at a glance, the word for a screen reader and
 *  for anyone who cannot tell the shapes apart (docs/IA.md §5.9; BRAND.md → Accessibility). */
export const MOVE_SHAPE: Readonly<
  Record<EditionMove, { readonly glyph: string; readonly word: string }>
> = {
  up: { glyph: "▲", word: "up" },
  down: { glyph: "▼", word: "down" },
  mixed: { glyph: "∿", word: "mixed" },
};

/** The word a mark shows beside its line. A reported line says it is unconfirmed (#7077 c7). */
export const MARK_WORD: Readonly<Record<EditionMark, string>> = {
  measured: "Measured",
  reported: "Reported · unconfirmed",
  modeled: "Modeled",
  call: "House call",
};

/** How a dated item reads: "Tue, Nov 10 · after the close", plus "estimate" or "passed". */
export function dateLine(d: EditionReport): string {
  return [
    dayLabel(d.date),
    d.when,
    d.status === "estimate" ? "estimate" : undefined,
    d.passed ? "passed" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The masthead's age line: whose close the news describes, so an edition's age is on the page. */
export function asOfLine(edition: Edition): string {
  return `As of the ${dayLabel(edition.date)} close`;
}

/** Older than a weekend: Friday's close still leads on Monday, but not past it. */
export const STALE_AFTER_DAYS = 3;

/** Said plainly when the news is older than a weekend, so an old edition never reads as today's. */
export function staleLine(edition: Edition): string | undefined {
  if (edition.ageDays <= STALE_AFTER_DAYS) return undefined;
  return `No newer edition has been written yet, so this news is ${edition.ageDays} days old.`;
}

/** One coming trading day on the calendar, and its dated events in order (AT5). */
export interface CalendarDay {
  readonly date: string;
  readonly events: readonly EditionDate[];
}

/** What's next, grouped by day, in date order (the server already cut the passed ones). */
export function calendarDays(next: readonly EditionDate[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (const d of [...next].sort((a, b) => a.date.localeCompare(b.date))) {
    const last = days.at(-1);
    if (last?.date === d.date) days[days.length - 1] = { ...last, events: [...last.events, d] };
    else days.push({ date: d.date, events: [d] });
  }
  return days;
}

/** One week on the calendar (AT5b): its header, the closures inside it, and what it holds. */
export interface CalendarWeek {
  /** The week's Monday, `YYYY-MM-DD`. */
  readonly monday: string;
  /** "This week · Mon 9 – Fri 13", "Next week · Mon 16 – Fri 20". */
  readonly title: string;
  /** Each market closure or early close Mon–Fri, said plainly: "Closed Thu 26, Thanksgiving Day". */
  readonly closures: readonly string[];
  /** True on the edition's own week, where its stories sit. */
  readonly stories: boolean;
  readonly days: readonly CalendarDay[];
}

const mondayOf = (date: string): string =>
  addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const at = (date: string): Date => new Date(`${date}T00:00:00Z`);
/** "Mon 9", or "Mon 30 Nov" when the week crosses into another month. */
const shortDay = (date: string, month: boolean): string =>
  `${WEEKDAY.format(at(date))} ${at(date).getUTCDate()}${month ? ` ${MONTH.format(at(date))}` : ""}`;

/** The Monday "this week" means: today's, or on a weekend the coming one, since a member reading on
 *  Sunday plans the week ahead and calls the one just closed "last week". */
function currentMonday(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return weekday === 6 || weekday === 0 ? mondayOf(addDays(today, 2)) : mondayOf(today);
}

/** "This week", "Next week", "In 3 weeks", "Last week", "2 weeks ago": counted from today's week. */
function weekWord(monday: string, today: string): string {
  const n = Math.round(daysBetween(currentMonday(today), monday) / 7);
  if (n === 0) return "This week";
  if (n === 1) return "Next week";
  if (n === -1) return "Last week";
  return n > 1 ? `In ${n} weeks` : `${-n} weeks ago`;
}

/** A closure as the header names it. The early-close reasons carry their hour, said once here. */
function closureLine(c: { date: string; reason: string; early: boolean }): string {
  const day = shortDay(c.date, false);
  const reason = c.reason.replace(/\s*—\s*1:00 p\.m\. close$/, "");
  return c.early ? `Closes at 1:00 p.m. ${day}, ${reason}` : `Closed ${day}, ${reason}`;
}

/**
 * The calendar's weeks, dates running down the page (AT5b): the edition's own week (its stories)
 * and each week holding a coming day, in order, each under a header that names its closures from
 * the exchange's own calendar (`src/domain/market-calendar.ts`). A week with nothing in it is left
 * out rather than drawn empty.
 */
export function calendarWeeks(
  editionDate: string,
  days: readonly CalendarDay[],
  today: string,
): CalendarWeek[] {
  const mondays = [
    ...new Set([mondayOf(editionDate), ...days.map((d) => mondayOf(d.date))]),
  ].sort();
  return mondays.map((monday) => {
    const friday = addDays(monday, 4);
    const crosses = monday.slice(5, 7) !== friday.slice(5, 7);
    return {
      monday,
      title: `${weekWord(monday, today)} · ${shortDay(monday, crosses)} – ${shortDay(friday, crosses)}`,
      closures: marketClosures(monday, friday).map(closureLine),
      stories: monday === mondayOf(editionDate),
      days: days.filter((d) => mondayOf(d.date) === monday),
    };
  });
}

/** The stories that wait on a dated event: the ones that list it among their reports (◆, AT5). */
export const waitingOn = (
  event: EditionDate,
  stories: readonly EditionStory[],
): readonly EditionStory[] =>
  stories.filter((s) => s.reports.some((r) => r.date === event.date && r.what === event.what));
