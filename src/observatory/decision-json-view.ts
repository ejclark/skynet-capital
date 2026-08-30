import type { DecisionRecord } from "../autonomous/decision-record.js";
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

type CycleStatus = "halted" | "placed" | "rejected" | "observed" | "quiet";

interface CycleOutcomeView {
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly playbook?: string;
  readonly reason: string;
  readonly action: "placed" | "rejected" | "observed" | "cooldown-skipped";
  readonly resultStatus?: string;
  readonly fill?: string;
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
  readonly halted?: string;
}

const CYCLE_CAP = 50;

function cycleStatus(record: DecisionRecord): CycleStatus {
  if (record.halted) return "halted";
  if (record.outcomes.some((o) => o.action === "placed")) return "placed";
  if (record.outcomes.some((o) => o.action === "rejected")) return "rejected";
  if (record.outcomes.length > 0) return "observed";
  return "quiet";
}

function cycleHeadline(record: DecisionRecord, status: CycleStatus): string {
  if (status === "halted") return record.halted ?? "halted";
  if (status === "quiet") return "no signals fired — watching";
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
          reason: outcome.intent.reason,
          action: outcome.action,
          ...(outcome.result ? { resultStatus: outcome.result.status } : {}),
          ...(outcome.result?.filledPrice !== undefined
            ? {
                fill: `${outcome.result.filledQuantity ?? outcome.intent.quantity} @ ${formatPrice(outcome.result.filledPrice)}`,
              }
            : {}),
        })),
        ...(record.halted ? { halted: record.halted } : {}),
      };
    });
}
