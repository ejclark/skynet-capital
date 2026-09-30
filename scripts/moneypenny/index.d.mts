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
    comment?: { body?: string };
    action?: string;
    label?: { name?: string };
  };
};
export type ClaimResult = { claimed: boolean; reason: string; number?: number; model?: string };
/** The feedback lane's claim; refuses a parked issue before touching the lease (#3818 slice 2),
 *  then asks the admission gate (#3960) — a refusal takes no lease and adds no label. */
export function claimFeedback(
  ctx: ClaimCtx,
  nowMs?: number,
  sha?: string,
  admission?: AdmissionDeps,
): ClaimResult;
/** The #3960 retry sweep: claim the oldest admissible `ready` issue (plan or feedback lane). */
export function claimNext(
  nowMs?: number,
  sha?: string,
  deps?: AdmissionDeps & {
    readReady?: () => AdmissionIssue[];
    claims?: Record<"plan" | "feedback", typeof claimPlan>;
  },
): ClaimResult & { lane?: "plan" | "feedback" };
/** The sweep's dry run for the push pass: the issue `claimNext` would pick, or null. Claims nothing. */
export function peekNext(
  deps?: AdmissionDeps & { readReady?: () => AdmissionIssue[] },
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
