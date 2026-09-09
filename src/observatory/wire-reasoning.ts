import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
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
}

export interface WireTradeWithReasoning extends WireTradeRow {
  /** Absent for a human trade, or a bot trade whose decision wasn't found (predates the audit
   *  trail, or the store is unwired) — never fabricated. */
  readonly reasoning?: WireTradeReasoning;
  readonly vitals?: WireTradeVitals;
}

function guardDeltaFor(record: DecisionRecord, intent: OrderIntent): string | undefined {
  const raw = record.rawIntents.find((i) => i.symbol === intent.symbol && i.side === intent.side);
  if (!raw || raw.quantity === intent.quantity) return undefined;
  return `persona asked for ${raw.quantity}, risk guards sized it to ${intent.quantity}`;
}

export interface WireReasoningDeps {
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
  /** One participant's equity history, keyed by participant id — supplied pre-fetched so this
   *  function stays synchronous and pure; the route layer owns the I/O. */
  readonly historyByParticipant?: ReadonlyMap<string, readonly EquitySample[]>;
}

/** Enriches every BOT row with reasoning/vitals when a decision is found; human rows and
 *  unresolved bot rows pass through unchanged (both fields simply absent — an honest omission,
 *  never a placeholder object). */
export function attachWireReasoning(
  rows: readonly WireTradeRow[],
  deps: WireReasoningDeps,
): WireTradeWithReasoning[] {
  return rows.map((row) => {
    if (row.kind !== "bot" || !deps.findByOrderId) return row;
    const found = deps.findByOrderId(row.orderId);
    if (!found) return row;
    const { record, intent } = found;
    const guardDelta = guardDeltaFor(record, intent);
    const reasoning: WireTradeReasoning = {
      reason: intent.reason,
      ...(intent.strategy ? { strategy: intent.strategy } : {}),
      ...(intent.expectation ? { expectation: intent.expectation } : {}),
      ...(guardDelta ? { guardDelta } : {}),
    };
    const samples = deps.historyByParticipant?.get(row.participantId);
    return {
      ...row,
      reasoning,
      ...(samples ? { vitals: wireTradeVitals(samples, row.at) } : {}),
    };
  });
}
