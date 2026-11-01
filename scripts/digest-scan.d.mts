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
/** `quiet-with-work` when what was read shows work; `quiet-unknown` when it shows none and a half
 *  (null) could not be read, which `--due` answers `due: null`; else null. `waiting: null` means no
 *  read was needed. */
export function quietReason(
  quietHours: number,
  waiting: { ready: WaitingWork["ready"] | null; researchDue: number | null } | null,
): "quiet-with-work" | "quiet-unknown" | null;

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
