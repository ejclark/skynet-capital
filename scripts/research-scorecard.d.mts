// Type surface for research-scorecard.mjs — same arrangement as loop-list-decide.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export type Verdict = "pass" | "kill" | "void" | "unscoreable" | "open" | "unread";
export type Horizon = "today" | "this week" | "this month" | "this quarter" | "other";
export type Grade = "high" | "medium-high" | "medium" | "low" | "none" | "ungraded";
export type Counts = Record<Verdict, number>;

export const VERDICTS: Verdict[];
export const HORIZONS: Horizon[];
export const GRADES: Grade[];

export interface ForwardTest {
  id: string;
  verdict: Verdict;
}
export interface CallLink {
  id: string;
  horizon: Horizon;
  grade: Grade;
}
export interface Scorecard {
  total: number;
  linked: number;
  multiLinked: number;
  duplicateIds: number;
  all: Counts;
  unlinked: Counts;
  byGrade: Record<Grade, Counts>;
  byHorizon: Record<Horizon, Counts>;
}

export function verdictOf(outcome: string): Verdict;
export function parseForwardTests(md: string): ForwardTest[];
export function horizonOf(cell: string): Horizon;
export function gradeOf(cell: string): Grade;
export function parseCallLinks(md: string): CallLink[];
export function scorecard(input: { tests: ForwardTest[]; links: CallLink[] }): Scorecard;
export function passRate(c: Counts): number | null;
export function renderMarkdown(card: Scorecard, today: string): string;
export function readCorpus(root?: string): { tests: ForwardTest[]; links: CallLink[] };
