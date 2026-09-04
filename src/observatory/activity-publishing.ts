import type { OrderAuditLog, OrderAuditRecord } from "../server/order-audit-log.js";
import { createBootActivityEventBus } from "./activity-bus.js";
import {
  type ActivityEventBus,
  activityEventFromAuditRecord,
  activityEventFromTradeRecord,
} from "./activity-event.js";
import {
  type ActivityStore,
  createBootActivityStore,
  type TradeActivityRecord,
} from "./activity-store.js";

/**
 * BUS-PUBLISHING DECORATORS — wrap an existing `ActivityStore`/`OrderAuditLog` so every successful
 * `record()` also translates and publishes onto the event bus, with zero change to the wrapped
 * store's own behavior or callers (#1211 slice 1: "behavior-preserving"). Callers keep using the
 * same interface; construction is the only thing that changes (`serve-dashboard.ts`).
 *
 * The bus write happens after the store write succeeds, and a bus failure never fails the caller's
 * `record()` — the durable ledger these decorators wrap is still the ledger every existing reader
 * depends on; the bus is additive, so a publishing hiccup must never regress it.
 */

/** `process.emitWarning`, not a throw, a swallow, or `console` (library code, which this repo
 *  reserves `console` for scripts) — a lost bus event must stay visible without taking down the
 *  write it's riding on (same reasoning as `jsonl-store.ts`'s malformed-line warning). */
function logBusFailure(context: string, error: unknown): void {
  process.emitWarning(`[activity-bus] ${context} failed to publish: ${error}`);
}

export function publishingActivityStore(
  store: ActivityStore,
  bus: ActivityEventBus,
): ActivityStore {
  return {
    async record(entry: TradeActivityRecord): Promise<void> {
      await store.record(entry);
      try {
        await bus.publish(activityEventFromTradeRecord(entry));
      } catch (error) {
        logBusFailure(`activity ${entry.orderId}`, error);
      }
    },
    list: (participantId) => store.list(participantId),
  };
}

export function publishingOrderAuditLog(log: OrderAuditLog, bus: ActivityEventBus): OrderAuditLog {
  return {
    async record(entry: OrderAuditRecord): Promise<void> {
      await log.record(entry);
      try {
        await bus.publish(activityEventFromAuditRecord(entry));
      } catch (error) {
        logBusFailure(`order-audit ${entry.orderId}`, error);
      }
    },
    list: (participantId) => log.list(participantId),
  };
}

/** Boot the trade-activity ledger and its event bus together — the one call site
 *  `serve-dashboard.ts` needs (`createBootActivityStore` + `createBootActivityEventBus` +
 *  `publishingActivityStore`, collapsed so the two boot factories never drift out of step). */
export function bootPublishingActivityStore(
  env: NodeJS.ProcessEnv,
  mode: string,
): { readonly activity: ActivityStore; readonly bus: ActivityEventBus } {
  const bus = createBootActivityEventBus(env, mode);
  return { activity: publishingActivityStore(createBootActivityStore(env, mode), bus), bus };
}
