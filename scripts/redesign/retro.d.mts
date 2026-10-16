// Type surface for retro.mjs — same arrangement as commons.d.mts (`allowJs` is off).

export interface RetroPick {
  kind: string;
  what: string;
}
export interface RetroNote {
  on: string;
  reaction: string | null;
  text: string;
}
export interface RetroRound {
  issue: number;
  round: number | string;
  at: string;
  question: string;
  picks: RetroPick[];
  notes: RetroNote[];
}
export interface RetroLedger {
  rounds: number;
  firstBuild: number | string | null;
  builds: (number | string)[];
  notesAfterRound0: number;
  from: string | null;
  to: string | null;
}
export interface RetroFacts {
  rounds: RetroRound[];
  ledger: RetroLedger;
}
export function parseReadback(c: { at: string; body: string }): RetroRound | null;
export function retroOf(comments: { at: string; body: string }[]): RetroFacts;
export function retroMarkdown(issue: number, facts: RetroFacts): string;
