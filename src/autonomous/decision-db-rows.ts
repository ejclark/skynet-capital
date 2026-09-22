import type {
  MarketContext,
  OrderForecast,
  OrderIntent,
  PlaybookMode,
  Side,
} from "../domain/types.js";
import type { GuardRefusal, GuardRefusalReason } from "../engine/guards.js";
import type { DecisionRecord, IntentOutcome } from "./decision-record.js";

/**
 * Pure row<->`DecisionRecord` conversion for `decision-db.ts` — split out so the SQL orchestration
 * file stays under the architecture fitness cap (`scripts/arch-scan.mjs`), and so the raw-intent
 * matching logic (the one genuinely tricky part of this store) is unit-testable with no database
 * at all. See `decision-db.ts`'s module doc for why one `intents` row is stored per RAW intent.
 */

export interface StoredIntentRow {
  readonly symbol: string;
  readonly side: Side;
  readonly rawQuantity: number;
  readonly reason: string;
  readonly strategy?: string;
  readonly expectation?: string;
  readonly forecast?: OrderForecast;
  readonly playbookId?: string;
  readonly playbookMode?: PlaybookMode;
  readonly momentum?: number;
  readonly sentiment?: number;
  /** Present only when this raw intent was refused outright. */
  readonly guardReason?: GuardRefusalReason;
  /** Present only when it survived guards — the guarded (post-clamp) quantity. */
  readonly approvedQuantity?: number;
  readonly action?: IntentOutcome["action"];
  readonly orderId?: string;
  readonly resultStatus?: string;
  readonly filledQuantity?: number;
  readonly filledPrice?: number;
}

/** The flat positional tuple `decision-db.ts`'s `insertIntent` prepared statement binds, in
 *  column order — kept as an array (not an object) so a caller can `.run(...params)` directly. */
export type IntentInsertParams = readonly [
  symbol: string,
  side: string,
  rawQuantity: number,
  reason: string,
  strategy: string | null,
  expectation: string | null,
  forecastJson: string | null,
  playbookId: string | null,
  playbookMode: string | null,
  momentum: number | null,
  sentiment: number | null,
  guardReason: string | null,
  approvedQuantity: number | null,
  action: string | null,
  orderId: string | null,
  resultStatus: string | null,
  filledQuantity: number | null,
  filledPrice: number | null,
];

/**
 * Build the insert params for one raw intent, matching it to its fate first.
 *
 * `applyGuardsWithVerdicts` pushes the loop's own raw-intent reference into `refused`, so a
 * refusal match is an exact `===` — no ambiguity. `clampBuy`/`clampSell` always return a NEW
 * spread object on success (even when the quantity is unchanged), so an approved intent can never
 * be matched to its raw ask by reference; this falls back to the same best-effort symbol+side
 * match `decision-context.ts`'s `guardNote` already uses elsewhere in this codebase — consistent
 * with existing house practice, not a new invented ambiguity. `usedOutcomes` prevents the same
 * outcome row from being claimed by two raw intents that happen to share a symbol+side (already
 * rare — a persona emits at most one intent per symbol per side per cycle in every persona this
 * repo ships — and this makes the rare case fail safe: the second raw intent simply matches
 * nothing rather than double-counting a fill).
 */
export function paramsForRawIntent(
  raw: OrderIntent,
  entry: Pick<DecisionRecord, "outcomes" | "refusals" | "context">,
  usedOutcomes: Set<number>,
): IntentInsertParams {
  const momentum = entry.context?.momentum?.[raw.symbol] ?? null;
  const sentiment = entry.context?.newsSentiment?.[raw.symbol] ?? null;
  const common = [
    raw.symbol,
    raw.side,
    raw.quantity,
    raw.reason,
    raw.strategy ?? null,
    raw.expectation ?? null,
    raw.forecast ? JSON.stringify(raw.forecast) : null,
    raw.playbookId ?? null,
    raw.playbookMode ?? null,
    momentum,
    sentiment,
  ] as const;

  const refusal = entry.refusals?.find((r: GuardRefusal) => r.intent === raw);
  if (refusal) {
    return [...common, refusal.reason, null, null, null, null, null, null];
  }

  const outcomeIndex = entry.outcomes.findIndex(
    (o, i) => !usedOutcomes.has(i) && o.intent.symbol === raw.symbol && o.intent.side === raw.side,
  );
  const outcome = outcomeIndex >= 0 ? entry.outcomes[outcomeIndex] : undefined;
  if (outcomeIndex >= 0) usedOutcomes.add(outcomeIndex);

  return [
    ...common,
    null,
    outcome?.intent.quantity ?? raw.quantity,
    outcome?.action ?? null,
    outcome?.result?.orderId ?? null,
    outcome?.result?.status ?? null,
    outcome?.result?.filledQuantity ?? null,
    outcome?.result?.filledPrice ?? null,
  ];
}

