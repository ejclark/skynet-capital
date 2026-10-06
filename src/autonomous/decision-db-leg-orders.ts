import type { DatabaseSync } from "node:sqlite";
import type { OptionLegIntent, OrderResult, Side } from "../domain/types.js";

/**
 * A spread's leg orders. Alpaca places a spread as ONE multi-leg order and gives each leg an order
 * id of its own; the account's fills arrive under the LEG's id, while `intents.order_id` holds the
 * parent's. Without this map a spread's two fills join to no decision, and Activity shows them as
 * trades nobody explained.
 *
 * A side table, never `ALTER TABLE` (the store's house rule, `decision-db-options.ts`): CREATE IF
 * NOT EXISTS reaches a database that already exists. Keyed by the leg's own id, so a replayed
 * record maps nothing twice. Written from the result's leg order ids (`OrderResult.legOrders`,
 * whatever the order became) on both the bots and the app side, because both stores are filled by
 * `record`/`recordBatch` from the same `DecisionRecord`.
 */
const LEG_ORDERS_SQL = `
  CREATE TABLE IF NOT EXISTS option_order_legs (
    leg_order_id TEXT PRIMARY KEY,
    parent_order_id TEXT NOT NULL,
    occ_symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    ratio INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS option_order_legs_parent ON option_order_legs(parent_order_id);`;

/** One leg of a spread, as the decision that placed the spread named it. */
export interface OptionOrderLeg {
  readonly legOrderId: string;
  readonly parentOrderId: string;
  readonly occSymbol: string;
  readonly side: Side;
  readonly ratio: number;
}

export interface LegOrders {
  /** Maps each of `result`'s leg order ids to the result's order — whatever the order became, so a
   *  fill that lands after the result was written still joins. A contract the order's legs never
   *  named, or an id that is the order's own, maps nothing: an id is only ever joined to a leg the
   *  decision itself placed. */
  write(result: OrderResult | undefined, legs: readonly OptionLegIntent[]): void;
  /** Intent id → OCC symbol → leg order id, for every option intent of one decision. */
  forDecision(decisionId: number): ReadonlyMap<number, ReadonlyMap<string, string>>;
  find(legOrderId: string): OptionOrderLeg | undefined;
}

interface LegOrderRow {
  leg_order_id: string;
  parent_order_id: string;
  occ_symbol: string;
  side: Side;
  ratio: number;
}

export function openLegOrders(db: DatabaseSync): LegOrders {
  db.exec(LEG_ORDERS_SQL);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO option_order_legs
      (leg_order_id, parent_order_id, occ_symbol, side, ratio) VALUES (?, ?, ?, ?, ?)
  `);
  const selectForDecision = db.prepare(`
    SELECT i.id AS intent_id, m.occ_symbol AS occ_symbol, m.leg_order_id AS leg_order_id
    FROM intents i JOIN option_order_legs m ON m.parent_order_id = i.order_id
    WHERE i.decision_id = ?
  `);
  const selectOne = db.prepare("SELECT * FROM option_order_legs WHERE leg_order_id = ?");

  return {
    write(result, legs) {
      const parentOrderId = result?.orderId;
      if (!parentOrderId) return;
      for (const { occSymbol, orderId } of result.legOrders ?? []) {
        if (!orderId || orderId === parentOrderId) continue;
        const leg = legs.find((l) => l.occSymbol === occSymbol);
        if (!leg) continue;
        insert.run(orderId, parentOrderId, leg.occSymbol, leg.side, leg.ratio);
      }
    },

    forDecision(decisionId) {
      const out = new Map<number, Map<string, string>>();
      const rows = selectForDecision.all(decisionId) as {
        intent_id: number;
        occ_symbol: string;
        leg_order_id: string;
      }[];
      for (const row of rows) {
        const byLeg = out.get(row.intent_id) ?? new Map<string, string>();
        byLeg.set(row.occ_symbol, row.leg_order_id);
        out.set(row.intent_id, byLeg);
      }
      return out;
    },

    find(legOrderId) {
      const row = selectOne.get(legOrderId) as LegOrderRow | undefined;
      if (!row) return undefined;
      return {
        legOrderId: row.leg_order_id,
        parentOrderId: row.parent_order_id,
        occSymbol: row.occ_symbol,
        side: row.side,
        ratio: row.ratio,
      };
    },
  };
}
