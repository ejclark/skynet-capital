// Type surface for lint.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the spec that
// imports it needs this rather than a repo-wide loosening (same arrangement as crawl/ledger.d.mts).

export type PacketKind = "task" | "role" | "card";
export interface LintProblem {
  file: string;
  item: number;
  kind: "sealed-word" | "interface-label" | "overlap";
  /** Only on an interface-label problem: the screen labels hit. */
  words?: string[];
}

/** Which of `terms` occur in `text` as whole words or phrases — sorted, de-duplicated. */
export function matchedTerms(text: string, terms: string[]): string[];
/** What a member reads of each item: a task's scenario only; any other packet, all of it. */
export function shownOf(name: string, raw: string): string[];
/** One problem as the line an author is handed back. */
export function rewriteLine(p: LintProblem): string;

/** Terms from a newline list, lower-cased, blanks and #comments dropped. */
export function termList(text: string): string[];
/** How many of `terms` occur in `text` as whole words or phrases. */
export function countHits(text: string, terms: string[]): number;
/** The set of normalised n-word runs in a text (default five). */
export function shingles(text: string, n?: number): Set<string>;
/** True when `text` shares any five-word run with the sealed key. */
export function overlapsKey(text: string, keyShingles: Set<string>): boolean;
/** A task file's array entries, or a markdown file's paragraphs. */
export function itemsOf(name: string, raw: string): string[];
/** Lint one packet; problems name the file and item only, never the word. */
export function lintPacket(args: {
  file: string;
  raw: string;
  kind: PacketKind;
  keywords: string[];
  labels?: string[];
  keyShingles: Set<string>;
  allow?: string[];
}): { problems: LintProblem[]; primes: number };
