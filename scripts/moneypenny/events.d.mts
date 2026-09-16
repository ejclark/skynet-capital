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
 * The per-tick dispatch ceiling from research-dispatch-budget.json (#2946). Throws on a missing or
 * non-positive-integer `maxPerTick` — this gate fails closed, because an uncapped research batch
 * is the failure it exists to prevent.
 */
export function loadDispatchCap(file?: string): number;

/**
 * The rolling-24h ceiling from research-daily-budget.json (#2946, second incident — the per-tick
 * cap turned one burst into many small ones, but never bounded the day). Same fail-closed
 * doctrine as loadDispatchCap.
 */
export function loadDailyBudget(file?: string): number;

/**
 * The cap dueForResearch actually spends this tick: min(per-tick ceiling, what's left of today's
 * budget), floored at 0. All three inputs are independently overridable for tests.
 */
export function effectiveDispatchCap(opts?: {
  tickCap?: number;
  dailyCap?: number;
  dispatchedToday?: number;
}): number;

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
