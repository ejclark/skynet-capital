import type { MarketContext, OrderIntent, OrderResult } from "../domain/types.js";
import type { GuardRefusal } from "../engine/guards.js";

/**
 * The autonomy audit trail (Phase 0 of `docs/AUTONOMY-PLAN.md`). Every autonomous decision cycle —
 * whether it placed an order or merely OBSERVED — produces a `DecisionRecord`: the raw persona
 * intents, what the risk guards did to them, and what happened to each. This is the durable,
 * replayable record the readiness review, the kill-switch/breakers, and the observability view all
 * read from. Nothing about it depends on placing a real order, so the whole trail is exercised in
 * observe mode with no credential.
 */

/** What the trader did with a single guarded intent this cycle. */
type CycleAction = "placed" | "rejected" | "observed" | "cooldown-skipped";

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
  /**
   * The market state the persona actually reasoned over this cycle — the critical-path field
   * every signal-decay/MAE-MFE/regime-conditioning analytics measure blocks on
   * (`docs/plans/where-are-we-documenting-*.md`). Every cycle recorded without it is a
   * permanently unrecoverable observation, so this is captured even on a halted or quiet cycle.
   * Optional because records written before this field existed have none — that MUST render as
   * "not captured", never as an empty/synthetic context.
   */
  readonly context?: MarketContext;
  /**
   * Every raw intent the risk guards refused outright this cycle, with which rule fired —
   * `applyGuardsWithVerdicts`'s additive half. `rawIntents.length - guardedIntents.length` always
   * equals this array's length when both are present. Optional for the same backward-compat
   * reason as `context`: a record written before this field existed has none.
   */
  readonly refusals?: readonly GuardRefusal[];
}

/** A place to persist decision records. Implementations must never throw on the write path. */
export interface AuditStore {
  record(entry: DecisionRecord): Promise<void>;
  list(personaId?: string): Promise<DecisionRecord[]>;
}
