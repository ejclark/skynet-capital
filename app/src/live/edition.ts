import { dayLabel } from "./book-events";

/**
 * The day's edition, client side (#7077) — mirrors `EditionView` in `src/domain/edition.ts`. The
 * honesty checks (a base rate carries its sample size, nothing frames a time as good to buy, every
 * line is marked) run when the server loads the record; this file renders what passed them.
 */

export type EditionMark = "measured" | "reported" | "modeled" | "call";

export interface EditionFact {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  readonly mark?: EditionMark;
  readonly n?: number;
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
