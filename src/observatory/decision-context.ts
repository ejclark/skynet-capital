import type { DecisionRecord, IntentOutcome } from "../autonomous/decision-record.js";

/**
 * WHY DID THAT TRADE FIRE? — correlate an order in the activity ledger with the autonomous
 * decision cycle that produced it, so the history view can put a bot's own stated reasoning one
 * click away from each row (Eric, 2026-08-20: full context inline is too much; "a click or two
 * away … could be powerful").
 *
 * The audit trail (`DecisionRecord`) and the broker's order record don't share an id — the runner
 * logs intents, the broker logs orders. So the match is by **symbol + side + time proximity**:
 * the nearest decision cycle (within a tolerance) whose outcomes include this order's symbol and
 * side. That is honest-but-fuzzy, and the view says so ("matched from the decision log") rather
 * than presenting the join as exact. A same-symbol same-side order placed by hand seconds around
 * a bot cycle could mismatch; on a bot's own desk that ambiguity is effectively nil.
 */

export interface DecisionContext {
  /** Epoch ms of the decision cycle. */
  readonly cycleAt: number;
  readonly mode: "observe" | "live";
  /** What the cycle did with this intent (placed / observed / cooldown-skipped / rejected). */
  readonly action: string;
  /** The persona's own stated reason for the intent — the heart of the context. */
  readonly reason: string;
  readonly playbookId?: string;
  readonly playbookMode?: string;
  /** Set when risk guards resized the persona's ask (raw quantity → guarded quantity). */
  readonly guardNote?: string;
  /** Structured strategy tag (e.g. "hc-panic-claim") — research modes label every trade. */
  readonly strategy?: string;
  /** The forward thesis: how the market was expected to behave, and what invalidates it. */
  readonly expectation?: string;
}

/** How far an order fill may land from its decision cycle and still match (fills trail cycles by
 *  seconds; minutes of skew tolerated for partial fills and clock drift). */
const MATCH_TOLERANCE_MS = 15 * 60 * 1000;

function matchesOrder(outcome: IntentOutcome, order: { symbol: string; side: string }): boolean {
  return outcome.intent.symbol === order.symbol && outcome.intent.side === order.side;
}

/** The guard note when the raw ask differs from what the guards let through. */
function guardNote(record: DecisionRecord, outcome: IntentOutcome): string | undefined {
  const raw = record.rawIntents.find(
    (i) => i.symbol === outcome.intent.symbol && i.side === outcome.intent.side,
  );
  if (!raw || raw.quantity === outcome.intent.quantity) return undefined;
  return `persona asked for ${raw.quantity}, risk guards sized it to ${outcome.intent.quantity}`;
}

/**
 * The decision context behind one order, or undefined when no cycle plausibly produced it
 * (a human's order, a bot order predating the audit trail, or no audit dir configured).
 */
export function decisionContextFor(
  order: { readonly symbol: string; readonly side: string; readonly at: string },
  decisions: readonly DecisionRecord[],
): DecisionContext | undefined {
  const orderAt = new Date(order.at).getTime();
  if (!Number.isFinite(orderAt)) return undefined;

  let best: { record: DecisionRecord; outcome: IntentOutcome; distance: number } | undefined;
  for (const record of decisions) {
    const distance = Math.abs(record.at - orderAt);
    if (distance > MATCH_TOLERANCE_MS) continue;
    const outcome = record.outcomes.find((o) => matchesOrder(o, order));
    if (!outcome) continue;
    if (!best || distance < best.distance) {
      best = { record, outcome, distance };
    }
  }
  if (!best) return undefined;

  const { record, outcome } = best;
  const note = guardNote(record, outcome);
  return {
    cycleAt: record.at,
    mode: record.mode,
    action: outcome.action,
    reason: outcome.intent.reason,
    ...(outcome.intent.playbookId ? { playbookId: outcome.intent.playbookId } : {}),
    ...(outcome.intent.playbookMode ? { playbookMode: outcome.intent.playbookMode } : {}),
    ...(outcome.intent.strategy ? { strategy: outcome.intent.strategy } : {}),
    ...(outcome.intent.expectation ? { expectation: outcome.intent.expectation } : {}),
    ...(note ? { guardNote: note } : {}),
  };
}
