// Type surface for scripts/steer/reads.mjs (see scripts/moneypenny/index.d.mts).
import type { AdmissionCliIO, AdmissionIssue } from "../moneypenny/admission.mjs";

type Row = { number: number; issue_dependencies_summary?: { blocking?: number } | null };
type Blocked = { number: number; state?: string };

/** Each Needs-you issue's open blocked issues; read only where its list row counts a blocker. */
export function blockingLists(
  needsYou?: { number: number }[],
  deps?: { issues?: Row[]; prs?: { number: number }[] },
  read?: (path: string) => Blocked[] | null,
): Record<number, number[]>;

/** `admission.mjs --queue` / `--next` in one process, the ready list and hold reads shared. */
export function admissionReads(io?: {
  run?: (argv: readonly string[], io: AdmissionCliIO) => number;
  readReady?: () => AdmissionIssue[];
  readHold?: (issue: AdmissionIssue) => string | null;
}): (flag: "--queue" | "--next") => unknown;
