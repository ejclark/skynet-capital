import { CLIENT_ORDER_ID_PATTERN, optionOrderProblems } from "../domain/option-order.js";
import {
  type MarketContext,
  type OptionOrderIntent,
  ORDER_STATUSES,
  ORDER_TYPES,
  type OrderForecast,
  type OrderIntent,
  type OrderResult,
  PLAYBOOK_MODES,
  PLAYBOOK_VERDICT_STATES,
  type PlaybookVerdict,
  type Quote,
  SIDES,
} from "../domain/types.js";
import { GUARD_REFUSAL_REASONS, type GuardRefusal } from "../engine/guards.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";
import type { IntentOutcome } from "./decision-record.js";
import { parseLegFills, parseLegOrders, parseOptionOrderIntent } from "./decision-wire-options.js";

/**
 * Pure, total, defensive parsers for the parts of a `DecisionRecord` — split out of
 * `decision-wire.ts` so that file stays under the architecture fitness cap. Every function here
 * returns `undefined` on anything that doesn't match; nothing here ever throws, matching
 * `parseInsightRecord`'s house style (`insight-record.ts`) for input crossing the bots↔app bridge.
 */

/** The option half of an intent: a malformed `option` fails the whole intent (never a silent share
 *  order); a malformed `clientOrderId` is optional, so it is dropped rather than rejecting. */
function parseOptionFields(
  value: Record<string, unknown>,
): { readonly option?: OptionOrderIntent; readonly clientOrderId?: string } | undefined {
  const option = value.option === undefined ? undefined : parseOptionOrderIntent(value.option);
  if (value.option !== undefined && !option) return undefined;
  const clientOrderId =
    typeof value.clientOrderId === "string" && CLIENT_ORDER_ID_PATTERN.test(value.clientOrderId)
      ? value.clientOrderId
      : undefined;
  return { ...(option ? { option } : {}), ...(clientOrderId ? { clientOrderId } : {}) };
}

function parseForecast(value: unknown): OrderForecast | undefined {
  if (!isRecord(value)) return undefined;
  const direction =
    value.direction === "up" || value.direction === "down" ? value.direction : undefined;
  const invalidator = boundedString(value.invalidator);
  if (!(direction && invalidator)) return undefined;
  return {
    direction,
    invalidator,
    ...(typeof value.magnitudePct === "number" ? { magnitudePct: value.magnitudePct } : {}),
    ...(typeof value.horizonMs === "number" ? { horizonMs: value.horizonMs } : {}),
  };
}

export function parseOrderIntent(value: unknown): OrderIntent | undefined {
  if (!isRecord(value)) return undefined;
  const symbol = boundedString(value.symbol);
  const side = SIDES.find((s) => s === value.side);
  const reason = boundedString(value.reason);
  if (!(symbol && side) || typeof value.quantity !== "number" || !reason) return undefined;
  const optionFields = parseOptionFields(value);
  if (!optionFields) return undefined;
  const type = ORDER_TYPES.find((t) => t === value.type) ?? "market";
  const strategy = boundedString(value.strategy);
  const expectation = boundedString(value.expectation);
  const forecast = parseForecast(value.forecast);
  const playbookId = boundedString(value.playbookId);
  const playbookMode = PLAYBOOK_MODES.find((m) => m === value.playbookMode);
  const intent: OrderIntent = {
    symbol,
    side,
    quantity: value.quantity,
    type,
    reason,
    ...(strategy ? { strategy } : {}),
    ...(expectation ? { expectation } : {}),
    ...(forecast ? { forecast } : {}),
    ...(playbookId ? { playbookId } : {}),
    ...(playbookMode ? { playbookMode } : {}),
    ...optionFields,
  };
  // The parser accepts exactly what the writer can emit: a well-formed option order, or a share
  // order at market. A bare contract symbol at market still parses — the guards refuse it
  // (`option-shape`) and the record must carry that refusal.
  if (intent.option) return optionOrderProblems(intent).length > 0 ? undefined : intent;
  return type === "limit" ? undefined : intent;
}

function parseOrderResult(value: unknown, intent: OrderIntent): OrderResult | undefined {
  if (!isRecord(value)) return undefined;
  const status = ORDER_STATUSES.find((s) => s === value.status);
  if (!status) return undefined;
  const reason = boundedString(value.reason);
  const orderId = boundedString(value.orderId);
  const legFills = parseLegFills(value.legFills);
  const legOrders = parseLegOrders(value.legOrders);
  return {
    intent,
    status,
    ...(typeof value.filledQuantity === "number" ? { filledQuantity: value.filledQuantity } : {}),
    ...(typeof value.filledPrice === "number" ? { filledPrice: value.filledPrice } : {}),
    ...(reason ? { reason } : {}),
    ...(orderId ? { orderId } : {}),
    ...(legFills ? { legFills } : {}),
    ...(legOrders ? { legOrders } : {}),
  };
}

export function parseIntentOutcome(value: unknown): IntentOutcome | undefined {
  if (!isRecord(value)) return undefined;
  const intent = parseOrderIntent(value.intent);
  const action = (["placed", "rejected", "observed", "cooldown-skipped"] as const).find(
    (a) => a === value.action,
  );
  if (!(intent && action)) return undefined;
  const result = parseOrderResult(value.result, intent);
  return { intent, action, ...(result ? { result } : {}) };
}

export function parseGuardRefusal(value: unknown): GuardRefusal | undefined {
  if (!isRecord(value)) return undefined;
  const intent = parseOrderIntent(value.intent);
  const reason = GUARD_REFUSAL_REASONS.find((r) => r === value.reason);
  if (!(intent && reason)) return undefined;
  return { intent, reason };
}

export function parsePlaybookVerdict(value: unknown): PlaybookVerdict | undefined {
  if (!isRecord(value)) return undefined;
  const playbookId = boundedString(value.playbookId);
  const mode = PLAYBOOK_MODES.find((m) => m === value.mode);
  const state = PLAYBOOK_VERDICT_STATES.find((s) => s === value.state);
  if (!(playbookId && mode && state)) return undefined;
  return { playbookId, mode, state };
}

function parseQuote(value: unknown): Quote | undefined {
  if (!isRecord(value)) return undefined;
  const symbol = boundedString(value.symbol);
  const asOf = boundedString(value.asOf);
  if (
    !(symbol && asOf) ||
    typeof value.bid !== "number" ||
    typeof value.ask !== "number" ||
    typeof value.last !== "number"
  ) {
    return undefined;
  }
  return { symbol, bid: value.bid, ask: value.ask, last: value.last, asOf };
}

function parseNumberMap(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, number> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "number") out[key] = v;
  }
  return out;
}

export function parseMarketContext(value: unknown): MarketContext | undefined {
  if (!isRecord(value)) return undefined;
  const asOf = boundedString(value.asOf);
  if (!(asOf && isRecord(value.quotes))) return undefined;
  const quotes: Record<string, Quote> = {};
  for (const [symbol, raw] of Object.entries(value.quotes)) {
    const quote = parseQuote(raw);
    if (quote) quotes[symbol] = quote;
  }
  const momentum = parseNumberMap(value.momentum);
  const newsSentiment = parseNumberMap(value.newsSentiment);
  return {
    asOf,
    quotes,
    ...(momentum ? { momentum } : {}),
    ...(newsSentiment ? { newsSentiment } : {}),
  };
}
