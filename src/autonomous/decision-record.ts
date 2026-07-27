import type { OrderIntent, OrderResult } from "../domain/types.js";

/**
 * The autonomy audit trail (Phase 0 of `docs/AUTONOMY-PLAN.md`). Every autonomous decision cycle —
 * whether it placed an order or merely OBSERVED — produces a `DecisionRecord`: the raw persona
 * intents, what the risk guards did to them, and what happened to each. This is the durable,
 * replayable record the readiness review, the kill-switch/breakers, and the observability view all
 * read from. Nothing about it depends on placing a real order, so the whole trail is exercised in
 * observe mode with no credential.
 */

/** What the trader did with a single guarded intent this cycle. */
export type CycleAction = "placed" | "rejected" | "observed" | "cooldown-skipped";

export interface IntentOutcome {
  readonly intent: OrderIntent;
  readonly action: CycleAction;
  /** The broker result — present only when the order was actually submitted (placed/rejected). */
  readonly result?: OrderResult;
}

export interface DecisionRecord {
  /** Epoch ms the cycle was evaluated. */
  readonly at: number;
  readonly personaId: string;
  /** `observe` = decided and logged but placed nothing; `live` = orders were submitted. */
  readonly mode: "observe" | "live";
  /** Straight from `persona.decide` — before any risk clamping. */
  readonly rawIntents: readonly OrderIntent[];
  /** After `applyGuards` — what risk sizing left standing. */
  readonly guardedIntents: readonly OrderIntent[];
  /** Per guarded intent, what happened to it this cycle. */
  readonly outcomes: readonly IntentOutcome[];
  /** Set when the cycle was blocked by the kill switch / a circuit breaker — nothing was decided. */
  readonly halted?: string;
}

/** A place to persist decision records. Implementations must never throw on the write path. */
export interface AuditStore {
  record(entry: DecisionRecord): Promise<void>;
  list(personaId?: string): Promise<DecisionRecord[]>;
}
