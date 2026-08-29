import { LIFECYCLE_STATUS, type NormalizedLifecycleActivity } from "../trading/option-lifecycle.js";
import type { TradeActivityRecord } from "./activity-record.js";

/**
 * The observatory-side half of #468 criterion 6: turns a normalized lifecycle activity (pure,
 * view-free — `../trading/option-lifecycle.ts`) into one line of the durable trade-activity
 * ledger, the same shape every fill already journals as. This is the seam `desk-data.ts`
 * documents for the rest of this boundary — kept out of `src/trading/` because `TradeActivityRecord`
 * is a view type (`ActivityView`), and option-lifecycle.ts's own module doc explains why.
 */

/** `orderId` doubles as the ledger's dedupe key (`collapseActivity` folds on it) — an activity id
 *  namespaced so it can never collide with a real Alpaca order id. */
export function lifecycleOrderId(activityId: string): string {
  return `lifecycle:${activityId}`;
}

export function lifecycleLedgerRecord(
  activity: NormalizedLifecycleActivity,
  participantId: string,
): TradeActivityRecord {
  // OPEXP/OPASN close at an honest, definite $0 (see option-lifecycle.ts's module doc — no cash
  // changes hands to close either). OPEXC/OPTRD carry whatever price the activity itself reported
  // (possibly none) — never a fabricated $0 that would misread as a wipeout in the raw ledger.
  const price = activity.type === "OPEXP" || activity.type === "OPASN" ? 0 : activity.price;
  return {
    orderId: lifecycleOrderId(activity.id),
    participantId,
    symbol: activity.symbol,
    // The side is a bookkeeping formality for OPEXC/OPTRD — both are excluded from round-trip
    // math by STATUS alone (see `fillsFrom` in desk-data.ts), regardless of this value. OPEXP and
    // OPASN always want "sell" (the closing action for a written or expiring leg).
    side: activity.side ?? "sell",
    quantity: activity.quantity,
    filledQuantity: activity.quantity,
    ...(price !== undefined ? { price } : {}),
    status: LIFECYCLE_STATUS[activity.type],
    at: activity.at,
    source: "lifecycle",
  };
}
