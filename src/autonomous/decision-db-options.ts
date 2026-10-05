import type { DatabaseSync } from "node:sqlite";
import type {
  OptionLegFill,
  OptionLegIntent,
  OptionOrderIntent,
  OptionSelection,
  OrderIntent,
  Side,
} from "../domain/types.js";
import type { StoredOption } from "./decision-db-rows.js";
import type { IntentOutcome } from "./decision-record.js";

/**
 * The option half of the decision store: one `intent_options` row and one `intent_option_legs` row
 * per leg, beside an `intents` row whose `symbol` is the underlying. Side tables, never
 * `ALTER TABLE` — the house precedent `decision-db.ts` set for `playbook_verdicts`: CREATE IF NOT
 * EXISTS reaches a database that already exists, an added column would not. Created on both the
 * bots and the app side, because both open their store through `openDecisionDb`.
 *
 * `limit_price` is nullable on purpose: a write must never throw (the intent row is already in),
 * so a non-finite limit is stored as NULL and read back as NaN rather than costing the record.
 */
export const OPTION_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS intent_options (
    intent_id INTEGER PRIMARY KEY REFERENCES intents(id),
    effect TEXT NOT NULL,
    structure TEXT NOT NULL,
    limit_price REAL,
    band_low REAL,
    band_high REAL,
    band_at TEXT,
    assignment TEXT,
    selection_json TEXT,
    client_order_id TEXT
  );
  CREATE INDEX IF NOT EXISTS intent_options_client ON intent_options(client_order_id);
  CREATE TABLE IF NOT EXISTS intent_option_legs (
    intent_id INTEGER NOT NULL REFERENCES intents(id),
    leg_index INTEGER NOT NULL,
    occ_symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    ratio INTEGER NOT NULL,
    filled_quantity INTEGER,
    filled_price REAL,
    PRIMARY KEY (intent_id, leg_index)
  );
  CREATE INDEX IF NOT EXISTS intent_option_legs_occ ON intent_option_legs(occ_symbol);`;

export interface OptionTables {
  /** Writes one option intent's rows. The client order id and per-leg fills come from the MATCHED
   *  outcome — they belong to the order that was submitted. Never throws. */
  write(intentId: number, raw: OrderIntent, outcome: IntentOutcome | undefined): void;
  /** Intent id → its stored option, for every option intent of one decision. */
  forDecision(decisionId: number): ReadonlyMap<number, StoredOption>;
}

interface OptionRow {
  intent_id: number;
  effect: OptionOrderIntent["effect"];
  structure: OptionOrderIntent["structure"];
  limit_price: number | null;
  band_low: number | null;
  band_high: number | null;
  band_at: string | null;
  assignment: string | null;
  selection_json: string | null;
  client_order_id: string | null;
}

interface LegRow {
  intent_id: number;
  occ_symbol: string;
  side: Side;
  ratio: number;
  filled_quantity: number | null;
  filled_price: number | null;
}

const finiteOrNull = (n: number | undefined): number | null =>
  n !== undefined && Number.isFinite(n) ? n : null;

function optionFrom(row: OptionRow, legs: readonly LegRow[]): StoredOption {
  const legFills: OptionLegFill[] = legs
    .filter((l) => l.filled_quantity !== null)
    .map((l) => ({
      occSymbol: l.occ_symbol,
      filledQuantity: l.filled_quantity as number,
      ...(l.filled_price !== null ? { filledPrice: l.filled_price } : {}),
    }));
  const option: OptionOrderIntent = {
    effect: row.effect,
    structure: row.structure,
    legs: legs.map(
      (l): OptionLegIntent => ({ occSymbol: l.occ_symbol, side: l.side, ratio: l.ratio }),
    ),
    limitPrice: row.limit_price ?? Number.NaN,
    ...(row.band_low !== null && row.band_high !== null && row.band_at !== null
      ? { band: { low: row.band_low, high: row.band_high, at: row.band_at } }
      : {}),
    ...(row.assignment === "intended" ? { assignment: "intended" as const } : {}),
    ...selectionFrom(row.selection_json),
  };
  return {
    option,
    ...(row.client_order_id ? { clientOrderId: row.client_order_id } : {}),
    ...(legFills.length > 0 ? { legFills } : {}),
  };
}

/** The stored selection, or nothing: one corrupt row must cost its optional detail, never every
 *  read that touches its decision (the wire parser drops a malformed optional field the same way). */
function selectionFrom(json: string | null): { readonly selection?: OptionSelection } {
  if (!json) return {};
  try {
    const value: unknown = JSON.parse(json);
    return value !== null && typeof value === "object"
      ? { selection: value as OptionSelection }
      : {};
  } catch {
    return {};
  }
}

export function openOptionTables(db: DatabaseSync): OptionTables {
  const insertOption = db.prepare(`
    INSERT OR IGNORE INTO intent_options (
      intent_id, effect, structure, limit_price, band_low, band_high, band_at, assignment,
      selection_json, client_order_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLeg = db.prepare(`
    INSERT OR IGNORE INTO intent_option_legs (
      intent_id, leg_index, occ_symbol, side, ratio, filled_quantity, filled_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const selectOptions = db.prepare(`
    SELECT o.* FROM intent_options o JOIN intents i ON i.id = o.intent_id WHERE i.decision_id = ?
  `);
  const selectLegs = db.prepare(`
    SELECT l.* FROM intent_option_legs l JOIN intents i ON i.id = l.intent_id
    WHERE i.decision_id = ? ORDER BY l.intent_id, l.leg_index
  `);

  return {
    write(intentId, raw, outcome) {
      const option = raw.option;
      if (!option) return;
      // Every column is coerced to something storable: a malformed option (the case `option-shape`
      // exists for) must still be stored AS an option, because an intent row with no option row is
      // read back as a share order on the underlying — "SELL 1 CRWV at market" for a sold put.
      try {
        const band = option.band;
        insertOption.run(
          intentId,
          String(option.effect ?? "unknown"),
          String(option.structure ?? "unknown"),
          finiteOrNull(option.limitPrice),
          finiteOrNull(band?.low),
          finiteOrNull(band?.high),
          band?.at ?? null,
          option.assignment ?? null,
          option.selection ? JSON.stringify(option.selection) : null,
          outcome?.intent.clientOrderId ?? null,
        );
        const legs: readonly OptionLegIntent[] = Array.isArray(option.legs) ? option.legs : [];
        for (const [index, leg] of legs.entries()) {
          const fill = outcome?.result?.legFills?.find((f) => f.occSymbol === leg?.occSymbol);
          insertLeg.run(
            intentId,
            index,
            String(leg?.occSymbol ?? ""),
            String(leg?.side ?? ""),
            Number.isInteger(leg?.ratio) ? leg.ratio : 0,
            finiteOrNull(fill?.filledQuantity),
            finiteOrNull(fill?.filledPrice),
          );
        }
      } catch {
        // The intent row is the audit trail and is already written; a failed option detail must
        // never cost the decision itself, the same posture as the retrospective trigger.
      }
    },

    forDecision(decisionId) {
      const legsByIntent = new Map<number, LegRow[]>();
      for (const leg of selectLegs.all(decisionId) as unknown as LegRow[]) {
        const list = legsByIntent.get(leg.intent_id) ?? [];
        list.push(leg);
        legsByIntent.set(leg.intent_id, list);
      }
      const out = new Map<number, StoredOption>();
      for (const row of selectOptions.all(decisionId) as unknown as OptionRow[]) {
        out.set(row.intent_id, optionFrom(row, legsByIntent.get(row.intent_id) ?? []));
      }
      return out;
    },
  };
}
