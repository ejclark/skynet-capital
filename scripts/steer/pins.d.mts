// Type surface for scripts/steer/pins.mjs (see scripts/moneypenny/index.d.mts for why scripts/
// ships hand-written declarations).
import type { Decision, Picture, Saved } from "./model.mjs";

export type PinReaction = "up" | "down" | "mixed";
/** A pin as the page holds it: its badge number, its spot in % of the frame, its label. */
export interface Pin {
  n: number;
  x: number;
  y: number;
  label: string;
}
export interface ShownPin {
  id: string;
  option: string;
  frame: "phone" | "desk";
  n: number;
  label: string;
}

export const MIXED: string;
export const PIN_REACTIONS: PinReaction[];
export const PIN_GLYPH: Record<PinReaction, string>;
export const PIN_WORDS: {
  design: Record<PinReaction, string>;
  problems: Record<PinReaction, string>;
};
export const PIN_DO: { design: Record<PinReaction, string>; problems: Record<PinReaction, string> };
export const NO_SIGNAL: string;
export const MAX_PIN_LABEL: number;
export const MAX_PIN_NOTE: number;
export const PIN_FIELDS: [string, "phone" | "desk"][];
export const PIN_INTRO: { design: string; problems: string };
export const PIN_CLIENT: {
  glyph: Record<PinReaction, string>;
  words: typeof PIN_WORDS;
  noteMax: number;
};
/** A pin as the read-back has it: its saved reaction and its note, each null for none. */
export type SaidPin = ShownPin & { reaction: PinReaction | null; note: string | null };

export function pinId(option: string, frame: string, n: number): string;
export function pinProblems(list: unknown, where: string): string[];
export function readManifestPins(
  value: unknown,
  opts: { holder: string; field: string; readJson?: (path: string) => unknown },
): { pins: Pin[]; problems: string[] };
export function holderPins(
  holder: Record<string, unknown> | null | undefined,
  where: string,
  readJson?: (path: string) => unknown,
): { byFrame: { phone?: Pin[]; desk?: Pin[] }; problems: string[] };
export function decisionPins(d: Partial<Decision>): ShownPin[];
export function hasPins(d: Partial<Decision>): boolean;
export function pinReactions(d: Partial<Decision>, r: Saved | null | undefined): SaidPin[];
export function pinSaid(p: SaidPin): boolean;
export function pinLine(d: Partial<Decision>, p: SaidPin): string;
export function perPinBlock(
  d: Partial<Decision>,
  r: Saved | null | undefined,
  opts?: { option?: string },
): string;
export function pinClauses(d: Partial<Decision>, r: Saved | null | undefined): string;
export function pinIntro(d: Partial<Decision>): string;
export function pinnedShot(
  pic: Picture & { pins: Pin[] },
  src: string,
  at: { key: string; option: string },
): string;
