// Type surface for scripts/steer/design.mjs (see scripts/moneypenny/index.d.mts).
import type { Decision } from "./model.mjs";
import type { DesignRoundData } from "./render.mjs";

type Entry = Record<string, unknown>;
export function loadDesign(
  file: string,
  opts?: { issue?: number; round?: number | string | null },
): Omit<Decision, "minutes" | "skip">[];
export function designFiles(argv: string[]): string[];
export function loadDesigns(
  files: string[],
  opts?: { issue?: number; round?: number | string | null },
): Record<number, Omit<Decision, "minutes" | "skip">[]>;
export const DESIGN_TITLE: string;
export const DESIGN_SKIP: string;
export function designRoundId(issues: number[], round: number | string | null): string;
/** A page holding only these design decisions (#5143). Throws on no manifest or a bad id. */
export function designRound(
  design: Record<number, Omit<Decision, "minutes" | "skip">[]>,
  opts?: { id?: string; title?: string; now?: string; repo?: string },
): DesignRoundData;
export function designDecisions(
  questions: Entry[],
  opts: { issue: number; round?: number | string | null; at?: (p: string) => string },
): Omit<Decision, "minutes" | "skip">[];
