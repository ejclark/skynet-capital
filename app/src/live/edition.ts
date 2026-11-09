import { dayLabel } from "./book-events";
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

/** The stories that wait on a dated event: the ones that list it among their reports (◆, AT5). */
export const waitingOn = (
  event: EditionDate,
  stories: readonly EditionStory[],
): readonly EditionStory[] =>
  stories.filter((s) => s.reports.some((r) => r.date === event.date && r.what === event.what));
