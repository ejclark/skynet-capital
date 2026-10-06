import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import { guardDeltaFor } from "./guard-delta.js";
import type { EquitySample } from "./history-store.js";
import { optionContractLine } from "./option-contract-line.js";
import { optionFillCost, optionFillCostWords } from "./option-fill-cost.js";
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
 * Deliberately never copies `outcome.result.status` onto the member surface: it is a snapshot from
 * the moment of submit — an order logged `"working"` stays `"working"` until the bot's settle loop
 * sees the broker end it and the store reads its settlement in its place (#4650), which a restart
 * or a dark store can delay (and before #4655 an accepted order read `"filled"` with no price) —
 * so the broker's own ledger row stays the source of the status here. Only `reason`,
 * `strategy`, `expectation`, and the raw→guarded clamp ("guard-delta") are honest at any time —
 * and an option order's dollar cost, which is read only off a `filled` result: written once the
 * broker has ended the order (`alpaca-option-result.ts`, or a late settlement), so it can never
 * move again.
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
  /** THE ROUND THIS FILL CAME OUT OF (#3961) — the `at` its `DecisionCycle` carries, so a fill can
   *  link to the whole pass that placed it (the pass's siblings, its refused ideas, its counts)
   *  instead of ending at this one order's sentence. Absent only for a record with an unreadable
   *  timestamp, never fabricated. */
  readonly cycleAt?: string;
  /** The round's funnel, the pair `CycleRow` renders as "N ideas → M past the guards": how many
   *  intents the persona raised that pass, and how many survived the risk guards. A fill shows the
   *  count inline; the whole round stays one link away (`docs/IA.md` §8.1 — one home per fact). */
  readonly rawCount?: number;
  readonly guardedCount?: number;
  /** An option order as a whole, in words (`optionContractLine`) — a spread as the spread, not
   *  one leg. Absent for shares. */
  readonly contract?: string;
  /** What a filled option order cost or brought in, in dollars (`optionFillCostWords`). Absent for
   *  shares, and for an option whose fill the decision record never confirmed. */
  readonly cost?: string;
  /** What would prove the trade wrong, in the playbook's own words (`OrderForecast.invalidator`). */
  readonly invalidator?: string;
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
  const contract = optionContractLine(intent);
  // The store hands back the outcome's own intent, so its result is found by identity.
  const cost = optionFillCost(intent, record.outcomes.find((o) => o.intent === intent)?.result);
  const invalidator = intent.forecast?.invalidator;
  // The round's own id is its timestamp, formatted exactly as `decisionCyclesView` formats it —
  // the two must match character for character or the link from a fill lands on no row.
  const cycleAt = Number.isFinite(record.at) ? new Date(record.at).toISOString() : undefined;
  return {
    reason: intent.reason,
    personaId: record.personaId,
    ...(cycleAt ? { cycleAt } : {}),
    rawCount: record.rawIntents.length,
    guardedCount: record.guardedIntents.length,
    ...(intent.playbookId ? { playbookId: intent.playbookId } : {}),
    ...(intent.playbookMode ? { playbookMode: intent.playbookMode } : {}),
    ...(intent.strategy ? { strategy: intent.strategy } : {}),
    ...(intent.expectation ? { expectation: intent.expectation } : {}),
    ...(guardDelta ? { guardDelta } : {}),
    ...(contract ? { contract } : {}),
    ...(cost ? { cost: optionFillCostWords(cost) } : {}),
    ...(invalidator ? { invalidator } : {}),
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
