// Type surface for scripts/steer/page-notes.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations).

/** A note about the page as the read-back has it. */
export interface PageNote {
  id: string;
  note: string;
  near: string;
  x: number | null;
  y: number | null;
  at: string;
}

export const PAGE_NOTE_LABEL: string;
export const PAGE_NOTE_ARMED: string;
export const MAX_NEAR: number;
export const PAGE_NOTE_MAX: number;
export const PAGE_NOTE_CLIENT: { label: string; armed: string; noteMax: number; nearMax: number };
export function pageNotesOf(meta: Record<string, unknown> | null | undefined): PageNote[];
export function pageNotesBlock(meta: Record<string, unknown> | null | undefined): string;
export function processLines(
  meta: Record<string, unknown> | null | undefined,
): { what: string; where: string }[];
