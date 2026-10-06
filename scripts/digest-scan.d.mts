// Type surface for scripts/digest-scan.mjs (see moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
import type { Planned } from "./moneypenny/assignments.mjs";

export function digestFiles(): string[];
export function latestDigestDate(): string | null;
export function needsYouLines(planned: Pick<Planned, "needsYou">): string[];
/** The "Noise absorbed" line for unlearned incidents (#4212); `unlearnedRuns: null` = unknown. */
export function learningLine(count: {
  days?: number;
  openEntries?: string[];
  unlearnedRuns?: number | null;
}): string;