/** Parse one `intents` table row (as returned by `better-sqlite3`/`node:sqlite`'s `.get()`/`.all()`,
 *  snake_case columns, `null` for absent) into the honest, optional-field `StoredIntentRow` shape. */
export function intentRowToStored(row: Record<string, unknown>): StoredIntentRow {
  return {
    symbol: row.symbol as string,
    side: row.side as Side,
    rawQuantity: row.raw_quantity as number,
    reason: row.reason as string,
    ...(row.strategy ? { strategy: row.strategy as string } : {}),
    ...(row.expectation ? { expectation: row.expectation as string } : {}),
    ...(row.forecast_json ? { forecast: JSON.parse(row.forecast_json as string) } : {}),
    ...(row.playbook_id ? { playbookId: row.playbook_id as string } : {}),
    ...(row.playbook_mode ? { playbookMode: row.playbook_mode as PlaybookMode } : {}),
    ...(row.momentum !== null && row.momentum !== undefined
      ? { momentum: row.momentum as number }
      : {}),
    ...(row.sentiment !== null && row.sentiment !== undefined
      ? { sentiment: row.sentiment as number }
      : {}),
    ...(row.guard_reason ? { guardReason: row.guard_reason as GuardRefusalReason } : {}),
    ...(row.approved_quantity !== null && row.approved_quantity !== undefined
      ? { approvedQuantity: row.approved_quantity as number }
      : {}),
    ...(row.action ? { action: row.action as IntentOutcome["action"] } : {}),
    ...(row.order_id ? { orderId: row.order_id as string } : {}),
    ...(row.result_status ? { resultStatus: row.result_status as string } : {}),
    ...(row.filled_quantity !== null && row.filled_quantity !== undefined
      ? { filledQuantity: row.filled_quantity as number }
      : {}),
    ...(row.filled_price !== null && row.filled_price !== undefined
      ? { filledPrice: row.filled_price as number }
      : {}),
  };
}

/** Rebuild the `OrderIntent` one stored row carries — the raw shape for a refusal, the approved
 *  (guarded) shape otherwise; `quantity` is supplied by the caller since it differs between them. */
function intentFrom(row: StoredIntentRow, quantity: number): OrderIntent {
  return {
    symbol: row.symbol,
    side: row.side,
    quantity,
    type: "market",
    reason: row.reason,
    ...(row.strategy ? { strategy: row.strategy } : {}),
    ...(row.expectation ? { expectation: row.expectation } : {}),
    ...(row.forecast ? { forecast: row.forecast } : {}),
    ...(row.playbookId ? { playbookId: row.playbookId } : {}),
    ...(row.playbookMode ? { playbookMode: row.playbookMode } : {}),
  };
}

/** The outcome half of one approved row's reconstruction — split out of `decisionFrom` purely to
 *  stay under the file's cognitive-complexity budget. */
function outcomeFrom(row: StoredIntentRow, guarded: OrderIntent): IntentOutcome {
  return {
    intent: guarded,
    action: (row.action ?? "observed") as IntentOutcome["action"],
    ...(row.orderId || row.resultStatus
      ? {
          result: {
            intent: guarded,
            status: (row.resultStatus ?? "rejected") as "filled" | "rejected",
            ...(row.orderId ? { orderId: row.orderId } : {}),
            ...(row.filledQuantity !== undefined ? { filledQuantity: row.filledQuantity } : {}),
            ...(row.filledPrice !== undefined ? { filledPrice: row.filledPrice } : {}),
          },
        }
      : {}),
  };
}

/** Reassemble one `DecisionRecord` from its `decisions` row plus every `intents` row it owns —
 *  the exact inverse of `paramsForRawIntent`. */
export function decisionFrom(
  at: number,
  personaId: string,
  mode: "observe" | "live",
  halted: string | null,
  contextJson: string | null,
  intentRows: readonly StoredIntentRow[],
): DecisionRecord {
  const rawIntents: OrderIntent[] = [];
  const guardedIntents: OrderIntent[] = [];
  const outcomes: IntentOutcome[] = [];
  const refusals: GuardRefusal[] = [];
  for (const row of intentRows) {
    const raw = intentFrom(row, row.rawQuantity);
    rawIntents.push(raw);
    if (row.guardReason) {
      refusals.push({ intent: raw, reason: row.guardReason });
      continue;
    }
    const guarded = intentFrom(row, row.approvedQuantity ?? row.rawQuantity);
    guardedIntents.push(guarded);
    outcomes.push(outcomeFrom(row, guarded));
  }
  return {
    at,
    personaId,
    mode,
    rawIntents,
    guardedIntents,
    outcomes,
    ...(halted ? { halted } : {}),
    ...(contextJson ? { context: JSON.parse(contextJson) as MarketContext } : {}),
    ...(refusals.length > 0 ? { refusals } : {}),
  };
}
