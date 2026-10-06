import type { DatabaseSync } from "node:sqlite";
import type { OrderSettlement, SettledStatus, SettlementLeg } from "../domain/order-settlement.js";
import type { OptionLegIntent, OptionLegOrder, OrderResult } from "../domain/types.js";

/**
 * Late settlements (#4650): what an order a decision left `working` became once the broker ended
 * it — filled, partly filled, or never — kept BESIDE the decision, never written over it. The
 * `intents` row stays the record of what was known at submit; every read that shows or scores a
 * result joins this table (`SETTLED_JOIN`) and reads the settlement in place of a `working` result.
 *
 * Side tables, never `ALTER TABLE` (the store's house rule, `decision-db-options.ts`). Keyed by the
 * broker's order id, so the same settlement observed twice — two settle passes, a restart, a
 * replication resend — is stored once. A settlement joins its decision by order id, or by the
 * bot's client order id when the decision never learned the broker's id (a POST whose answer was
 * lost); it can arrive before its decision does on the dashboard's copy, so it is joined at read
 * time and linked again when the decision lands.
 */
export const SETTLEMENTS_SQL = `
  CREATE TABLE IF NOT EXISTS order_settlements (
    order_id TEXT PRIMARY KEY,
    client_order_id TEXT,
    status TEXT NOT NULL,
    filled_quantity REAL NOT NULL,
    filled_price REAL,
    settled_at INTEGER NOT NULL
  );
  -- Unique: one stamp is one order, so a client-id join can never match two settlements.
  CREATE UNIQUE INDEX IF NOT EXISTS order_settlements_client ON order_settlements(client_order_id);
  CREATE INDEX IF NOT EXISTS order_settlements_at ON order_settlements(settled_at);
  CREATE TABLE IF NOT EXISTS order_settlement_legs (
    order_id TEXT NOT NULL,
    occ_symbol TEXT NOT NULL,
    leg_order_id TEXT,
    filled_quantity REAL NOT NULL,
    filled_price REAL,
    PRIMARY KEY (order_id, occ_symbol)
  );`;

/**
 * Joins the settlement of a `working` intent aliased `i` as `s` (its option row as `so`). Only a
 * `working` result ever joins one, so a decision that settled on time reads exactly as written.
 * Read a result through it as `COALESCE(s.<column>, i.<column>)`.
 */
export const SETTLED_JOIN = `
  LEFT JOIN intent_options so ON so.intent_id = i.id
  LEFT JOIN order_settlements s ON i.result_status = 'working' AND (
    s.order_id = i.order_id OR (i.order_id IS NULL AND s.client_order_id = so.client_order_id))`;

/** An order a live decision left `working` that nothing has settled yet — what a restart must
 *  pick back up, because the broker may have filled it while no process was watching. */
export interface UnsettledOrder {
  readonly orderId?: string;
  readonly clientOrderId?: string;
  /** The ticker, or an option order's underlying. */
  readonly symbol: string;
  readonly option: boolean;
}

/** One intent a settlement scores against: who placed it, on what, and (an option) its legs. */
export interface SettledIntent {
  readonly personaId: string;
  readonly symbol: string;
  readonly option: boolean;
}

export interface SettlementsDeps {
  /** `decision-db-leg-orders.ts`'s writer: a spread that settles late gets its leg ids mapped. */
  readonly writeLegOrders: (
    result: Pick<OrderResult, "orderId" | "legOrders">,
    legs: readonly OptionLegIntent[],
  ) => void;
}

