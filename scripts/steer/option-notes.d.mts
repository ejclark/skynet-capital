// Type surface for scripts/steer/option-notes.mjs (see scripts/moneypenny/index.d.mts).
import type { Decision, Saved } from "./model.mjs";

export const NOTES_PER: "option";
export const OPTION_NOTE_LABEL: string;
export const QUESTION_NOTE_LABEL: string;
export function notesPerProblems(q: Record<string, unknown>, where: string): string[];
export function perOption(d: Partial<Decision> | null | undefined): boolean;
export function optionNoteHtml(d: Pick<Decision, "key">, o: { key: string }): string;
export function optionNotesSaid(
  d: Partial<Decision> | null | undefined,
  r: Saved | null | undefined,
): [string, string][];
export function perOptionBlock(d: Decision, r: Saved): string;
export function optionClauses(d: Decision, r: Saved): string;
