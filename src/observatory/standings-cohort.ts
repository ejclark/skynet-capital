import {
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * COHORT AGGREGATES — the bots-vs-humans read the Standings cards and the match bar are both drawn
 * from. Lifted out of `standings-view.ts` so the live patch producer (`standings-patch.ts`) can
 * recompute exactly the same figures without importing a view, and so the two can never disagree
 * about what "the cohort is up" means.
 *
 * Averages are per ACCOUNT, never totals — a cohort must not win the board on headcount alone.
 */

export interface CohortStats {
  readonly kind: "human" | "bot";
  readonly label: string;
  readonly count: number;
  readonly totalEquity: number;
  readonly avgEquity: number;
  readonly totalUnrealized: number;
  readonly returnPct: number;
  readonly breadthPct: number; // share of the cohort currently in profit
  readonly best?: { name: string; pct: number };
  readonly spread: number; // best return% − worst return%
}

export function cohortStats(
  participants: ParticipantSnapshot[],
  kind: "human" | "bot",
  label: string,
): CohortStats {
  const c = participants.filter((p) => p.kind === kind && !p.error);
  const count = c.length;
  const totalEquity = c.reduce((s, p) => s + p.equity, 0);
  const totalUnrealized = c.reduce((s, p) => s + participantUnrealized(p), 0);
  const totalInvested = c.reduce((s, p) => s + participantInvested(p), 0);
  const returns = c.map(participantReturnPct);
  const inProfit = c.filter((p) => participantUnrealized(p) >= 0).length;
  let best: { name: string; pct: number } | undefined;
  for (const p of c) {
    const pct = participantReturnPct(p);
    if (!best || pct > best.pct) best = { name: p.displayName, pct };
  }
  return {
    kind,
    label,
    count,
    totalEquity,
    avgEquity: count ? totalEquity / count : 0,
    totalUnrealized,
    returnPct: totalInvested > 0 ? (totalUnrealized / totalInvested) * 100 : 0,
    breadthPct: count ? (inProfit / count) * 100 : 0,
    best,
    spread: returns.length ? Math.max(...returns) - Math.min(...returns) : 0,
  };
}
