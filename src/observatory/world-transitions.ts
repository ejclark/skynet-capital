import type { EquitySample } from "./history-store.js";

/**
 * The ceremony source seam — docs/LIVING-UNIVERSE.md's transition vocabulary ("*took* profit,
 * *deployed* capital") derived purely from consecutive equity samples. This module is the load-
 * bearing half the vision doc says cannot be read from a snapshot; what a ceremony LOOKS like
 * (motion, fanfare) is a renderer concern and Eric's taste — nothing here renders.
 *
 * Signals, honestly sourced (asserted by specs):
 *  - took_profit  — cumulative realized P/L rose between samples: a win was actually booked.
 *  - deployed_capital — cash fell between samples: trades only move cash (market moves change
 *    equity, not cash), so a cash drop is capital committed. A buy+sell inside one sampling
 *    window nets out; the seam reports the net honestly rather than inventing detail.
 *
 * Doubling is deliberately NOT here — it needs the full history's seed baseline, and lives in
 * history-metrics.ts (`doubledAt`, `firstAccountToDouble`) where that context exists.
 */

export type WorldTransition =
  | {
      readonly type: "took_profit";
      readonly participantId: string;
      /** Realized P/L booked between the two samples (always > 0 here). */
      readonly realized: number;
      readonly at: string;
    }
  | {
      readonly type: "deployed_capital";
      readonly participantId: string;
      /** Net cash committed between the two samples (always > 0 here). */
      readonly committed: number;
      readonly at: string;
    };

export interface TransitionThresholds {
  /** Ignore realized gains at or below this (default 0 — any booked win counts). */
  readonly minRealized?: number;
  /** Ignore cash commitments below this fraction of prior equity (default 0.01 = 1%). */
  readonly minCommittedPct?: number;
}

/**
 * Derive the transitions between two consecutive samples of the SAME participant. Pure and
 * total; returns [] for mismatched participants or out-of-order samples rather than guessing.
 */
export function deriveTransitions(
  prev: EquitySample,
  next: EquitySample,
  thresholds: TransitionThresholds = {},
): WorldTransition[] {
  if (prev.participantId !== next.participantId || next.at <= prev.at) return [];
  const minRealized = thresholds.minRealized ?? 0;
  const minCommittedPct = thresholds.minCommittedPct ?? 0.01;
  const events: WorldTransition[] = [];

  const realized = next.realizedPl - prev.realizedPl;
  if (realized > minRealized) {
    events.push({
      type: "took_profit",
      participantId: next.participantId,
      realized,
      at: next.at,
    });
  }

  const committed = prev.cash - next.cash;
  if (committed > 0 && committed >= minCommittedPct * Math.max(prev.equity, 0)) {
    events.push({
      type: "deployed_capital",
      participantId: next.participantId,
      committed,
      at: next.at,
    });
  }

  return events;
}
