import type { GuardRefusalReason } from "../engine/guards.js";

/**
 * The decision funnel — measure #2 (#2287 PR 7b): "the operations dashboard for an autonomous
 * system." Answers "is it even firing?" and "what's the binding constraint?" from data already on
 * disk — pure accounting, no new capture. `DecisionDb.funnelFor` is the only caller; this file is
 * split out purely so that SQL-adjacent file stays under the architecture fitness cap.
 */

export interface DecisionFunnel {
  /** Total decision cycles ever recorded for this persona (`decisions` rows). */
  readonly cycles: number;
  /** Every raw intent the persona ever asked for, refused or not. */
  readonly rawIntents: number;
  /** Raw intents the risk guards let through (no `guard_reason`). */
  readonly survivedGuards: number;
  /** Guarded intents actually submitted to a broker. */
  readonly placed: number;
  /** Placed intents the broker confirmed filled. */
  readonly filled: number;
  /** Filled intents whose position has since closed (retrospectives rows). */
  readonly closed: number;
  /** Refused-outright intents, tallied by which guard fired. Only reasons that actually
   *  occurred are present — never a zero-padded full enum. */
  readonly refusalsByReason: Readonly<Partial<Record<GuardRefusalReason, number>>>;
}

/** The narrow row shape `DecisionDb.funnelFor` reads back — one row per intent ever recorded. */
export interface FunnelIntentRow {
  readonly guardReason: GuardRefusalReason | null;
  readonly action: string | null;
  readonly resultStatus: string | null;
}

export function computeFunnel(
  cycles: number,
  closed: number,
  intentRows: readonly FunnelIntentRow[],
): DecisionFunnel {
  let survivedGuards = 0;
  let placed = 0;
  let filled = 0;
  const refusalsByReason: Partial<Record<GuardRefusalReason, number>> = {};

  for (const row of intentRows) {
    if (row.guardReason) {
      refusalsByReason[row.guardReason] = (refusalsByReason[row.guardReason] ?? 0) + 1;
      continue;
    }
    survivedGuards++;
    if (row.action === "placed") placed++;
    if (row.resultStatus === "filled") filled++;
  }

  return {
    cycles,
    rawIntents: intentRows.length,
    survivedGuards,
    placed,
    filled,
    closed,
    refusalsByReason,
  };
}
