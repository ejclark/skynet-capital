// Type surface for board-page.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).
import type { Screen } from "./shoot.mjs";

export type Size = { width: number; height: number } | null;
export type Sizes = Record<string, { phone: Size; desk: Size }>;

export const FRAMES: [kind: "phone" | "desk", caption: string][];
export function framePath(id: string, kind: "phone" | "desk"): string;
export function boardScreens(
  registry: Screen[],
  shot: string[],
  hasFrames: (id: string) => boolean,
): Screen[];
export function worldClock(instant?: string): string;
export function boardHtml(
  screens: Screen[],
  sizes: Sizes,
  made: { ref: string; sha: string; day: string; reshot?: string[] | null },
): string;
export function boardFiles(screens: Screen[], sizes: Sizes, imgDir: string): Record<string, string>;
