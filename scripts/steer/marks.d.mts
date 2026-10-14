// Type surface for scripts/steer/marks.mjs (see scripts/moneypenny/index.d.mts for why scripts/
// ships hand-written declarations).
import type { Decision, Picture, Saved } from "./model.mjs";
import type { PinReaction } from "./pins.mjs";

/** A mark as the read-back has it: its frame, its spot in %, what he said, and when. */
export interface SaidMark {
  id: string;
  option: string;
  frame: "phone" | "desk";
  x: number;
  y: number;
  at: string;
  reaction: PinReaction | null;
  note: string | null;
  /** Placed before he pressed "Show what Claude found". */
  before: boolean;
  /** The named part of the screen it landed on (frame-sections.mjs), or null. */
  section?: string | null;
  /** Inside the round's focus (focus.mjs) — always true on a frame with none. */
  inFocus: boolean;
}

export const IN_FOCUS: string;
export const OUT_OF_FOCUS: string;
export const ADD_TO_SCOPE: string;
export function scopeClauses(d: Partial<Decision>, r: Saved | null | undefined): string;
export function markInstruction(d: Partial<Decision>, r: Saved | null | undefined): string;

export const PENCIL: string;
export const MARK_GLYPH: Record<PinReaction, string>;
export const MARK_WORDS: Record<PinReaction, string>;
export const MARK_ID: RegExp;
export const MARK_CLIENT: {
  glyph: Record<PinReaction, string>;
  words: Record<PinReaction, string>;
  reveal: { show: string; hide: string };
};
export const MARK_INTRO: string;
export const OPENING_LINE: string;
export const REVEAL_SHOW: string;
export const REVEAL_HIDE: string;
export function isOpening(d: Partial<Decision> | null | undefined): boolean;
export function decisionMarks(d: Partial<Decision>, r: Saved | null | undefined): SaidMark[];
export function marksSaid(d: Partial<Decision>, r: Saved | null | undefined): boolean;
export function markLine(m: SaidMark): string;
export function marksBlock(d: Partial<Decision>, r: Saved | null | undefined): string;
export function markClauses(d: Partial<Decision>, r: Saved | null | undefined): string;
export function revealLine(
  d: Partial<Decision>,
  r: Saved | null | undefined,
  when?: (iso: string) => string,
): string;
export function cleanShots(
  d: Partial<Decision> & { key: string },
  img: (p: unknown) => string | null,
): string;
export function markableShot(
  size: "phone" | "desk",
  src: string,
  alt: string,
  at: { key: string; option: string; focus?: Picture["focus"]; ratio?: number },
): string;
