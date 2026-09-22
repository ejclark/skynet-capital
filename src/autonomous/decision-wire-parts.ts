import type {
  MarketContext,
  OrderForecast,
  OrderIntent,
  OrderResult,
  PlaybookMode,
  Quote,
  Side,
} from "../domain/types.js";
import { GUARD_REFUSAL_REASONS, type GuardRefusal } from "../engine/guards.js";
import { isRecord } from "../storage/parse-guards.js";
import type { IntentOutcome } from "./decision-record.js";

/**
 * Pure, total, defensive parsers for the parts of a `DecisionRecord` — split out of
 * `decision-wire.ts` so that file stays under the architecture fitness cap. Every function here
 * returns `undefined` on anything that doesn't match; nothing here ever throws, matching
 * `parseInsightRecord`'s house style (`insight-record.ts`) for input crossing the bots↔app bridge.
 */

/** Generous but bounded — a reason/expectation is prose, never a blob. Mirrors the bridge's own
 *  body-size ceiling (`insights-listener.ts`'s `MAX_BODY_BYTES`) at the per-field level. */
const MAX_STRING_LENGTH = 2048;
const SIDES: readonly Side[] = ["buy", "sell"];
const PLAYBOOK_MODES: readonly PlaybookMode[] = ["conservative", "standard", "aggressive"];
const ORDER_STATUSES = ["filled", "rejected"] as const;

function boundedString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH
    ? value
    : undefined;
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
  const strategy = boundedString(value.strategy);
  const expectation = boundedString(value.expectation);
  const forecast = parseForecast(value.forecast);
  const playbookId = boundedString(value.playbookId);
  const playbookMode = PLAYBOOK_MODES.find((m) => m === value.playbookMode);
  return {
    symbol,
    side,
    quantity: value.quantity,
    type: "market",
    reason,
    ...(strategy ? { strategy } : {}),
    ...(expectation ? { expectation } : {}),
    ...(forecast ? { forecast } : {}),
    ...(playbookId ? { playbookId } : {}),
    ...(playbookMode ? { playbookMode } : {}),
  };
}

function parseOrderResult(value: unknown, intent: OrderIntent): OrderResult | undefined {
  if (!isRecord(value)) return undefined;
  const status = ORDER_STATUSES.find((s) => s === value.status);
  if (!status) return undefined;
  const reason = boundedString(value.reason);
  const orderId = boundedString(value.orderId);
  return {
    intent,
    status,
    ...(typeof value.filledQuantity === "number" ? { filledQuantity: value.filledQuantity } : {}),
    ...(typeof value.filledPrice === "number" ? { filledPrice: value.filledPrice } : {}),
    ...(reason ? { reason } : {}),
    ...(orderId ? { orderId } : {}),
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
