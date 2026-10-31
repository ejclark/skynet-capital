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
  agedOutRuns?: number | null;
}): string;
/** The "Noise absorbed" line for member filings older than 24h with no state (#6316). */
export function memberFilingsLine(
  unseen: readonly { number: number; title?: string; ageHours: number }[],
): string;
