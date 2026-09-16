// Type surface for circuit-breaker.mjs — same arrangement as events.d.mts and code-lines.d.mts:
// the scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this.

export interface BreakerConfig {
  readonly maxSpendUsd: number;
  readonly windowHours: number;
  readonly trackingIssue: number;
  readonly trippedLabel: string;
}

/** An injectable stand-in for `child_process.execFileSync`, used so specs can fake `gh` output
 *  without touching the network. */
export type Exec = (cmd: string, args: readonly string[], opts?: Record<string, unknown>) => string;

/** Fail-closed read of research-circuit-breaker.json. Throws on a missing file or any malformed
 *  field — the breaker's own config must never read as "no breaker". */
export function loadBreakerConfig(file?: string): BreakerConfig;

/** Whether the breaker is currently tripped, per the GitHub issue label (never a committed file).
 *  Throws if the query itself fails — an unreadable state must never read as "clear". */
export function isBreakerTripped(opts: {
  trackingIssue: number;
  trippedLabel: string;
  exec?: Exec;
}): boolean;

/** Total `total_cost_usd` across every research session's run log within the rolling window.
 *  Throws on any unreadable run — an undercounted total is worse than a loud refusal. */
export function recentResearchSpend(opts: { windowHours: number; exec?: Exec }): number;

/** Applies the tripped label (creating it if absent) and posts one explanatory comment naming the
 *  measured spend, threshold and window. */
export function tripBreaker(opts: {
  trackingIssue: number;
  trippedLabel: string;
  spentUsd: number;
  maxSpendUsd: number;
  windowHours: number;
  exec?: Exec;
}): void;

/** The one entry point the workflow calls. Checks the label first (cheap, no spend query when
 *  already tripped); if clear, measures spend and trips the breaker on crossing the threshold.
 *  Never throws on a normal trip — only when the breaker's own machinery is broken. */
export function checkCircuitBreaker(opts?: { config?: BreakerConfig; exec?: Exec }): {
  dispatch: boolean;
  reason: string;
};
