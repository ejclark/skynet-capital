import {
  type OrderSettlement,
  SETTLED_STATUSES,
  type SettlementLeg,
} from "../domain/order-settlement.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";

/**
 * Late settlements crossing the bots→app bridge (#4650) — an additive `settlements` field on the
 * decision batch envelope (`decision-wire.ts`), not a new batch kind: a dashboard that predates it
 * reads only `kind`, `personaId` and `records`, so it ignores the field and keeps every record
 * beside it. A settlement is persona-agnostic (keyed by the broker's order id), so it may ride any
 * persona's batch. Pure and total in the house style: a malformed settlement is dropped alone,
 * never the batch.
 */

/** Bounded per batch — the bots resend only their newest few each poll. */
export const MAX_SETTLEMENTS_PER_BATCH = 100;
const MAX_OCC_LENGTH = 32;
const MAX_LEGS = 4;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function parseLeg(value: unknown): SettlementLeg | undefined {
  if (!isRecord(value)) return undefined;
  const occSymbol = boundedString(value.occSymbol, MAX_OCC_LENGTH);
  if (!(occSymbol && finite(value.filledQuantity) && value.filledQuantity >= 0)) return undefined;
  const orderId = boundedString(value.orderId);
  return {
    occSymbol,
    ...(orderId ? { orderId } : {}),
    filledQuantity: value.filledQuantity,
    ...(finite(value.filledPrice) ? { filledPrice: value.filledPrice } : {}),
  };
}

export function parseOrderSettlement(value: unknown): OrderSettlement | undefined {
  if (!isRecord(value)) return undefined;
  const orderId = boundedString(value.orderId);
  const status = SETTLED_STATUSES.find((s) => s === value.status);
  const settledAt = boundedString(value.settledAt);
  if (!(orderId && status && settledAt && Number.isFinite(Date.parse(settledAt)))) {
    return undefined;
  }
  if (!(finite(value.filledQuantity) && value.filledQuantity >= 0)) return undefined;
  const clientOrderId = boundedString(value.clientOrderId);
  // A leg that does not parse would leave a spread half-scored: the settlement goes whole or not.
  const legs = Array.isArray(value.legs) ? value.legs.map(parseLeg) : undefined;
  if (legs && (legs.length > MAX_LEGS || legs.some((leg) => !leg))) return undefined;
  return {
    orderId,
    ...(clientOrderId ? { clientOrderId } : {}),
    status,
    filledQuantity: value.filledQuantity,
    ...(finite(value.filledPrice) ? { filledPrice: value.filledPrice } : {}),
    ...(legs && legs.length > 0 ? { legs: legs as SettlementLeg[] } : {}),
    settledAt,
  };
}

/** The envelope's `settlements`, each parsed alone — absent or not a list reads as none. */
export function parseSettlements(value: unknown): readonly OrderSettlement[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_SETTLEMENTS_PER_BATCH)
    .map(parseOrderSettlement)
    .filter((s): s is OrderSettlement => s !== undefined);
}
