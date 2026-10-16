// Type surface for scripts/steer/focus.mjs (scripts/ ships hand-written declarations).
import type { FrameSection } from "./frame-sections.mjs";
import type { Decision } from "./model.mjs";

/** A round's focus on one frame, every number in % of the frame. */
export interface Focus {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}
/** A manifest question's `focus`: a section's label, or an explicit box per frame. */
export type FocusSpec = string | { phone?: number[]; desk?: number[] };

export const FOCUS_LABEL: string;
export const FOCUS_MARGIN: number;
export const FOCUS_WORDS: { line: string; whole: string; part: string };
export const FOCUS_CLIENT: { whole: string; part: string };
export const FOCUS_HOW: string;
export function focusBoxProblems(box: unknown, where: string): string[];
export function matchSection(
  sections: FrameSection[] | null | undefined,
  label: string,
): FrameSection | null;
export function focusFor(
  spec: FocusSpec | undefined,
  pic: { size: "phone" | "desk"; sections?: FrameSection[] },
): Focus | null;
export function cropOf(
  focus: { x: number; y: number; w: number; h: number },
  margin?: number,
): { x: number; y: number; w: number; h: number };
export function inFocus(
  focus: { x: number; y: number; w: number; h: number },
  x: number,
  y: number,
): boolean;
export function imageRatio(buf: Buffer | null | undefined): number | null;
export function imageSize(buf: Buffer | null | undefined): { w: number; h: number } | null;
export function hasFocus(d: Partial<Decision> | null | undefined): boolean;
export function focusedFrame(
  inner: string,
  focus: Focus | null | undefined,
  ratio?: number,
): { attrs: string; inner: string };
