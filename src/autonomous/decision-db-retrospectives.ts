import type { DatabaseSync } from "node:sqlite";
import type { Side } from "../domain/types.js";
import { LIFECYCLE_STATUS } from "../trading/option-lifecycle.js";
import { SETTLED_JOIN } from "./decision-db-settlements.js";
import {
  type FilledIntentRow,
  pendingRetrospectives,
  type RetrospectiveInsert,
} from "./decision-retrospectives.js";

/**
 * The `retrospectives` table's share-tape side: the closed-position rows the retrospective writer
 * (PR 7) produces, the FIFO re-score of one (persona, symbol) tape, and the playbook-attributed
 * sums read back off those rows. Its schema stays in `decision-db.ts`'s core SQL (the table shipped
 * in PR 3); this owns the prepared statements and the helpers around them. An option round trip is
 * scored on its own ledger (`decision-option-ledger.ts`), which writes through `write` below.
 */

/** One closed position, as read back — see `decision-retrospectives.ts` for how it's computed. */
export interface RetrospectiveRecord {
  readonly at: number;
  readonly personaId: string;
  readonly symbol: string;
  readonly entryIntentId: number;
  readonly exitReason: string | null;
  readonly realized: number;
  readonly returnPct: number;
  readonly sentimentDelta: number | null;
  readonly momentumDelta: number | null;
}

export interface RetrospectiveReads {
  /**
   * Recomputes one (persona, symbol)'s FIFO ledger from every filled intent on record and writes
   * any newly-closed trip — the trigger IS the fill itself, called from `recordOne`.
   * Deterministic recompute + `pendingRetrospectives`'s own dedup means calling this twice for the
   * same state is always safe, so this never needs its own idempotency beyond that.
   *
   * `rebuild` replaces the tape's trips instead of adding to them: a fill that lands BEHIND trips
   * already written (a late settlement, #4650) re-pairs them, and keeping the old rows beside the
   * new would count a close twice. The caller holds a transaction around it.
   */
  updateFor(personaId: string, symbol: string, rebuild?: boolean): void;
  /** Writes one closed trip — also the option ledger's writer. */
  write(personaId: string, insert: RetrospectiveInsert): void;
  /** Whether the share tape already holds a trip that closed after `at`. */
  shareScoredAfter(personaId: string, symbol: string, at: number): boolean;
  /** Newest first, `limit` already clamped by the caller. */
  list(personaId: string, limit: number): RetrospectiveRecord[];
  /** How many closed positions one persona has. */
  closedCount(personaId: string): number;
  realizedPlForPlaybook(personaId: string, playbookId: string): number;
  putOutcomesForPlaybook(
    personaId: string,
    playbookId: string,
    strategy: string,
  ): { readonly closed: number; readonly assigned: number };
}

