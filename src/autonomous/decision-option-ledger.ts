import type { DatabaseSync } from "node:sqlite";
import type { Side } from "../domain/types.js";
import type {
  NormalizedLifecycleActivity,
  OptionLifecycleType,
} from "../trading/option-lifecycle.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import { SETTLED_JOIN } from "./decision-db-settlements.js";
import {
  type OptionLegFillRow,
  type OptionLifecycleRow,
  optionRetrospectiveKey,
  optionRetrospectives,
} from "./decision-option-trips.js";
import type { RetrospectiveInsert } from "./decision-retrospectives.js";

/**
 * The decision store's option ledger (#4642 slice 8): reads one (persona, underlying)'s filled
 * option legs and the broker's expiry/assignment reports for them, and writes the round trips
 * `decision-option-trips.ts` finds into `retrospectives` — the table `realizedPlForPlaybook` sums.
 *
 * `option_lifecycle` is a side table, never `ALTER TABLE` (the store's house rule, see
 * `decision-db-options.ts`): one row per broker activity, keyed by the broker's own activity id, so
 * re-reading the same page of activities records nothing twice. The bots process feeds it
 * (`sweepOptionLifecycle`) and sends each row on to the dashboard's copy (`since`, #4650), where
 * the same write stores it; every report is kept, but only an expiry or an assignment closes a
 * contract here — an exercise or the share trade an assignment settles is never scored on a guess.
 */
const OPTION_LIFECYCLE_SQL = `
  CREATE TABLE IF NOT EXISTS option_lifecycle (
    persona_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    type TEXT NOT NULL,
    symbol TEXT NOT NULL,
    underlying TEXT NOT NULL,
    quantity REAL NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (persona_id, activity_id)
  );
  CREATE INDEX IF NOT EXISTS option_lifecycle_underlying
    ON option_lifecycle(persona_id, underlying);`;

export interface OptionLedger {
  /** Recomputes one (persona, underlying)'s option round trips and writes the new ones. Safe to
   *  call again on the same state — the trips already written are skipped by key. `rebuild`
   *  replaces them all instead: a late fill that lands behind trips already written re-pairs them
   *  (#4650), and the old rows must not stay beside the new. The caller holds a transaction. */
  rescore(personaId: string, underlying: string, rebuild?: boolean): void;
  /** Stores the activities not seen before and rescores each underlying they touch. Returns how
   *  many were new. */
  recordLifecycle(personaId: string, activities: readonly NormalizedLifecycleActivity[]): number;
  /** Every report stored after `afterSeq`, in the order stored, bounded — the backlog the bots
   *  drain to the dashboard's copy (`decision-replication-client.ts`). */
  since(afterSeq: number, limit: number): SequencedLifecycle[];
}

/**
 * One stored report and its place in the order the store kept them. The place is the table's
 * implicit `rowid` — it has no sequence column, and gaining one would mean `ALTER TABLE`. Nothing
 * ever deletes from it, so the rowids run in insertion order with no gaps a `VACUUM` could renumber.
 * Price and side are not kept here (nothing scores them), so a report read back carries neither.
 */
export interface SequencedLifecycle {
  readonly seq: number;
  readonly personaId: string;
  readonly activity: NormalizedLifecycleActivity;
}

interface LegRow {
  intent_id: number;
  order_id: string;
  reason: string;
  momentum: number | null;
  sentiment: number | null;
  order_filled: number | null;
  order_price: number | null;
  occ_symbol: string;
  side: Side;
  ratio: number;
  filled_quantity: number | null;
  filled_price: number | null;
  leg_count: number;
  at: number;
}

/** A stored leg as a fill. A one-leg order recorded before its leg fill was captured falls back to
 *  the order's own fill, which is that leg's; a spread leg with none stays unpriced. */
function legFillRow(row: LegRow): OptionLegFillRow {
  const single = row.leg_count === 1;
  const quantity =
    row.filled_quantity ?? (single && row.order_filled !== null ? row.order_filled * row.ratio : 0);
  const price = row.filled_price ?? (single ? row.order_price : null);
  return {
    intentId: row.intent_id,
    orderId: row.order_id,
    occSymbol: row.occ_symbol,
    side: row.side,
    quantity,
    ...(price !== null ? { price } : {}),
    at: row.at,
    reason: row.reason,
    ...(row.momentum !== null ? { momentum: row.momentum } : {}),
    ...(row.sentiment !== null ? { sentiment: row.sentiment } : {}),
  };
}