export interface Settlements {
  /** Stores one settlement once and links it to the decision it settles, when that is already
   *  here. Returns the intents to rescore — none when it was seen before. */
  record(settlement: OrderSettlement): {
    readonly added: boolean;
    readonly intents: SettledIntent[];
  };
  /** A just-inserted `working` result whose settlement arrived first: links it. */
  linkResult(orderId: string | undefined, clientOrderId: string | undefined): SettledIntent[];
  /** Intent id → its settlement, for one decision's `working` intents. */
  forDecision(decisionId: number): ReadonlyMap<number, OrderSettlement>;
  /** The newest first, bounded — what the bots resend to the dashboard each poll. */
  recent(limit: number): OrderSettlement[];
  unsettled(personaId: string, sinceAt: number): UnsettledOrder[];
}

interface SettlementRow {
  order_id: string;
  client_order_id: string | null;
  status: SettledStatus;
  filled_quantity: number;
  filled_price: number | null;
  settled_at: number;
}

interface LegRow {
  occ_symbol: string;
  leg_order_id: string | null;
  filled_quantity: number;
  filled_price: number | null;
}

function settlementFrom(row: SettlementRow, legs: readonly LegRow[]): OrderSettlement {
  return {
    orderId: row.order_id,
    ...(row.client_order_id ? { clientOrderId: row.client_order_id } : {}),
    status: row.status,
    filledQuantity: row.filled_quantity,
    ...(row.filled_price !== null ? { filledPrice: row.filled_price } : {}),
    ...(legs.length > 0
      ? {
          legs: legs.map(
            (leg): SettlementLeg => ({
              occSymbol: leg.occ_symbol,
              ...(leg.leg_order_id ? { orderId: leg.leg_order_id } : {}),
              filledQuantity: leg.filled_quantity,
              ...(leg.filled_price !== null ? { filledPrice: leg.filled_price } : {}),
            }),
          ),
        }
      : {}),
    settledAt: new Date(row.settled_at).toISOString(),
  };
}

const SETTLEMENT_COLUMNS =
  "s.order_id, s.client_order_id, s.status, s.filled_quantity, s.filled_price, s.settled_at";

