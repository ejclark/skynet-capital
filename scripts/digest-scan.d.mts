// Type surface for scripts/digest-scan.mjs (see moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
import type { Planned } from "./moneypenny/assignments.mjs";
import type { PullableIssue } from "./moneypenny/labels.mjs";

/** The quiet rule's threshold (#6470): main quiet this many hours with work waiting is a digest. */
export const QUIET_HOURS: number;
/** What is waiting to start: `ready` issues the pull rule admits, and due research events. */
export interface WaitingWork {
  ready: { number: number; title: string }[];
  researchDue: number;
}
export function waitingWork(input: {
  readyIssues?: (PullableIssue & { title?: string })[];
  researchDue?: number;
}): WaitingWork;
/** `quiet-with-work`, or null. A half that could not be read is null and counts as nothing;
 *  `waiting: null` (nothing read) is never due. */
export function quietReason(
  quietHours: number,
  waiting: { ready: WaitingWork["ready"] | null; researchDue: number | null } | null,
): "quiet-with-work" | null;

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
