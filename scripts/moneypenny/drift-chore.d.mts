// Type surface for drift-chore.mjs (see scripts/moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).

/** `instruction-drift-scan --json`'s output: `known` carries the scan, `unknown` says why not. */
export interface DriftScan {
  state: "known" | "unknown";
  unknown?: string;
  due?: boolean;
  reason?: string;
  stamp?: { commit: string; date: string; run: string } | null;
  daysSince?: number | null;
  files?: string[];
  items?: unknown[];
  protectedItems?: unknown[];
}

export interface DriftChoreTicket {
  number: number;
  title: string;
  body?: string;
}

export interface DriftChoreIntent {
  kind: "open-issue" | "edit-issue-body" | "close-receipt";
  title: string;
  body: string;
  issueNumber?: number;
  label?: { name: string; color: string; description: string };
  closeReason?: string;
  why?: string;
}

export const DRIFT_CHORE_DOC: string;
export const DRIFT_CHORE_PREFIX: string;
export const DRIFT_CHORE_TITLE: string;
/** The first ```json fence in the chore doc, or null. */
export function stepsBlockFrom(doc?: string): string | null;
/** The ticket body for a due scan. */
export function driftChoreBody(scan: DriftScan, stepsBlock: string | null): string;
/** File, refresh, close, or nothing (null). */
export function driftChoreIntent(input: {
  scan: DriftScan | null;
  open?: DriftChoreTicket | null;
  stepsBlock?: string | null;
}): DriftChoreIntent | null;
/** The live reads and the intent — soft on failure (null, with a warning). */
export function driftChoreFromRepo(
  openIssues?: { number: number; title?: string }[],
): DriftChoreIntent | null;
