import type { ActivityView } from "./participant-snapshot.js";

/**
 * The trade-activity ledger's shared shapes — split out from `activity-store.ts` so the in-memory
 * and JSONL implementations can both depend on them without importing `activity-store.ts` itself
 * (which imports the implementations back, to re-export them). Neither implementation needs
 * anything else from this module.
 */

/** "lifecycle" (#468 criterion 6): a line synthesized from an option's OPEXP/OPASN/OPEXC/OPTRD
 *  account activity rather than captured from an order fill — see `../trading/option-lifecycle.ts`. */
export type ActivitySource = "stream" | "backfill" | "broker" | "lifecycle";

/** One order's state at a moment in time — a line in the journal. Extends the view shape so the
 *  round-trip matcher and the blotter consume records and broker rows interchangeably. */
export interface TradeActivityRecord extends ActivityView {
  /** The broker's order id — the identity `collapseActivity` folds on. */
  readonly orderId: string;
  readonly participantId: string;
  readonly side: "buy" | "sell";
  readonly source: ActivitySource;
}

/** Where trade activity is kept. Interface-first (like `HistoryStore`) so tests stay I/O-free. */
export interface ActivityStore {
  record(entry: TradeActivityRecord): Promise<void>;
  /** All journal lines (order not guaranteed); one participant's when given. Callers collapse. */
  list(participantId?: string): Promise<TradeActivityRecord[]>;
}
