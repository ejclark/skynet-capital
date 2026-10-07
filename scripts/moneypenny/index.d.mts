// Type surface for the parts of moneypenny.mjs (formerly postmaster.mjs) that carry logic worth testing directly.
// The scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this
// rather than a repo-wide tsconfig loosening for one file.
import type { AdmissionDeps, AdmissionIssue } from "./admission.mjs";

export interface ShippedDeps {
  isMerged: (ref: unknown) => boolean;
  recheckRefs: (n: number) => unknown[];
  warn: (msg: string) => void;
}
export interface ShippedRow {
  number: number;
  title: string;
  pr: number;
}
/** True when a failure is the GraphQL budget running out rather than a wrong answer. */
export function isRateLimited(err: unknown): boolean;
/** The backlog gate (#3818 consolidation): self-ready a coach-shaped filing, else stay in Backlog. */
export function triageFeedbackDecision(issue?: { labels?: string[] }): {
  ready: boolean;
  reason: string;
};
export type ClaimCtx = {
  payload?: {
    issue?: { number?: number; state?: string; body?: string; labels?: Array<{ name?: string }> };
    /** `id`/`created_at` are read only by `claimFeedbackReply` — the reply pointer it hands the
     *  build, and the baseline the stall guard measures that run's silence from. */
    comment?: { body?: string; id?: number; created_at?: string };
    action?: string;
    label?: { name?: string };
  };
};
export type CalloutCtx = {
  actor?: string;
  payload?: {
    issue?: {
      number?: number;
      body?: string | null;
      user?: { login?: string };
      labels?: Array<{ name?: string }>;
    };
    sender?: { login?: string };
  };
};
/** #3913 slice 2b: `needs-eric` landed — comment once if the body never states the decision. */
export function checkCallout(
  ctx: CalloutCtx,
  deps?: {
    readComments?: (issueNumber: number) => (string | null)[];
    post?: (issueNumber: number, body: string) => void;
  },
): { posted: boolean; reason?: string; actor?: string };
export type ClaimResult = { claimed: boolean; reason: string; number?: number; model?: string };
/** The feedback lane's claim; refuses a parked issue before touching the lease (#3818 slice 2),
 *  then asks the admission gate (#3960) — a refusal takes no lease and adds no label. */
export function claimFeedback(
  ctx: ClaimCtx,
  nowMs?: number,
  sha?: string,
  admission?: AdmissionDeps,
): ClaimResult;
/** #3959 slices 1–2: an authorized reply on a blocked issue resumes the lane that owns it. A
 *  `feedback` issue takes the same lease, sets `in-progress`, clears the answered label, and reports
 *  the reply's comment id; a `plan` issue is only unparked (`unparked: true`) and the plan gate's
 *  `unlabeled` path does the claim. */
export function claimFeedbackReply(
  ctx: ClaimCtx,
  nowMs?: number,
  sha?: string,
  /** `edit` is this lane's injected label write — see the function's refusal-path note. */
  admission?: AdmissionDeps & { edit?: (n: number, args: string[]) => boolean },
): ClaimResult & {
  reply?: number | string;
  replyAt?: string;
  unparked?: boolean;
  lane?: "feedback" | "plan";
};
/** The #3960 retry sweep: claim the oldest admissible `ready` issue (plan or feedback lane). */
export function claimNext(
  nowMs?: number,
  sha?: string,
  deps?: AdmissionDeps & {
    readReady?: () => AdmissionIssue[];
    readPrIssues?: () => Map<number, number>;
    claims?: Record<"plan" | "feedback", typeof claimPlan>;
  },
): ClaimResult & { lane?: "plan" | "feedback" };
/** How many lease-held picks one sweep steps past before giving up for the tick. */
export const SWEEP_HELD_SKIPS: number;
/** The pool minus every issue an open PR already names (`openPrsByIssue`'s map: issue → PR). */
export function withoutOpenPr<T extends { number?: number }>(
  pool?: T[],
  named?: Map<number, number>,
): T[];
/** The sweep's dry run for the push pass: the issue `claimNext` would pick, or null. Claims nothing. */
export function peekNext(
  deps?: AdmissionDeps & {
    readReady?: () => AdmissionIssue[];
    readPrIssues?: () => Map<number, number>;
  },
): AdmissionIssue | null;
/** The plan lane's claim: `planReadyIntent`, then the admission gate, then the lease. */
export function claimPlan(
  ctx: ClaimCtx,
  nowMs?: number,
  sha?: string,
  admission?: AdmissionDeps,
): ClaimResult;
/** The shipped sweep, degrading to `[]` on an exhausted budget and rethrowing anything else. */
export function sweepShipped(readIssues: () => unknown[], deps: ShippedDeps): ShippedRow[];
/** The pure router: an event (and its gathered deps) in, the intents to execute out. */
export function route(ctx: unknown, deps?: unknown): Record<string, unknown>[];
