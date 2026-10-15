// Type surface for scripts/steer/compare.mjs (scripts/ ships hand-written declarations).
import type { Decision, Option, Picture } from "./model.mjs";

export type CompareMode = "flip" | "swipe" | "divider";
export const COMPARE_MODES: CompareMode[];
export const COMPARE_WORDS: {
  lead: string;
  modes: Record<CompareMode, string>;
  glyphs: Record<CompareMode, string>;
  differ: string;
  today: string;
  option: string;
  drag: string;
};
export const COMPARE_CLIENT: { modes: CompareMode[]; store: string };
export function compareProblems(
  q: Record<string, unknown> | null | undefined,
  where: string,
): string[];
export function todayPhone(d: Partial<Decision> | null | undefined): Picture | null;
export function sameSize(a: Picture | null | undefined, b: Picture | null | undefined): boolean;
export function compareHtml(args: {
  d: Decision;
  o: Option;
  pic: Picture;
  shot: string;
  img: (pic: Picture) => string | null;
}): string;
