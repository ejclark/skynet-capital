import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import { guardDeltaFor } from "./guard-delta.js";
import type { EquitySample } from "./history-store.js";
import { type WireTradeVitals, wireTradeVitals } from "./vitals.js";
import type { WireTradeRow } from "./wire-data.js";

/**
 * Attaches "the why" and "the vitals" to a bot's own wire rows (PR 6, issue #2287) — the join the
 * plan names as the whole point of widening `WireTradeRow` with `orderId`: an EXACT
 * `DecisionDb.findByOrderId` lookup rather than `decision-context.ts`'s fuzzy symbol+side+time
 * match, so beta-scout's trades (recorded under `personaId: "beta-scout"` but submitted on
 * Sauron's broker — a per-persona index would miss them) still resolve correctly: the join key is
 * the order id, never the wire row's `participantId`.
 *
 * Deliberately never copies `outcome.result.status` onto the member surface: the broker adapter
 * reports an accepted market order as `"filled"` with no price, and an order Alpaca later cancels
 * stays `"filled"` forever in that field — copying it would move a lie here. Only `reason`,
 * `strategy`, `expectation`, and the raw→guarded clamp ("guard-delta") are honest at any time.
 */

export interface WireTradeReasoning {
  readonly reason: string;
  readonly strategy?: string;
  readonly expectation?: string;
  /** Set only when the risk guards resized the persona's raw ask before it reached the broker. */
  readonly guardDelta?: string;
  /** The playbook that fired it, when one did (#885 attribution). */
  readonly playbookId?: string;
  readonly playbookMode?: string;
  /** Whose decision this was — not always the account's own: beta-scout trades on Sauron's. */
  readonly personaId: string;
}

export interface WireTradeWithReasoning extends WireTradeRow {
  /** Absent for a human trade, or a bot trade whose decision wasn't found (predates the audit
   *  trail, or the store is unwired) — never fabricated. */
  readonly reasoning?: WireTradeReasoning;
  readonly vitals?: WireTradeVitals;
}

export interface WireReasoningDeps {
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
  /** One participant's equity history, keyed by participant id — supplied pre-fetched so this
   *  function stays synchronous and pure; the route layer owns the I/O. */
  readonly historyByParticipant?: ReadonlyMap<string, readonly EquitySample[]>;
}

/** The exact-order-id reasoning join, standalone — shared by `attachWireReasoning` (per wire row)
 *  and the Thesis tab's marker reasoning (per trade fill, `thesis-json-view.ts`), so both surfaces
 *  build the same honest shape from the same lookup rather than each re-deriving it. Absent when
 *  no lookup is configured or no decision resolves for this order id — never fabricated. */
export function reasoningForOrder(
  orderId: string,
  deps: WireReasoningDeps,
): WireTradeReasoning | undefined {
  if (!deps.findByOrderId) return undefined;
  const found = deps.findByOrderId(orderId);
  if (!found) return undefined;
  const { record, intent } = found;
  const guardDelta = guardDeltaFor(record, intent);
  return {
    reason: intent.reason,
    personaId: record.personaId,
    ...(intent.playbookId ? { playbookId: intent.playbookId } : {}),
    ...(intent.playbookMode ? { playbookMode: intent.playbookMode } : {}),
    ...(intent.strategy ? { strategy: intent.strategy } : {}),
    ...(intent.expectation ? { expectation: intent.expectation } : {}),
    ...(guardDelta ? { guardDelta } : {}),
  };
}

/** Enriches every BOT row with reasoning/vitals when a decision is found; human rows and
 *  unresolved bot rows pass through unchanged (both fields simply absent — an honest omission,
 *  never a placeholder object). */
export function attachWireReasoning(
  rows: readonly WireTradeRow[],
  deps: WireReasoningDeps,
): WireTradeWithReasoning[] {
  return rows.map((row) => {
    if (row.kind !== "bot") return row;
    const reasoning = reasoningForOrder(row.orderId, deps);
    if (!reasoning) return row;
    const samples = deps.historyByParticipant?.get(row.participantId);
    return {
      ...row,
      reasoning,
      ...(samples ? { vitals: wireTradeVitals(samples, row.at) } : {}),
    };
  });
}
