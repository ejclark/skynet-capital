// Type surface for scripts/steer/design.mjs (see scripts/moneypenny/index.d.mts).
import type { Decision } from "./model.mjs";

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
export function designDecisions(
  questions: Entry[],
  opts: { issue: number; round?: number | string | null; at?: (p: string) => string },
): Omit<Decision, "minutes" | "skip">[];
