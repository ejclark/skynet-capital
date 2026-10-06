import { instrumentKey } from "../domain/option-order.js";
import type {
  MarketContext,
  OptionLegFill,
  OptionOrderIntent,
  OrderForecast,
  OrderIntent,
  OrderStatus,
  PlaybookMode,
  PlaybookVerdict,
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

/** One intent's option order as stored in the side tables (`decision-db-options.ts`). The client
 *  order id and leg fills belong to the SUBMITTED order, so they are read back onto the outcome. */
export interface StoredOption {
  readonly option: OptionOrderIntent;
  readonly clientOrderId?: string;
  readonly legFills?: readonly OptionLegFill[];
}

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
  /** Present only on an option order. */
  readonly option?: StoredOption;
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

/** What became of one raw intent this cycle: refused outright, carried into an outcome, or neither
 *  (a record written before refusals were captured). */
export interface IntentFate {
  readonly refusal?: GuardRefusal;
  readonly outcome?: IntentOutcome;
}

/** JSON with sorted keys — the form two copies of one intent share however each was built. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

function claimRefusal(
  raw: OrderIntent,
  refusals: readonly GuardRefusal[],
  used: Set<number>,
): GuardRefusal | undefined {
  let index = refusals.findIndex((r, i) => !used.has(i) && r.intent === raw);
  if (index < 0) {
    const key = canonicalJson(raw);
    index = refusals.findIndex((r, i) => !used.has(i) && canonicalJson(r.intent) === key);
  }
  if (index < 0) return undefined;
  used.add(index);
  return refusals[index];
}

/**
 * Match one raw intent to its fate.
 *
 * Refusal: by reference first — `applyGuardsWithVerdicts` pushes the loop's own raw-intent
 * reference into `refused` — then STRUCTURALLY (the first unused refusal whose intent JSON-equals
 * the raw one). A record that crossed the bots→app wire or the JSONL migration holds distinct
 * objects for the two, and matching by reference alone stored every replicated refusal as an
 * "observed" outcome with its reason lost.
 *
 * Outcome: `clampBuy`/`clampSell` always return a NEW object, so an approved intent can never be
 * matched by reference; this takes the first unused outcome with the same symbol, side and
 * instrument (shares, or exactly which contracts — `instrumentKey`), the same best-effort match
 * `decision-context.ts`'s `guardNote` uses. The instrument check keeps a share sell and a covered
 * call on one ticker from trading fills. `used` keeps either kind from being claimed twice: a
 * second same-shaped raw intent matches nothing rather than double-counting a fill.
 */
export function fateOf(
  raw: OrderIntent,
  entry: Pick<DecisionRecord, "outcomes" | "refusals">,
  used: { readonly outcomes: Set<number>; readonly refusals: Set<number> },
): IntentFate {
  const refusal = claimRefusal(raw, entry.refusals ?? [], used.refusals);
  if (refusal) return { refusal };
  const key = instrumentKey(raw);
  const index = entry.outcomes.findIndex(
    (o, i) =>
      !used.outcomes.has(i) &&
      o.intent.symbol === raw.symbol &&
      o.intent.side === raw.side &&
      instrumentKey(o.intent) === key,
  );
  if (index < 0) return {};
  used.outcomes.add(index);
  return { outcome: entry.outcomes[index] };
}

/** The insert params for one raw intent whose fate is already matched (`fateOf`). */
export function intentParams(
  raw: OrderIntent,
  entry: Pick<DecisionRecord, "context">,
  fate: IntentFate,
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

  if (fate.refusal) {
    return [...common, fate.refusal.reason, null, null, null, null, null, null];
  }
  const outcome = fate.outcome;
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
 *  snake_case columns, `null` for absent) into the honest, optional-field `StoredIntentRow` shape,
 *  with its option order when the side tables hold one. */
export function intentRowToStored(
  row: Record<string, unknown>,
  option?: StoredOption,
): StoredIntentRow {
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
    ...(option ? { option } : {}),
  };
}

/** Rebuild the `OrderIntent` one stored row carries — the raw shape for a refusal, the approved
 *  (guarded) shape otherwise; `quantity` is supplied by the caller since it differs between them. */
function intentFrom(row: StoredIntentRow, quantity: number): OrderIntent {
  return {
    symbol: row.symbol,
    side: row.side,
    quantity,
    type: row.option ? "limit" : "market",
    reason: row.reason,
    ...(row.strategy ? { strategy: row.strategy } : {}),
    ...(row.expectation ? { expectation: row.expectation } : {}),
    ...(row.forecast ? { forecast: row.forecast } : {}),
    ...(row.playbookId ? { playbookId: row.playbookId } : {}),
    ...(row.playbookMode ? { playbookMode: row.playbookMode } : {}),
    ...(row.option ? { option: row.option.option } : {}),
  };
}

/** The outcome half of one approved row's reconstruction — split out of `decisionFrom` purely to
 *  stay under the file's cognitive-complexity budget. The client order id rides the outcome's
 *  intent only, as the trader stamps it: on the order it submitted, never on the guarded intent. */
function outcomeFrom(row: StoredIntentRow, guarded: OrderIntent): IntentOutcome {
  const clientOrderId = row.option?.clientOrderId;
  const intent = clientOrderId ? { ...guarded, clientOrderId } : guarded;
  const legFills = row.option?.legFills;
  return {
    intent,
    action: (row.action ?? "observed") as IntentOutcome["action"],
    ...(row.orderId || row.resultStatus
      ? {
          result: {
            intent,
            status: (row.resultStatus ?? "rejected") as OrderStatus,
            ...(row.orderId ? { orderId: row.orderId } : {}),
            ...(row.filledQuantity !== undefined ? { filledQuantity: row.filledQuantity } : {}),
            ...(row.filledPrice !== undefined ? { filledPrice: row.filledPrice } : {}),
            ...(legFills ? { legFills } : {}),
          },
        }
      : {}),
  };
}

/** Reassemble one `DecisionRecord` from its `decisions` row plus every `intents` row it owns —
 *  the exact inverse of `intentParams`. */
export function decisionFrom(
  at: number,
  personaId: string,
  mode: "observe" | "live",
  halted: string | null,
  contextJson: string | null,
  intentRows: readonly StoredIntentRow[],
  playbookVerdicts: readonly PlaybookVerdict[] = [],
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
    ...(playbookVerdicts.length > 0 ? { playbookVerdicts } : {}),
  };
}
