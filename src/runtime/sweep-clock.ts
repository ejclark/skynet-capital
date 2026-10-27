/**
 * THE SWEEP CLOCK: one pass now, then one every `everyMs`, and never two at once. A tick that lands
 * while a pass is still running is skipped, and the next tick runs. Shared by the two processes that
 * ask Alpaca what happened to their accounts' contracts: the bots, into the decision store
 * (`scripts/autonomous-option-wiring.ts`), and the dashboard, into the activity ledger
 * (`scripts/dashboard-option-lifecycle.ts`).
 */

/** How often each account is asked what happened to its contracts. Expiries and assignments post
 *  after the close, so half-hourly is ample; two reads an hour per account cost nothing. */
export const OPTION_LIFECYCLE_SWEEP_MS = 30 * 60_000;

/** A pass handles its own failures. One that rejects anyway is reported by error NAME only (an error
 *  message can carry a URL or a header) and the clock keeps running. Returns the timer so a caller
 *  (a spec) can stop it. */
export function armSweepClock(
  pass: () => Promise<unknown>,
  everyMs = OPTION_LIFECYCLE_SWEEP_MS,
): ReturnType<typeof setInterval> {
  let running = false;
  const tick = () => {
    if (running) return;
    running = true;
    void pass()
      .catch((error: unknown) =>
        process.emitWarning(
          `[sweep] a pass failed: ${error instanceof Error ? error.name : typeof error}`,
        ),
      )
      .finally(() => {
        running = false;
      });
  };
  tick();
  return setInterval(tick, everyMs);
}
