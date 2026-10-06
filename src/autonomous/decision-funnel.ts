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

/** The narrow row shape `DecisionDb.funnelFor` reads back. `count` lets the SQL-backed caller pass
 *  `GROUP BY` totals (one row per distinct outcome, not per intent — #4612 slice 7, defect #9) —
 *  it defaults to 1 for a caller passing one row per intent, as every test here does. */
export interface FunnelIntentRow {
  readonly guardReason: GuardRefusalReason | null;
  readonly action: string | null;
  readonly resultStatus: string | null;
  readonly count?: number;
}

export function computeFunnel(
  cycles: number,
  closed: number,
  intentRows: readonly FunnelIntentRow[],
): DecisionFunnel {
  let rawIntents = 0;
  let survivedGuards = 0;
  let placed = 0;
  let filled = 0;
  const refusalsByReason: Partial<Record<GuardRefusalReason, number>> = {};

  for (const row of intentRows) {
    const n = row.count ?? 1;
    rawIntents += n;
    if (row.guardReason) {
      refusalsByReason[row.guardReason] = (refusalsByReason[row.guardReason] ?? 0) + n;
      continue;
    }
    survivedGuards += n;
    if (row.action === "placed") placed += n;
    if (row.resultStatus === "filled") filled += n;
  }

  return {
    cycles,
    rawIntents,
    survivedGuards,
    placed,
    filled,
    closed,
    refusalsByReason,
  };
}