export function openSettlements(db: DatabaseSync, deps: SettlementsDeps): Settlements {
  db.exec(SETTLEMENTS_SQL);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO order_settlements
      (order_id, client_order_id, status, filled_quantity, filled_price, settled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertLeg = db.prepare(`
    INSERT OR IGNORE INTO order_settlement_legs
      (order_id, occ_symbol, leg_order_id, filled_quantity, filled_price) VALUES (?, ?, ?, ?, ?)
  `);
  const selectLegs = db.prepare(
    "SELECT * FROM order_settlement_legs WHERE order_id = ? ORDER BY rowid",
  );
  const selectByOrder = db.prepare(
    `SELECT ${SETTLEMENT_COLUMNS} FROM order_settlements s WHERE s.order_id = ?`,
  );
  const selectByClient = db.prepare(
    `SELECT ${SETTLEMENT_COLUMNS} FROM order_settlements s WHERE s.client_order_id = ? LIMIT 1`,
  );
  const selectForDecision = db.prepare(`
    SELECT i.id AS intent_id, ${SETTLEMENT_COLUMNS}
    FROM intents i ${SETTLED_JOIN}
    WHERE i.decision_id = ? AND s.order_id IS NOT NULL
  `);
  const selectRecent = db.prepare(
    `SELECT ${SETTLEMENT_COLUMNS} FROM order_settlements s ORDER BY s.settled_at DESC, s.rowid DESC LIMIT ?`,
  );
  // The `working` intents one order settles: by its broker id, or by the bot's stamp when the
  // decision never learned that id.
  const selectIntents = db.prepare(`
    SELECT i.id AS intent_id, i.symbol AS symbol, d.persona_id AS persona_id,
           so.intent_id IS NOT NULL AS is_option
    FROM intents i JOIN decisions d ON d.id = i.decision_id
    LEFT JOIN intent_options so ON so.intent_id = i.id
    WHERE i.result_status = 'working'
      AND (i.order_id = ? OR (i.order_id IS NULL AND so.client_order_id = ?))
  `);
  const selectIntentLegs = db.prepare(
    "SELECT occ_symbol, side, ratio FROM intent_option_legs WHERE intent_id = ? ORDER BY leg_index",
  );
  const selectUnsettled = db.prepare(`
    SELECT i.order_id AS order_id, so.client_order_id AS client_order_id, i.symbol AS symbol,
           so.intent_id IS NOT NULL AS is_option
    FROM intents i JOIN decisions d ON d.id = i.decision_id ${SETTLED_JOIN}
    WHERE d.persona_id = ? AND d.at >= ? AND d.mode = 'live' AND i.result_status = 'working'
      AND s.order_id IS NULL AND (i.order_id IS NOT NULL OR so.client_order_id IS NOT NULL)
    ORDER BY d.at ASC, i.id ASC
  `);

  const read = (row: SettlementRow): OrderSettlement =>
    settlementFrom(row, selectLegs.all(row.order_id) as unknown as LegRow[]);

  /** Maps a spread's leg ids onto each intent it settles; returns those intents. */
  function link(settlement: OrderSettlement): SettledIntent[] {
    const rows = selectIntents.all(settlement.orderId, settlement.clientOrderId ?? null) as {
      intent_id: number;
      symbol: string;
      persona_id: string;
      is_option: number;
    }[];
    const legOrders = (settlement.legs ?? []).flatMap((leg): OptionLegOrder[] =>
      leg.orderId ? [{ occSymbol: leg.occSymbol, orderId: leg.orderId }] : [],
    );
    for (const row of rows) {
      if (!(row.is_option && legOrders.length > 0)) continue;
      const legs = selectIntentLegs.all(row.intent_id) as {
        occ_symbol: string;
        side: OptionLegIntent["side"];
        ratio: number;
      }[];
      const named = legs.map(
        (l): OptionLegIntent => ({ occSymbol: l.occ_symbol, side: l.side, ratio: l.ratio }),
      );
      deps.writeLegOrders({ orderId: settlement.orderId, legOrders }, named);
    }
    return rows.map((row) => ({
      personaId: row.persona_id,
      symbol: row.symbol,
      option: row.is_option === 1,
    }));
  }

  return {
    record(settlement) {
      const { changes } = insert.run(
        settlement.orderId,
        settlement.clientOrderId ?? null,
        settlement.status,
        settlement.filledQuantity,
        settlement.filledPrice ?? null,
        Date.parse(settlement.settledAt),
      );
      if (Number(changes) === 0) return { added: false, intents: [] };
      for (const leg of settlement.legs ?? []) {
        insertLeg.run(
          settlement.orderId,
          leg.occSymbol,
          leg.orderId ?? null,
          leg.filledQuantity,
          leg.filledPrice ?? null,
        );
      }
      return { added: true, intents: link(settlement) };
    },

    linkResult(orderId, clientOrderId) {
      const row = (
        orderId ? selectByOrder.get(orderId) : clientOrderId && selectByClient.get(clientOrderId)
      ) as SettlementRow | undefined;
      return row ? link(read(row)) : [];
    },

    forDecision(decisionId) {
      const out = new Map<number, OrderSettlement>();
      for (const row of selectForDecision.all(decisionId) as unknown as (SettlementRow & {
        intent_id: number;
      })[]) {
        out.set(row.intent_id, read(row));
      }
      return out;
    },

    recent(limit) {
      return (selectRecent.all(limit) as unknown as SettlementRow[]).map(read);
    },

    unsettled(personaId, sinceAt) {
      const rows = selectUnsettled.all(personaId, sinceAt) as {
        order_id: string | null;
        client_order_id: string | null;
        symbol: string;
        is_option: number;
      }[];
      return rows.map((row) => ({
        ...(row.order_id ? { orderId: row.order_id } : {}),
        ...(row.client_order_id ? { clientOrderId: row.client_order_id } : {}),
        symbol: row.symbol,
        option: row.is_option === 1,
      }));
    },
  };
}
