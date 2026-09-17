// Type surface for session-cost.mjs — same arrangement as circuit-breaker.d.mts: the scripts/
// tree is plain ESM with `allowJs` off, so a spec that imports from it needs this.

/** Where claude-code-action always writes the CLI's structured output, whatever the outcome. */
export const EXECUTION_OUTPUT: string;

/** Every field as a string; `"?"` wherever the file could not answer. `note` is empty on a clean
 *  read and otherwise names why the numbers are unknown. */
export interface SessionCost {
  readonly usd: string;
  readonly turns: string;
  readonly durationMs: string;
  readonly isError: string;
  readonly note: string;
}

/** The CLI's terminal `{"type":"result",…}` message, dug out of the stream-json array (the real
 *  shape) or a bare result object. Never throws. */
export function resultMessage(raw: string | null | undefined): {
  message: Record<string, unknown> | null;
  note: string;
};

/** What one session cost, ready for the log line. Never throws. */
export function sessionCost(raw: string | null | undefined): SessionCost;

/** The greppable `::notice::cost — event=<id> usd=<n> …` line. Format is a contract with
 *  circuit-breaker.mjs's `recentResearchSpend`. */
export function costNotice(eventId: string, cost: SessionCost): string;

/** One row of the per-tick step-summary table. */
export function costSummaryRow(eventId: string, cost: SessionCost): string;

/** The failure-path diagnostic: the result envelope only, never the session transcript. */
export function resultEnvelopeText(raw: string | null | undefined): string;

/** The CLI entry point. Returns 0 on every path — a meter never gates a job. */
export function main(argv?: readonly string[], env?: NodeJS.ProcessEnv): number;