export function openOptionLedger(
  db: DatabaseSync,
  write: (personaId: string, insert: RetrospectiveInsert) => void,
): OptionLedger {
  db.exec(OPTION_LIFECYCLE_SQL);
  // An order recorded `working` that the broker filled later is read through its settlement
  // (`SETTLED_JOIN`): its fill, each leg's, and the broker id the decision may never have learned.
  const selectLegs = db.prepare(`
    SELECT i.id AS intent_id, COALESCE(i.order_id, s.order_id) AS order_id, i.reason AS reason,
           i.momentum AS momentum, i.sentiment AS sentiment,
           COALESCE(s.filled_quantity, i.filled_quantity) AS order_filled,
           COALESCE(s.filled_price, i.filled_price) AS order_price,
           l.occ_symbol AS occ_symbol, l.side AS side, l.ratio AS ratio,
           COALESCE(sl.filled_quantity, l.filled_quantity) AS filled_quantity,
           COALESCE(sl.filled_price, l.filled_price) AS filled_price,
           (SELECT COUNT(*) FROM intent_option_legs n WHERE n.intent_id = i.id) AS leg_count,
           d.at AS at
    FROM intent_option_legs l
    JOIN intents i ON i.id = l.intent_id
    JOIN decisions d ON d.id = i.decision_id ${SETTLED_JOIN}
    LEFT JOIN order_settlement_legs sl ON sl.order_id = s.order_id AND sl.occ_symbol = l.occ_symbol
    WHERE d.persona_id = ? AND i.symbol = ? AND COALESCE(s.status, i.result_status) = 'filled'
      AND COALESCE(i.order_id, s.order_id) IS NOT NULL
    ORDER BY d.at ASC, i.id ASC, l.leg_index ASC
  `);
  const selectLifecycle = db.prepare(
    "SELECT type, symbol, quantity, at FROM option_lifecycle WHERE persona_id = ? AND underlying = ?",
  );
  // Every trip already written for an entry on this underlying — share trips included, whose keys
  // can never collide with an option entry's.
  const selectKeys = db.prepare(`
    SELECT r.entry_intent_id AS entry_intent_id, r.at AS at, r.symbol AS symbol
    FROM retrospectives r JOIN intents i ON i.id = r.entry_intent_id
    WHERE r.persona_id = ? AND i.symbol = ?
  `);
  // Every option trip on one underlying — by its entry intent, since a trip's own symbol is its
  // contracts.
  const deleteTrips = db.prepare(`
    DELETE FROM retrospectives WHERE persona_id = ? AND entry_intent_id IN (
      SELECT i.id FROM intents i JOIN intent_options o ON o.intent_id = i.id WHERE i.symbol = ?)
  `);
  const insertLifecycle = db.prepare(`
    INSERT OR IGNORE INTO option_lifecycle
      (persona_id, activity_id, type, symbol, underlying, quantity, at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const selectSince = db.prepare(`
    SELECT rowid AS seq, persona_id, activity_id, type, symbol, quantity, at
    FROM option_lifecycle WHERE rowid > ? ORDER BY rowid LIMIT ?
  `);

  function rescore(personaId: string, underlying: string, rebuild = false): void {
    if (rebuild) deleteTrips.run(personaId, underlying);
    const legs = (selectLegs.all(personaId, underlying) as unknown as LegRow[]).map(legFillRow);
    const lifecycle = (
      selectLifecycle.all(personaId, underlying) as {
        type: OptionLifecycleType;
        symbol: string;
        quantity: number;
        at: number;
      }[]
    ).map((r): OptionLifecycleRow => ({ ...r, occSymbol: r.symbol }));
    const recorded = new Set(
      (
        selectKeys.all(personaId, underlying) as {
          entry_intent_id: number;
          at: number;
          symbol: string;
        }[]
      ).map((r) => optionRetrospectiveKey(r.entry_intent_id, r.at, r.symbol)),
    );
    for (const insert of optionRetrospectives(legs, lifecycle, recorded)) write(personaId, insert);
  }

  return {
    rescore,
    recordLifecycle(personaId, activities) {
      const touched = new Set<string>();
      let added = 0;
      for (const activity of activities) {
        // An OCC symbol is filed under its underlying; a settlement trade already names it.
        const underlying = parseOccSymbol(activity.symbol)?.underlying ?? activity.symbol;
        const { changes } = insertLifecycle.run(
          personaId,
          activity.id,
          activity.type,
          activity.symbol,
          underlying,
          activity.quantity,
          Date.parse(activity.at),
        );
        if (Number(changes) === 0) continue;
        added += 1;
        touched.add(underlying);
      }
      for (const underlying of touched) rescore(personaId, underlying);
      return added;
    },
    since(afterSeq, limit) {
      const rows = selectSince.all(afterSeq, limit) as {
        seq: number;
        persona_id: string;
        activity_id: string;
        type: OptionLifecycleType;
        symbol: string;
        quantity: number;
        at: number;
      }[];
      return rows.map((r) => ({
        seq: r.seq,
        personaId: r.persona_id,
        activity: {
          id: r.activity_id,
          type: r.type,
          symbol: r.symbol,
          quantity: r.quantity,
          at: new Date(r.at).toISOString(),
        },
      }));
    },
  };
}
