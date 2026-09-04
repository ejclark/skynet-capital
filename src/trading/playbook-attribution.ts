import type { PlaybookMode } from "../domain/types.js";

/**
 * PLAYBOOK ATTRIBUTION — closing the gap issue #885 named: `OrderIntent.playbookId`/`playbookMode`
 * already exist (`domain/types.ts`) and already reach decision recaps
 * (`observatory/decision-context.ts`), but never reached the persisted trade/round-trip record
 * (`trading/round-trips.ts`, `observatory/activity-store.ts`) — so per-playbook metrics had
 * nowhere to be computed from. This module is the join, on the same pattern
 * `domain/progression.ts` already uses for milestone tags: a durable side record (there,
 * `OrderAuditRecord`; here, the autonomous audit trail's own `DecisionRecord`) carries the
 * attribution keyed by the broker's order id, and a pure function joins it onto fills by that id
 * — never a second source of truth for risk or capital, purely descriptive metadata for later
 * analytics.
 *
 * Deliberately duck-typed against the autonomous layer's own shapes (`IntentOutcome`,
 * `DecisionRecord`) rather than importing them: `src/trading/*` stays free of any layer above it
 * (`round-trips.ts`'s own module doc), the same reason `progression.ts` says its `LadderFill`/
 * `LadderTag` are merely "structurally satisfied by" `TradeActivityRecord`/`OrderAuditRecord`
 * rather than importing those types directly.
 */

/** One order's outcome, as recorded on a `DecisionRecord` — structurally satisfied by
 *  `IntentOutcome` (`autonomous/decision-record.ts`). Only the two fields this join needs. */
export interface AttributableOutcome {
  readonly intent: {
    readonly playbookId?: string;
    readonly playbookMode?: PlaybookMode;
  };
  /** Present only when the order actually reached the broker (placed or rejected-after-accepted)
   *  — structurally satisfied by `OrderResult`. */
  readonly result?: {
    readonly orderId?: string;
  };
}

/** One order's playbook tag, keyed by the broker's own order id — the join key shared with
 *  `ActivityView.orderId`/`TradeActivityRecord.orderId`. */
export interface PlaybookTag {
  readonly orderId: string;
  readonly playbookId: string;
  readonly playbookMode?: PlaybookMode;
}

/**
 * Flatten a bot's decision-cycle outcomes into playbook tags. An outcome contributes a tag only
 * when it BOTH reached the broker (`result.orderId`) and carried playbook attribution
 * (`intent.playbookId`) — a bare persona reflex, a cooldown-skip, an `observe`-mode dry run, or a
 * submission the broker never assigned an id to all contribute nothing, honestly.
 */
export function playbookTagsFromOutcomes(outcomes: readonly AttributableOutcome[]): PlaybookTag[] {
  const tags: PlaybookTag[] = [];
  for (const outcome of outcomes) {
    const orderId = outcome.result?.orderId;
    const playbookId = outcome.intent.playbookId;
    if (!(orderId && playbookId)) continue;
    tags.push({
      orderId,
      playbookId,
      ...(outcome.intent.playbookMode ? { playbookMode: outcome.intent.playbookMode } : {}),
    });
  }
  return tags;
}

/** A lookup from broker order id to its playbook tag — build once per read, look up per fill. */
export type PlaybookTagsByOrder = ReadonlyMap<string, PlaybookTag>;

/** Index tags by order id, later tags winning on a duplicate id (there should never be one — an
 *  order id is the broker's own identity — but a last-write-wins fold is the honest, unsurprising
 *  choice if a caller ever hands in overlapping audit windows). */
export function indexPlaybookTags(tags: readonly PlaybookTag[]): PlaybookTagsByOrder {
  return new Map(tags.map((tag) => [tag.orderId, tag]));
}
