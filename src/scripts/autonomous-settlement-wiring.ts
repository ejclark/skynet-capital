/**
 * Late settlements, wired into the live runner (#4650): what an order a decision left `working`
 * became once the broker ended it goes into the decision store, and a restart hands the orders still
 * unsettled back to each bot's settle loop. Wiring only — the store owns the reading
 * (`decision-db-settlements.ts`), the brokers own the re-reads (`alpaca-option-order-flow.ts`,
 * `alpaca-broker-adapter.ts`).
 */
import type { DecisionDb } from "../autonomous/decision-db.js";
import { BETA_SCOUT_PERSONA_ID } from "../autonomous/live-cycle.js";
import type { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import type { OrderSettlement } from "../domain/order-settlement.js";

type Log = { log(line: string): void; warn(line: string): void };

/** How far back a restart looks for orders left working. A bot's orders are day orders, ended by
 *  their session's close, so a week covers a long weekend and a holiday with room to spare — and
 *  bounds what one boot can ask the broker about. */
export const RESUME_WINDOW_MS = 7 * 24 * 60 * 60_000;

/** The settle loops' listener: each settlement into the store, which keeps it once. Dark with no
 *  store. Never throws — a failed write is logged, and the order is read again after a restart. */
export function settlementSink(
  db: Pick<DecisionDb, "recordSettlements"> | undefined,
  logger: Log = console,
): ((settlement: OrderSettlement) => void) | undefined {
  if (!db) return undefined;
  return (settlement) => {
    try {
      if (db.recordSettlements([settlement]) === 0) return;
      const filled = settlement.filledQuantity > 0 ? ` (${settlement.filledQuantity} filled)` : "";
      logger.log(
        `[orders] ${settlement.orderId}: left working, then ${settlement.status}${filled} — recorded beside its decision`,
      );
    } catch (error) {
      logger.warn(`[decision-db] settlement write failed (non-fatal): ${String(error)}`);
    }
  };
}

/** How many settlements this process keeps in memory — far more than a day's working orders. */
const BOOK_SIZE = 500;

/**
 * The settle loops' listener and the forced pick's reader as one (review of #4642 slice 10): each
 * settlement goes to the store (`settlementSink`) AND into a small in-memory book, so the scout can
 * confirm what a working buy filled even with no store, or after a failed write; one an earlier run
 * recorded is read back from the store. The scout never sells a working-buy lot without it.
 */
export function settlementBook(
  db: Pick<DecisionDb, "recordSettlements" | "settlementOf"> | undefined,
  logger: Log = console,
): {
  readonly onSettled: (settlement: OrderSettlement) => void;
  readonly settlementOf: (orderId: string) => OrderSettlement | undefined;
} {
  const sink = settlementSink(db, logger);
  const book = new Map<string, OrderSettlement>();
  return {
    onSettled(settlement) {
      book.set(settlement.orderId, settlement);
      for (const oldest of book.keys()) {
        if (book.size <= BOOK_SIZE) break;
        book.delete(oldest);
      }
      sink?.(settlement);
    },
    settlementOf: (orderId) => book.get(orderId) ?? db?.settlementOf(orderId),
  };
}

/**
 * Boot, before the first cycle: every live order a decision left `working` in the last week that no
 * settlement has closed, back into the settle loop of the broker that placed it — the broker may
 * have filled it while no process was watching. The beta scout files its decisions under its own
 * id but trades on `scoutHost`'s account, so its orders go back to that broker. A failed read is
 * logged and boot carries on.
 */
export function resumeWorkingOrders(
  brokers: ReadonlyMap<string, Pick<SwappableBotBroker, "resume">>,
  db: Pick<DecisionDb, "unsettledOrders"> | undefined,
  opts: { readonly scoutHost?: string; readonly now?: number; readonly logger?: Log } = {},
): void {
  if (!db) return;
  const logger = opts.logger ?? console;
  const since = (opts.now ?? Date.now()) - RESUME_WINDOW_MS;
  const owners: [string, string][] = [...brokers.keys()].map((id) => [id, id]);
  if (opts.scoutHost && brokers.has(opts.scoutHost)) {
    owners.push([BETA_SCOUT_PERSONA_ID, opts.scoutHost]);
  }
  for (const [personaId, brokerId] of owners) {
    try {
      const orders = db.unsettledOrders(personaId, since);
      if (orders.length === 0) continue;
      brokers.get(brokerId)?.resume(orders);
      logger.log(
        `[orders] ${personaId}: rechecking ${orders.length} order(s) an earlier run left working`,
      );
    } catch (error) {
      logger.warn(`[orders] ${personaId}: could not read orders left working — ${String(error)}`);
    }
  }
}
