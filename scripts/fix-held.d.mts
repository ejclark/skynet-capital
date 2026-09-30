// Type surface for fix-held.mjs — same arrangement as research-scorecard.d.mts (scripts/ is plain
// ESM with `allowJs` off, so a spec importing it needs this).

export type Prevention = "mechanized" | "doctrine" | "ledger-only" | "unfixed" | "unclassified";

export const PREVENTIONS: Prevention[];

export interface Lesson {
  title: string;
  date: string | null;
  shas: string[];
  prevention: Prevention;
  workflows: string[];
  recurs: string | null;
}
export interface Run {
  sha: string;
  date: string;
  name: string;
  path?: string;
  learned: boolean;
}
export interface Recurrence {
  lesson: Lesson;
  via: "declared" | "named";
  by: string;
  date: string | null;
}
export interface Report {
  total: number;
  byPrevention: Record<Prevention, { lessons: number; recurred: number }>;
  recurrences: Recurrence[];
  possible: { file: string; runs: Run[]; leads: Lesson[] }[];
  unresolved: { from: string; recurs: string }[];
  live: boolean;
}

export function preventionOf(line: string | null): Prevention;
export function parseLessons(md: string): Lesson[];
export function fixHeld(input: { lessons: Lesson[]; runs: Run[] | null }): Report;
export function renderMarkdown(report: Report, today: string): string;
