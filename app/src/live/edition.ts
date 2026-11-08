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

export interface EditionStory {
  readonly id: string;
  readonly headline: string;
  readonly narrator?: string;
  readonly symbols: readonly string[];
  readonly facts: readonly EditionFact[];
  readonly reports: readonly EditionDate[];
  readonly more: readonly EditionLine[];
}

export interface Edition {
  readonly date: string;
  readonly campaign?: string;
  readonly campaignTitle?: string;
  readonly writtenBy: string;
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

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH = [
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

/** "2026-11-10" → "Tue Nov 10". A calendar date, never a moment, so no time zone can shift it. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const at = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  return `${WEEKDAY[at.getUTCDay()]} ${MONTH[at.getUTCMonth()]} ${at.getUTCDate()}`;
}

/** How a dated item reads: "Tue Nov 10 · after the close", plus "estimate" when it is one. */
export function dateLine(d: EditionDate): string {
  return [dayLabel(d.date), d.when, d.status === "estimate" ? "estimate" : undefined]
    .filter(Boolean)
    .join(" · ");
}

/** The masthead's age line: whose close the news describes, so a hand-written edition's age is on
 *  the page. */
export function asOfLine(edition: Edition, today: string): string {
  const close = `${dayLabel(edition.date)} close`;
  if (edition.date === today) return `Today's ${close}`;
  return `As of the ${close}`;
}
