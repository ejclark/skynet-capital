// Type surface for the parts of repair.mjs a spec imports directly — the same arrangement
// repair-logs.d.mts makes, and for the same reason: scripts/ is plain ESM with `allowJs` off.
type Run = { id: number | string; name?: string; path?: string; conclusion?: string };
type Failure = { job: string; step?: string; logTail?: string };
/** How long to wait before each re-read of a run's jobs. */
export const REREAD_WAITS_MS: number[];
/** The further waits a read earns by showing a job still running on a concluded run. */
export const STALE_WAITS_MS: number[];
/** True only on GitHub's tell for a file it could not parse: zero jobs and a path-named run. */
export function wasRejected(run: Run, jobs?: unknown[]): boolean;
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
