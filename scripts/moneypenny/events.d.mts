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

/** One open `[event-research] <id>` issue, with the disk check for its ledger already joined in. */
export interface EventReceipt {
  readonly number: number;
  readonly title: string;
  readonly hasLedger: boolean;
}

/** An intent to close a receipt issue: `close-researched` (the ledger landed) or `close-obsolete`
 *  (the event left the research horizon and nothing can ever claim it). */
export interface CloseReceiptIntent {
  readonly kind: "close-researched" | "close-obsolete";
  readonly issueNumber: number;
  readonly title: string;
  readonly eventId: string;
  readonly body: string;
}

/** The event id a `[event-research] <id>` title tracks, or `undefined` if the title is not one. */
export function receiptEventId(title: unknown): string | undefined;

/**
 * Reconcile open receipt issues against ground truth (#2970): close the ones whose ledger is on
 * disk, close the ones no longer in `--due` that never produced one, and leave every still-due
 * receipt alone — deferral behind the dispatch cap must never read as obsolescence.
 */
export function routeReceipts(deps?: {
  openEventReceipts?: readonly EventReceipt[];
  dueEventIds?: readonly string[];
  closesPerTick?: number;
}): CloseReceiptIntent[];
