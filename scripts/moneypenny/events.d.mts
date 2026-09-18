// Type surface for events.mjs — same arrangement as code-lines.d.mts and plan-closure-scan.d.mts:
// the scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this
// rather than a repo-wide loosening. Only the exports a spec consumes are declared.

/** One row of `event-scan.mjs --due`, narrowed to the fields dispatch ordering actually reads. */
export interface DueEvent {
  readonly id: string;
  readonly impact: string;
  readonly daysUntil: number;
  readonly reason: string;
  readonly [key: string]: unknown;
}

/**
 * The dispatch ceiling from research-dispatch-budget.json (#2946). Throws on a missing or
 * non-positive-integer `maxPerTick` — this gate fails closed, because an uncapped research batch
 * is the failure it exists to prevent.
 */
export function loadDispatchCap(file?: string): number;

/**
 * Which due events actually get researched this run: drop anything whose `research/<id>` branch
 * already has an open PR, rank the rest (close-outs by slack, then impact, then proximity), and
 * return at most `cap` of them. The remainder is deferred, not dropped, and reported on stderr.
 */
export function dueForResearch<T extends DueEvent>(
  dueEvents?: readonly T[],
  openPrHeads?: readonly string[],
  cap?: number,
): T[];

/** An open `[event-research] <id>` issue, as `gatherDeps` hands it over. */
export interface EventReceipt {
  readonly number: number;
  readonly title: string;
}

/** Why a receipt was closed — the three ways one goes stale with nothing to close it. */
export type ReceiptCloseReason = "researched" | "not-due" | "duplicate";

export interface CloseReceiptIntent {
  readonly kind: "close-receipt";
  readonly issueNumber: number;
  readonly title: string;
  readonly id: string;
  readonly reason: ReceiptCloseReason;
  readonly body: string;
}

/** How many stale receipts one tick may close before deferring the rest to the next push. */
export const RECONCILE_CAP: number;

/**
 * One open receipt per event the sweep would open one for today, and none for anything else.
 * Pure. `dueEvents` is the UNCAPPED `--due`, so a cap-deferred event keeps its receipt; `hasLedger`
 * only words the closing comment and never decides, so a ledger with an unparseable header cannot
 * make a receipt flap open and closed.
 */
export function reconcileReceipts(deps?: {
  readonly openEventReceipts?: readonly EventReceipt[];
  readonly dueEvents?: readonly DueEvent[];
  readonly hasLedger?: (id: string) => boolean;
  readonly alreadyClosing?: ReadonlySet<number>;
  readonly cap?: number;
}): CloseReceiptIntent[];

/** The push sweep: open a receipt per never-assessed event, close what shipped, reconcile the rest. */
export function routeSweep(deps?: Record<string, unknown>): Record<string, unknown>[];
