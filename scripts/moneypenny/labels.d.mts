// Type surface for the parts of labels.mjs a spec imports directly — same arrangement as
// index.d.mts: the scripts/ tree is plain ESM with `allowJs` off. Only what a spec needs is declared.

/** The issue a claim-lease slug names (`feedback-12` / `plan-12` → 12), or null (#3960). */
export function issueNumberFromSlug(slug: unknown): number | null;
/** Put `in-progress` on or take it off an issue; best-effort, false on a failed write (#3960). */
export function setInProgress(number: number | null | undefined, add: boolean): boolean;

type PullLabel = string | { name?: string };
/** The issue shapes the pull rule reads: a REST row, an event payload's issue, or gh JSON. */
export interface PullableIssue {
  number?: number;
  state?: string;
  labels?: readonly PullLabel[];
  /** GitHub's dependency summary; `blocked_by` counts OPEN blockers. Absent reads as unblocked. */
  issue_dependencies_summary?: { blocked_by?: number };
}
/** `interactive: true` only from a live session's pull — it may take a `needs-session` issue (#5236). */
export interface PullOptions {
  interactive?: boolean;
  /** Issue → the open platter PR whose body closes it (#6191); refused when present. */
  boardedOn?: ReadonlyMap<number, number>;
}
/** Why an automated puller may not start this issue (first failing rule), or null (#4393). */
export function notPullableReason(
  issue: PullableIssue | null | undefined,
  opts?: PullOptions,
): string | null;
/** Why issue `n` may not be pulled because an open platter closes it, or null (#6191). */
export function boardedReason(
  n: number | undefined,
  boardedOn?: ReadonlyMap<number, number>,
): string | null;
/** The board's Ready column: open, `ready`, buildable, not `in-progress`, no open blocker (#4393). */
export function pullable(issue: PullableIssue | null | undefined, opts?: PullOptions): boolean;
/** The labels that each say "this waits on someone" — nothing builds an issue carrying one. */
export const PARKING_LABELS: readonly string[];
