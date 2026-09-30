// Type surface for the parts of moneypenny.mjs (formerly postmaster.mjs) that carry logic worth testing directly.
// The scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this
// rather than a repo-wide tsconfig loosening for one file.
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
/** The feedback lane's claim; refuses a parked issue before touching the lease (#3818 slice 2). */
export function claimFeedback(
  ctx: {
    payload?: { issue?: { number?: number; body?: string; labels?: Array<{ name?: string }> } };
  },
  nowMs?: number,
  sha?: string,
): { claimed: boolean; reason: string; number?: number; model?: string };
/** The shipped sweep, degrading to `[]` on an exhausted budget and rethrowing anything else. */
export function sweepShipped(readIssues: () => unknown[], deps: ShippedDeps): ShippedRow[];
