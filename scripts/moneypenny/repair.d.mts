// Type surface for the parts of repair.mjs a spec imports directly — the same arrangement
// repair-logs.d.mts makes, and for the same reason: scripts/ is plain ESM with `allowJs` off.
type Run = { id: number | string; name?: string; path?: string; conclusion?: string };
type Failure = { job: string; step?: string; logTail?: string };
/** Appended to the failing step when the runner went away mid-step. */
export const LOST_RUNNER: string;
/** How long to wait before each re-read of a run's jobs. */
export const REREAD_WAITS_MS: number[];
/** The further waits a read earns by showing a job still running on a concluded run. */
export const STALE_WAITS_MS: number[];
/** True only on GitHub's tell for a file it could not parse: zero jobs and a path-named run. */
export function wasRejected(run: Run, jobs?: unknown[]): boolean;
/** Does a failed leg's log say a usage limit ended the session, before or after it worked? */
export function limitRejected(logTail?: string | null): boolean;
/** The refused legs as one `skip` per signature, and the real legs left to fold. */
export function splitRefused(
  run: Run,
  failures?: Failure[],
  open?: { number: number; title: string }[],
): {
  skips: { type: "skip"; issue?: number; title: string; reason: string }[];
  real: Failure[];
};
/** `failuresFrom` over a live read, re-reading while the read shows no failed job or throws. */
export function readFailures(
  run: Run,
  deps: {
    fetchJobs: (runId: Run["id"]) => unknown[];
    logOf?: (jobId: number) => string;
    sleep: (ms: number) => unknown;
    waits?: number[];
    staleWaits?: number[];
  },
): Failure[];
/** How far back a closed capsule still owns its signature (#6953 slice 2). */
export const REOPEN_DAYS: number;
/** Left on every reopen; capsule-stall.mjs reads only what was said since. */
export const REOPEN_MARKER: string;
type ClosedCapsule = {
  number: number;
  title: string;
  closedAt?: string;
  stateReason?: string;
  labels?: (string | { name?: string })[];
  body?: string | null;
};
/** The closes a capsule's fault has come back from, read from its body row. */
export function recurrenceCount(body?: string | null): number;
/** `body` with its recurrence row set to `n`. */
export function withRecurrence(body: string | null | undefined, n: number): string;
/** The closed capsule a returning fault reopens, or null. */
export function reopenable(
  run: { run_started_at?: string } | undefined,
  closedIssues: readonly ClosedCapsule[] | undefined,
  title: string,
  days?: number,
): ClosedCapsule | null;
export interface RepairIntent {
  type: string;
  issue?: number;
  title?: string;
  body?: string;
  issueBody?: string;
  removeLabels?: string[];
  dispatch?: boolean;
  reason?: string;
}
/** Decide what to do about a completed run. Pure. */
export function routeFailure(
  ctx: { run?: Record<string, unknown>; defaultBranch?: string; failures?: Failure[] },
  deps?: {
    openIssues?: { number: number; title: string; labels?: string[] }[];
    closedIssues?: ClosedCapsule[];
  },
): RepairIntent[];