export function openRetrospectiveReads(db: DatabaseSync): RetrospectiveReads {
  // Every filled SHARE intent this persona has ever recorded for one symbol, oldest first — the
  // retrospective writer's own read of its FIFO tape. `intents_symbol` + `decisions_persona_at`
  // keep this bounded to one symbol's history, never a whole-table scan. An option fill sits on
  // the same underlying symbol but is never a share lot, so it is kept out of this tape and scored
  // on its own, per contract (`decision-option-ledger.ts`).
  // A share order recorded `working` and filled later is read through its settlement, at its own
  // decision's place on the tape (`SETTLED_JOIN`; `so` is the option row a share never has).
  const selectFilledIntentsForSymbol = db.prepare(`
    SELECT i.id AS intent_id, i.order_id AS order_id, i.side AS side,
           COALESCE(s.filled_quantity, i.filled_quantity) AS filled_quantity,
           COALESCE(s.filled_price, i.filled_price) AS filled_price,
           i.reason AS reason, i.momentum AS momentum, i.sentiment AS sentiment,
           decisions.at AS at
    FROM intents i JOIN decisions ON decisions.id = i.decision_id ${SETTLED_JOIN}
    WHERE decisions.persona_id = ? AND i.symbol = ?
      AND COALESCE(s.status, i.result_status) = 'filled' AND so.intent_id IS NULL
    ORDER BY decisions.at ASC, i.id ASC
  `);
  const selectRetrospectiveKeys = db.prepare(
    "SELECT entry_intent_id, at FROM retrospectives WHERE persona_id = ? AND symbol = ?",
  );
  // One share tape's trips — an option trip's symbol is its contracts, never a bare ticker.
  const deleteShareRetrospectives = db.prepare(
    "DELETE FROM retrospectives WHERE persona_id = ? AND symbol = ?",
  );
  const selectShareScoredAfter = db.prepare(
    "SELECT 1 FROM retrospectives WHERE persona_id = ? AND symbol = ? AND at > ? LIMIT 1",
  );
  const insertRetrospective = db.prepare(`
    INSERT INTO retrospectives (
      at, persona_id, symbol, entry_intent_id, exit_reason, realized, return_pct,
      sentiment_delta, momentum_delta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const selectRetrospectivesPage = db.prepare(`
    SELECT at, persona_id, symbol, entry_intent_id, exit_reason, realized, return_pct,
           sentiment_delta, momentum_delta
    FROM retrospectives WHERE persona_id = ? ORDER BY at DESC, id DESC LIMIT ?
  `);
  const selectClosedCount = db.prepare(
    "SELECT COUNT(*) AS n FROM retrospectives WHERE persona_id = ?",
  );
  // Retrospectives carry no playbook id of their own — only the intent that opened the closed
  // position does — so attributing realized P/L to a playbook means joining back through it.
  const selectRealizedPlForPlaybook = db.prepare(`
    SELECT SUM(retrospectives.realized) AS total
    FROM retrospectives
    JOIN intents ON intents.id = retrospectives.entry_intent_id
    JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.playbook_id = ? AND decisions.persona_id = ?
  `);
  const selectPutOutcomes = db.prepare(`
    SELECT COUNT(*) AS closed,
           COALESCE(SUM(CASE WHEN retrospectives.exit_reason = ? THEN 1 ELSE 0 END), 0) AS assigned
    FROM retrospectives
    JOIN intents ON intents.id = retrospectives.entry_intent_id
    JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.playbook_id = ? AND decisions.persona_id = ? AND intents.strategy = ?
      AND retrospectives.exit_reason IN (?, ?)
  `);

  function write(personaId: string, insert: RetrospectiveInsert): void {
    insertRetrospective.run(
      insert.at,
      personaId,
      insert.symbol,
      insert.entryIntentId,
      insert.exitReason,
      insert.realized,
      insert.returnPct,
      insert.sentimentDelta,
      insert.momentumDelta,
    );
  }

  function updateFor(personaId: string, symbol: string, rebuild = false): void {
    if (rebuild) deleteShareRetrospectives.run(personaId, symbol);
    const rows = selectFilledIntentsForSymbol.all(personaId, symbol) as {
      intent_id: number;
      order_id: string | null;
      side: Side;
      filled_quantity: number | null;
      filled_price: number | null;
      reason: string;
      momentum: number | null;
      sentiment: number | null;
      at: number;
    }[];
    const filled: FilledIntentRow[] = rows
      .filter((r): r is typeof r & { order_id: string } => r.order_id !== null)
      .map((r) => ({
        intentId: r.intent_id,
        orderId: r.order_id,
        symbol,
        side: r.side,
        quantity: r.filled_quantity ?? 0,
        ...(r.filled_price !== null ? { price: r.filled_price } : {}),
        at: r.at,
        reason: r.reason,
        ...(r.momentum !== null ? { momentum: r.momentum } : {}),
        ...(r.sentiment !== null ? { sentiment: r.sentiment } : {}),
      }));
    const existingKeys = new Set(
      (
        selectRetrospectiveKeys.all(personaId, symbol) as { entry_intent_id: number; at: number }[]
      ).map((r) => `${r.entry_intent_id}:${r.at}`),
    );
    for (const insert of pendingRetrospectives(filled, existingKeys)) {
      write(personaId, insert);
    }
  }

  return {
    updateFor,
    write,
    shareScoredAfter: (personaId, symbol, at) =>
      selectShareScoredAfter.get(personaId, symbol, at) !== undefined,

    list(personaId, limit): RetrospectiveRecord[] {
      const rows = selectRetrospectivesPage.all(personaId, limit) as {
        at: number;
        persona_id: string;
        symbol: string;
        entry_intent_id: number;
        exit_reason: string | null;
        realized: number;
        return_pct: number;
        sentiment_delta: number | null;
        momentum_delta: number | null;
      }[];
      return rows.map((r) => ({
        at: r.at,
        personaId: r.persona_id,
        symbol: r.symbol,
        entryIntentId: r.entry_intent_id,
        exitReason: r.exit_reason,
        realized: r.realized,
        returnPct: r.return_pct,
        sentimentDelta: r.sentiment_delta,
        momentumDelta: r.momentum_delta,
      }));
    },

    closedCount: (personaId) => (selectClosedCount.get(personaId) as { n: number }).n,

    realizedPlForPlaybook(personaId, playbookId): number {
      const row = selectRealizedPlForPlaybook.get(playbookId, personaId) as {
        total: number | null;
      };
      return row.total ?? 0;
    },

    putOutcomesForPlaybook(personaId, playbookId, strategy) {
      const assigned = LIFECYCLE_STATUS.OPASN;
      const row = selectPutOutcomes.get(
        assigned,
        playbookId,
        personaId,
        strategy,
        assigned,
        LIFECYCLE_STATUS.OPEXP,
      ) as { closed: number; assigned: number };
      return { closed: row.closed, assigned: row.assigned };
    },
  };
}
