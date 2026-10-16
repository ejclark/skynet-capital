// Type surface for scripts/steer/frame-sections.mjs (scripts/ ships hand-written declarations).

/** A named part of a screen on its frame, every number in % of the frame. */
export interface FrameSection {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export const MAX_SECTION_LABEL: number;
export function sectionsFromBoxes(
  raw: { text?: string; x: number; y: number; w: number; h: number }[] | null | undefined,
  frame: { width: number; height: number },
): FrameSection[];
export function sectionAt(
  sections: FrameSection[] | null | undefined,
  x: number,
  y: number,
): string | null;
