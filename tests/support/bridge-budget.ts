/**
 * The fetch budget for a spec that runs a bots-side bridge client (controls, credentials, snapshot,
 * cond-scout, insight, decision replication) against a real listener in the same worker.
 *
 * The listener and the client share one event loop with whatever else the full suite is running in
 * that worker. Under that load the prod 2s `BRIDGE_REQUEST_TIMEOUT_MS` once expired before a
 * localhost reply was read, and `fetchOnce()` failed open to `null` (#4978). So these round trips
 * get a budget just under rstest's 5s test timeout. Shared rather than copied so every bridge spec
 * inherits it; `tests/autonomous/bot-controls-client.spec.ts` and
 * `tests/autonomous/bridge-client-budget.spec.ts` (#5823) prove each client honours a budget and
 * fails open.
 */
export const LOADED_SUITE_BRIDGE_BUDGET = { timeoutMs: 4_000 } as const;
