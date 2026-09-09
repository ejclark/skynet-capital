import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderForecast } from "../domain/types.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import { formatPrice } from "./desk-data.js";

/**
 * THE BOT'S MIND AS DATA — `/api/desk/:id/decisions`, the JSON view behind the
 * shell's decision-cycle viewer. The viewer is built on the Actions-run template (the pattern
 * research's strongest mapping): every cycle is a run row whose status is derivable at a glance,
 * expanding into what the persona wanted, what the guards left standing, and what happened.
 *
 * Honesty rules: the status never flatters — a halted cycle says why, a clamped intent shows the
 * raw→guarded delta rather than hiding the guard's work, and reasons ride verbatim (the persona's
 * own sentence is the record).
 */

type CycleStatus = "halted" | "placed" | "rejected" | "observed" | "refused" | "quiet";

interface CycleOutcomeView {
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly playbook?: string;
  readonly strategy?: string;
  readonly reason: string;
  readonly expectation?: string;
  readonly forecast?: OrderForecast;
  readonly action: "placed" | "rejected" | "observed" | "cooldown-skipped";
  readonly resultStatus?: string;
  readonly fill?: string;
}

/** Human-readable label per `GuardRefusalReason` — the exact finding a doctrine call sheet quotes
 *  ("Sauron wanted NVDA at −0.82 panic; S2 blocked it") reads from this, not the raw enum value. */
const REFUSAL_LABEL: Record<GuardRefusalReason, string> = {
  "ladder-block": "blocked by the risk ladder",
  "s2-print": "blocked by S2 (flat through the print)",
  "e1-open": "deferred by E1 (waiting out the open)",
  "subscription-filter": "outside the subscription's aimed symbols",
  "no-quote": "no live quote for the symbol",
  "insufficient-cash": "insufficient cash",
  "position-cap": "the per-position cap left no room",
  "subscription-budget": "the subscription's own budget was exhausted",
  "nothing-held": "nothing held to sell",
};

/** A raw intent the risk guards refused outright — nothing survived to become an `IntentOutcome`,
 *  so this is the persona's own ask, unfiltered. `guardReason` is present whenever
 *  `DecisionRecord.refusals` was captured (see `applyGuardsWithVerdicts`); absent for records
 *  written before that field existed, or for a path (beta-scout) that hasn't wired it yet — in
 *  which case this is honestly unattributed rather than guessed. */
interface RefusedIntentView {
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly strategy?: string;
  readonly reason: string;
  readonly expectation?: string;
  readonly guardReason?: string;
}

export interface DecisionCycleView {
  readonly at: string;
  readonly mode: "observe" | "live";
  readonly status: CycleStatus;
  /** The run row's one-line read: counts, or the halt reason verbatim. */
  readonly headline: string;
  readonly rawCount: number;
  readonly guardedCount: number;
  readonly outcomes: readonly CycleOutcomeView[];
  /** Populated only for `status: "refused"` — every raw intent the persona asked for that the
   *  guards dropped in full this cycle. Never present alongside a non-empty `outcomes`, so a
   *  reader can't mistake a partial clamp (already visible in `headline`'s "N clamped by guards")
   *  for a total refusal. */
  readonly refusedIntents?: readonly RefusedIntentView[];
  readonly halted?: string;
}

const CYCLE_CAP = 50;

function cycleStatus(record: DecisionRecord): CycleStatus {
  if (record.halted) return "halted";
  if (record.outcomes.some((o) => o.action === "placed")) return "placed";
  if (record.outcomes.some((o) => o.action === "rejected")) return "rejected";
  if (record.outcomes.length > 0) return "observed";
  // The persona fired but every raw intent was dropped by `applyGuards` (ladder BLOCK, S2/E1
  // discipline, the position cap all `continue` rather than return a reason) — a real signal the
  // house's own risk policy overrode, not silence. Distinct from "quiet": here `rawIntents.length`
  // is the count that matters, because `guardedIntents`/`outcomes` are both empty by construction.
  if (record.rawIntents.length > 0) return "refused";
  return "quiet";
}

function cycleHeadline(record: DecisionRecord, status: CycleStatus): string {
  if (status === "halted") return record.halted ?? "halted";
  if (status === "quiet") return "no signals fired — watching";
  if (status === "refused") {
    return `${record.rawIntents.length} refused by guards — nothing placed`;
  }
  const counts = new Map<string, number>();
  for (const outcome of record.outcomes) {
    counts.set(outcome.action, (counts.get(outcome.action) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(
    ([action, n]) => `${n} ${action.replace("cooldown-skipped", "cooldown-skipped")}`,
  );
  const clamped = record.rawIntents.length - record.guardedIntents.length;
  if (clamped > 0) parts.push(`${clamped} clamped by guards`);
  return parts.join(" · ");
}

export function decisionCyclesView(records: readonly DecisionRecord[]): DecisionCycleView[] {
  return [...records]
    .sort((a, b) => b.at - a.at)
    .slice(0, CYCLE_CAP)
    .map((record) => {
      const status = cycleStatus(record);
      return {
        at: new Date(record.at).toISOString(),
        mode: record.mode,
        status,
        headline: cycleHeadline(record, status),
        rawCount: record.rawIntents.length,
        guardedCount: record.guardedIntents.length,
        outcomes: record.outcomes.map((outcome) => ({
          symbol: outcome.intent.symbol,
          side: outcome.intent.side,
          quantity: outcome.intent.quantity,
          ...(outcome.intent.playbookId ? { playbook: outcome.intent.playbookId } : {}),
          ...(outcome.intent.strategy ? { strategy: outcome.intent.strategy } : {}),
          reason: outcome.intent.reason,
          ...(outcome.intent.expectation ? { expectation: outcome.intent.expectation } : {}),
          ...(outcome.intent.forecast ? { forecast: outcome.intent.forecast } : {}),
          action: outcome.action,
          ...(outcome.result ? { resultStatus: outcome.result.status } : {}),
          ...(outcome.result?.filledPrice !== undefined
            ? {
                fill: `${outcome.result.filledQuantity ?? outcome.intent.quantity} @ ${formatPrice(outcome.result.filledPrice)}`,
              }
            : {}),
        })),
        ...(status === "refused"
          ? {
              // Prefer the attributed set (`refusals`, from `applyGuardsWithVerdicts`) when this
              // record captured it; fall back to the bare raw intents (no guard named) for a
              // record written before that field existed, or a path that doesn't populate it yet.
              refusedIntents: (
                record.refusals ?? record.rawIntents.map((intent) => ({ intent }))
              ).map((r) => ({
                symbol: r.intent.symbol,
                side: r.intent.side,
                quantity: r.intent.quantity,
                ...(r.intent.strategy ? { strategy: r.intent.strategy } : {}),
                reason: r.intent.reason,
                ...(r.intent.expectation ? { expectation: r.intent.expectation } : {}),
                ...("reason" in r ? { guardReason: REFUSAL_LABEL[r.reason] } : {}),
              })),
            }
          : {}),
        ...(record.halted ? { halted: record.halted } : {}),
      };
    });
}
