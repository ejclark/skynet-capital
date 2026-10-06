import type { DatabaseSync } from "node:sqlite";
import type { OrderResult } from "../domain/types.js";

/**
 * What the broker said about an order's result (#4650): "limit $2.10 not reached in 15s; canceled",
 * "partial fill; remainder canceled", the error a refused submit came back with. The `intents` row
 * keeps the result's status and fill; its words reached the console line and nowhere else.
 *
 * A side table, never `ALTER TABLE` (the store's house rule, `decision-db-options.ts`): CREATE IF
 * NOT EXISTS reaches a database that already exists, an added column would not. A row is written
 * only when the result carried words, so a decision recorded before this table existed reads exactly
 * as it did. Filled on the bots and the dashboard side alike — both stores are written by
 * `record`/`recordBatch` from the same `DecisionRecord`, and the wire already carries
 * `OrderResult.reason` (`decision-wire-parts.ts`).
 */
const RESULTS_SQL = `
  CREATE TABLE IF NOT EXISTS intent_results (
    intent_id INTEGER PRIMARY KEY REFERENCES intents(id),
    reason TEXT NOT NULL
  );`;

/**
 * The most characters of a broker's words kept, ellipsis included. The adapters' own sentences run
 * under 120; the rest is an error's text (`String(error)`), which can carry a whole response body.
 * 300 keeps a full error line and stays well under the wire's per-field bound (2048,
 * `parse-guards.ts`), which drops an over-long field outright rather than trimming it.
 */
export const RESULT_REASON_MAX = 300;

/** The words as stored: trimmed, and cut at the cap by whole characters with an ellipsis. */
function bounded(reason: string): string | undefined {
  const trimmed = reason.trim();
  if (!trimmed) return undefined;
  const chars = Array.from(trimmed);
  return chars.length <= RESULT_REASON_MAX
    ? trimmed
    : `${chars.slice(0, RESULT_REASON_MAX - 1).join("")}…`;
}

export interface IntentResults {
  /** Stores one intent's result words, once. Never throws: the intent row is already in. */
  write(intentId: number, result: Pick<OrderResult, "reason"> | undefined): void;
  /** Intent id → the broker's words, for every intent of one decision that has them. */
  forDecision(decisionId: number): ReadonlyMap<number, string>;
}

export function openIntentResults(db: DatabaseSync): IntentResults {
  db.exec(RESULTS_SQL);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO intent_results (intent_id, reason) VALUES (?, ?)",
  );
  const selectForDecision = db.prepare(`
    SELECT r.intent_id AS intent_id, r.reason AS reason
    FROM intent_results r JOIN intents i ON i.id = r.intent_id WHERE i.decision_id = ?
  `);

  return {
    write(intentId, result) {
      const reason = typeof result?.reason === "string" ? bounded(result.reason) : undefined;
      if (!reason) return;
      try {
        insert.run(intentId, reason);
      } catch {
        // The words are detail on a record already written — losing them never costs the decision.
      }
    },

    forDecision(decisionId) {
      const rows = selectForDecision.all(decisionId) as { intent_id: number; reason: string }[];
      return new Map(rows.map((row) => [row.intent_id, row.reason]));
    },
  };
}
