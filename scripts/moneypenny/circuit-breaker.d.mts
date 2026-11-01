// Type surface for circuit-breaker.mjs — same arrangement as events.d.mts and code-lines.d.mts:
// the scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this.

export interface BreakerConfig {
  /** The line at every dial position but surge. */
  readonly maxSpendUsd: number;
  /** Surge's own line, never below `maxSpendUsd` (#6020, Eric's A2). */
  readonly maxSpendUsdAtSurge: number;
  readonly windowHours: number;
  readonly trackingIssue: number;
  readonly trippedLabel: string;
}

/** The cost line as a run log renders it: `##[notice]cost — event=<id> usd=<n> …` (or the echoed
 *  `::notice::` form, which carries no number). Global, so `matchAll` walks a whole log. */
export const COST_LINE: RegExp;

/** How many `workflow_dispatch` runs `recentResearchSpend` lists. */
export const RUN_LIST_LIMIT: number;

/** How long before the window a run may have started and still have a leg finish inside it. */
export const LEG_SLACK_MS: number;

/** Pure: the `usd=` numbers summed over the cost lines in one log's text; with a window, a line
 *  counts by its own finish stamp (or by `fallbackMs` when it carries none). */
export function sumCostLines(
  log: string | null | undefined,
  window?: { sinceMs: number; untilMs: number; fallbackMs: number } | null,
): number;

/** Pure: the line the dial position is held to — surge's, or everyone else's. */
export function thresholdFor(
  position: string | null | undefined,
  config: Pick<BreakerConfig, "maxSpendUsd" | "maxSpendUsdAtSurge">,
): number;

/** An injectable stand-in for `child_process.execFileSync`, used so specs can fake `gh` output
 *  without touching the network. */
export type Exec = (cmd: string, args: readonly string[], opts?: Record<string, unknown>) => string;

/** The backoff between retries of a GitHub 5xx on a read — a spec passes a no-op. */
export type Sleep = (ms: number) => void;

/** Fail-closed read of research-circuit-breaker.json. Throws on a missing file or any malformed
 *  field — the breaker's own config must never read as "no breaker". */
export function loadBreakerConfig(file?: string): BreakerConfig;

/** Whether the breaker is currently tripped, per the GitHub issue label (never a committed file).
 *  Throws if the query itself fails — an unreadable state must never read as "clear". */
export function isBreakerTripped(opts: {
  trackingIssue: number;
  trippedLabel: string;
  exec?: Exec;
  sleep?: Sleep;
}): boolean;

/** Total `total_cost_usd` across every research session's run log within the rolling window.
 *  Throws on any unreadable run — an undercounted total is worse than a loud refusal. */
export function recentResearchSpend(opts: {
  windowHours: number;
  exec?: Exec;
  sleep?: Sleep;
  /** The window's end, in ms; `Date.now()` unless a cached window is being replayed. */
  now?: number;
}): number;

/** Applies the tripped label (creating it if absent), assigns the owner on the tracking issue, and
 *  posts one explanatory comment naming the measured spend, threshold, dial position and window. */
export function tripBreaker(opts: {
  trackingIssue: number;
  trippedLabel: string;
  spentUsd: number;
  maxSpendUsd: number;
  windowHours: number;
  position?: string;
  exec?: Exec;
}): void;

/** The one entry point the workflow calls. Checks the label first (cheap, no spend query when
 *  already tripped); if clear, measures spend, reads the dial for the line that applies, and
 *  trips the breaker on crossing it. Never throws on a normal trip — only when the breaker's own
 *  machinery is broken. */
export function checkCircuitBreaker(opts?: {
  config?: BreakerConfig;
  exec?: Exec;
  sleep?: Sleep;
  readMode?: () => { position?: string } | null | undefined;
}): {
  dispatch: boolean;
  reason: string;
};
