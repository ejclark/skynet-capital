// Type surface for continuation.mjs — same arrangement as relay.d.mts: the scripts/ tree is plain
// ESM with `allowJs` off, so a spec that imports from it needs this.

export interface PlanIssue {
  readonly number: number;
  readonly title?: string;
  readonly body?: string;
  readonly state?: string;
  readonly labels?: readonly (string | { name?: string })[];
}

export interface RestComment {
  readonly id?: number;
  readonly body?: string;
  readonly created_at?: string;
  readonly createdAt?: string;
  readonly updated_at?: string;
}

export interface SubIssue {
  readonly number: number;
  readonly title?: string;
  readonly state?: string;
  /** Read for its "slice N of M" line (#4530). */
  readonly body?: string | null;
}

export interface RunOutcome {
  readonly status?: string;
  readonly conclusion?: string | null;
  readonly url?: string;
}

export interface Candidate {
  readonly plan: PlanIssue;
  readonly mergedMs?: number;
  readonly comments?: readonly RestComment[];
  readonly subIssues?: readonly SubIssue[];
  readonly blockedBy?: Record<number, readonly { state?: string }[]>;
  readonly openPlanPr?: number;
  /** Issue → the held platter that closes it; such a sub-issue is not a slice to take (#6530). */
  readonly boardedOn?: ReadonlyMap<number, number>;
  readonly runs?: Record<string, RunOutcome>;
}

export interface Receipt {
  readonly createdAt: string;
  readonly runId: string;
  readonly fingerprint: string;
  readonly target?: number;
}

export interface Decision {
  readonly number: number;
  readonly title: string;
  readonly action: "continue" | "stop" | "skip";
  readonly reason: string;
  readonly issue?: PlanIssue;
  readonly target?: number;
  readonly pickup?: string;
  readonly fingerprint?: string;
  readonly runId?: string;
  readonly runUrl?: string;
  readonly mergedMs?: number;
  readonly blockEditedMs?: number;
}

export interface StopIntent {
  readonly kind: "stop-continuation";
  readonly issueNumber: number;
  readonly title: string;
  readonly reason: string;
  readonly runUrl?: string;
  readonly body: string;
}

export interface ContinuationDeps {
  readonly continuations?: {
    readonly candidates?: readonly Candidate[];
    readonly caps?: { readonly continuationsPerDay?: number };
  } | null;
  readonly now?: number;
  readonly inFlight?: readonly PlanIssue[];
  readonly mode?: { readonly position?: string; readonly caps?: Record<string, number> };
}

export const CONTINUED_MODEL: string;
export const MERGE_WINDOW_HOURS: number;
export const STALL_HOURS: number;
export const BUILD_JOB: string;
export interface RunOutcome {
  status: string;
  conclusion?: string | null;
  url?: string;
}
export function buildJobOutcome(
  run: RunOutcome,
  jobs?: Array<{ name?: string; status?: string; conclusion?: string | null }>,
): RunOutcome;
export const MAX_CANDIDATES: number;
export const STOP_CAP: number;

/** The slice ordinal a pickup line or sub-issue title names, or null (#4530). */
export function sliceOf(text: string | null | undefined): number | null;
export function nextSubIssue(
  subIssues?: readonly SubIssue[],
  blockedBy?: Record<number, readonly { state?: string }[]>,
): SubIssue | null;
export function continuationDecision(
  candidate?: Candidate | Record<string, never>,
  opts?: { caps?: { continuationsPerDay?: number }; now?: number },
): Decision;
export function decideContinuations(deps?: ContinuationDeps): Decision[];
export function stopComment(decision: Decision): string;
export function routeContinuation(deps?: ContinuationDeps): StopIntent[];
export function pickContinuation(deps?: ContinuationDeps): Decision | null;
export function executeStopContinuation(
  intent: StopIntent,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
    assign?: (intent: Record<string, unknown>, opts?: Record<string, unknown>) => string;
    read?: (path: string) => unknown;
    lease?: {
      claim: (slug: string) => { claimed: boolean; reason?: string };
      release: (slug: string) => unknown;
    } | null;
  },
): string;
export function postContinuationReceipt(
  pick: Decision,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
    runId?: string;
  },
): string;
export function gatherContinuationDeps(opts?: {
  now?: number;
  mode?: { caps?: Record<string, number> };
}): { candidates: Candidate[]; caps: Record<string, number> };
export function continuationContext(opts?: { now?: number }): ContinuationDeps;
