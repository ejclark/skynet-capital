import { DatabaseSync } from "node:sqlite";
import type { OrderIntent, Side } from "../domain/types.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import { decisionFrom, intentRowToStored, paramsForRawIntent } from "./decision-db-rows.js";
import { computeFunnel, type DecisionFunnel } from "./decision-funnel.js";
import type { DecisionRecord } from "./decision-record.js";
import { type FilledIntentRow, pendingRetrospectives } from "./decision-retrospectives.js";

export type { DecisionFunnel } from "./decision-funnel.js";

/**
 * The queryable decision store — the replacement for `JsonlAuditStore`'s whole-file-read-per-call
 * primitive (`storage/jsonl-store.ts`), on the machine that actually produces the data
 * (`docs/plans/where-are-we-documenting-*.md` PR 3 / issue #2287). `JsonlKeyedStore.list()` reads
 * and `JSON.parse`s every line of a persona's file on every request; this is the whole reason
 * `/u/:id/decisions` and the learning-loop analytics it feeds can't scale past a few thousand
 * cycles. Every read here is bounded and indexed instead.
 *
 * A SEPARATE `DatabaseSync` file from `bots-state-db.ts`'s (`decisionDbPathFrom` derives its path
 * from the same already-pinned `SKYNET_BOTS_DB_PATH`, so no new env var and no
 * `volume-persistence.spec.ts` trip) — deliberately not sharing that file's handle: those tables
 * are current-state (upsert-per-key); this is an append-only, ever-growing journal with its own
 * indexes and its own retention story. Two independent SQLite files avoid `SQLITE_BUSY` between
 * them exactly as `bots-state-db.ts`'s own module doc explains for its three tables sharing one
 * handle — the rule is "don't open two handles on the SAME file," not "one handle for everything."
 *
 * Row shape (see `decision-db-rows.ts`): one `intents` row PER RAW INTENT, because that is the
 * count that matters for "why didn't it trade" — a raw intent either carries a `guard_reason`
 * (refused, never sized) or an `approved_quantity`/`action` (survived `applyGuardsWithVerdicts`).
 * `record()` is called with the SAME `DecisionRecord` object `autonomous-trader.ts`/`live-cycle.ts`
 * already build, before anything serializes, so a refusal matches its raw intent by reference; an
 * approved one falls back to the house's own symbol+side match (see `decision-db-rows.ts`).
 */

export interface DecisionDb {
  /** Never throws — a write failure is logged by the caller, same posture as `AuditStore`. */
  record(entry: DecisionRecord): void;
  /** Bounded and indexed on `(persona_id, at DESC)` — never a whole-table scan. `limit` is
   *  clamped to `[1, MAX_PAGE]`; `beforeAt` pages backward in time (strictly less than). */
  listByPersona(personaId: string, opts?: { limit?: number; beforeAt?: number }): DecisionRecord[];
  /** The exact `orderId` join `playbook-attribution.ts` wants — O(1) via the `intents.order_id`
   *  index, never `decision-context.ts`'s fuzzy symbol+side+time match. */
  findByOrderId(orderId: string): { record: DecisionRecord; intent: OrderIntent } | undefined;
  /** Writes every entry with `record()`'s own idempotency guarantee, wrapped in one transaction —
   *  the app-side replication listener's insert path (PR 4). */
  recordBatch(entries: readonly DecisionRecord[]): void;
  /** The most recent `at` this store holds, per persona — the app side's own replication cursor
   *  (`decision-wire.ts`'s `decisionsCursor`), always computed fresh from the data itself, never a
   *  separately persisted value that could drift from what was actually written. */
  maxAtAll(): Record<string, number>;
  /** Every decision strictly AFTER `afterAt` for one persona, oldest first, bounded to
   *  `[1, MAX_PAGE]` — the bots side's own "what have I not sent yet" read. */
  listSince(personaId: string, afterAt: number, limit?: number): DecisionRecord[];
  /** Closed-position rows written by the retrospective writer (PR 7), newest first, bounded to
   *  `[1, MAX_PAGE]` — there is no separate `recordRetrospective()`: every write happens
   *  automatically inside `record()`/`recordBatch()` when a filled intent closes a lot. */
  listRetrospectives(personaId: string, opts?: { limit?: number }): RetrospectiveRecord[];
  /** The decision funnel (PR 7b) — cycles → raw → survived guards → placed → filled → closed,
   *  plus refusals by reason. A single SQL aggregation over the FULL history, never bounded by
   *  `MAX_PAGE` the way `listByPersona`/`listRetrospectives` are — a funnel undercounting its own
   *  totals would be a worse lie than a slow query. */
  funnelFor(personaId: string): DecisionFunnel;
  /** Total realized P/L across every closed retrospective attributed to one playbook, for one
   *  persona — the `compoundAllocation` toggle's whole basis (issue #3527 slice 3): a playbook's
   *  effective budget is `capitalAllocated + realizedPlForPlaybook(...)` when enabled. Joins
   *  `retrospectives` back to `intents.playbook_id` (retrospectives themselves aren't tagged with
   *  a playbook id — only the intent that opened the position is). 0 when nothing has closed yet,
   *  never `null` — an empty sum is an honest zero, not an absence. */
  realizedPlForPlaybook(personaId: string, playbookId: string): number;
  close(): void;
}

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

/** Hard ceiling on any single read — matches the pagination contract's `per_page` max (PR 5) so
 *  the store can never be asked to do the one thing it exists to stop. */
const MAX_PAGE = 100;
const DEFAULT_PAGE = 30;

/** `SKYNET_BOTS_DB_PATH` is a FILE path (e.g. `/data/bots-state.db`); this derives a sibling file
 *  in the same directory, so decisions land on the same durable volume with no new env var. */
export function decisionDbPathFrom(botsStateDbPath: string): string {
  const lastSlash = Math.max(botsStateDbPath.lastIndexOf("/"), botsStateDbPath.lastIndexOf("\\"));
  const dir = lastSlash >= 0 ? botsStateDbPath.slice(0, lastSlash + 1) : "";
  return `${dir}decisions.db`;
}

export function openDecisionDb(path: string): DecisionDb {
  const db = new DatabaseSync(path);
  // A busy writer (a retention sweep, a concurrent migration) blocks a caller for up to 5s
  // instead of throwing SQLITE_BUSY immediately — `bots-state-db.ts` sets none today, which is
  // the trap this module's own review named.
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at INTEGER NOT NULL,
      persona_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      halted TEXT,
      context_json TEXT,
      UNIQUE(persona_id, at)
    );
    CREATE INDEX IF NOT EXISTS decisions_persona_at ON decisions(persona_id, at DESC);

    CREATE TABLE IF NOT EXISTS intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_id INTEGER NOT NULL REFERENCES decisions(id),
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      raw_quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      strategy TEXT,
      expectation TEXT,
      forecast_json TEXT,
      playbook_id TEXT,
      playbook_mode TEXT,
      momentum REAL,
      sentiment REAL,
      guard_reason TEXT,
      approved_quantity INTEGER,
      action TEXT,
      order_id TEXT,
      result_status TEXT,
      filled_quantity INTEGER,
      filled_price REAL
    );
    CREATE INDEX IF NOT EXISTS intents_decision ON intents(decision_id);
    CREATE INDEX IF NOT EXISTS intents_order ON intents(order_id);
    CREATE INDEX IF NOT EXISTS intents_strategy ON intents(strategy);
    CREATE INDEX IF NOT EXISTS intents_symbol ON intents(symbol);

    -- The replay tape (shared across every bot — market state has no persona). One row per
    -- (at, symbol); "INSERT OR IGNORE" below means the first cycle to observe an instant owns it.
    CREATE TABLE IF NOT EXISTS market_signals (
      at INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      momentum REAL,
      sentiment REAL,
      bid REAL,
      ask REAL,
      last REAL,
      PRIMARY KEY (at, symbol)
    );

    -- Schema only in this PR — trade-insights-loop.md's retrospective writer (PR 7) fills it.
    -- Created now (forward-additive) so that PR needs no migration of its own.
    CREATE TABLE IF NOT EXISTS retrospectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at INTEGER NOT NULL,
      persona_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      entry_intent_id INTEGER REFERENCES intents(id),
      exit_reason TEXT,
      realized REAL,
      return_pct REAL,
      sentiment_delta REAL,
      momentum_delta REAL
    );
    CREATE INDEX IF NOT EXISTS retrospectives_persona_at ON retrospectives(persona_id, at DESC);
    -- No UNIQUE constraint here: this table shipped in PR 3 before this index existed, and
    -- "CREATE TABLE IF NOT EXISTS" cannot retrofit a constraint onto an already-deployed table.
    -- Idempotency is instead enforced in code (see recordOne below) against this index.
    CREATE INDEX IF NOT EXISTS retrospectives_entry_at ON retrospectives(entry_intent_id, at);
  `);

  const insertDecision = db.prepare(
    "INSERT OR IGNORE INTO decisions (at, persona_id, mode, halted, context_json) VALUES (?, ?, ?, ?, ?)",
  );
  const findDecisionId = db.prepare("SELECT id FROM decisions WHERE persona_id = ? AND at = ?");
  const hasIntents = db.prepare("SELECT 1 FROM intents WHERE decision_id = ? LIMIT 1");
  const insertIntent = db.prepare(`
    INSERT INTO intents (
      decision_id, symbol, side, raw_quantity, reason, strategy, expectation, forecast_json,
      playbook_id, playbook_mode, momentum, sentiment, guard_reason, approved_quantity, action,
      order_id, result_status, filled_quantity, filled_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSignal = db.prepare(
    "INSERT OR IGNORE INTO market_signals (at, symbol, momentum, sentiment, bid, ask, last) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const selectDecisionsPage = db.prepare(
    "SELECT id, at, persona_id, mode, halted, context_json FROM decisions WHERE persona_id = ? AND at < ? ORDER BY at DESC, id DESC LIMIT ?",
  );
  const selectIntentsFor = db.prepare(
    "SELECT * FROM intents WHERE decision_id = ? ORDER BY id ASC",
  );
  const selectMaxAtAll = db.prepare(
    "SELECT persona_id, MAX(at) AS max_at FROM decisions GROUP BY persona_id",
  );
  const selectSince = db.prepare(
    "SELECT id, at, persona_id, mode, halted, context_json FROM decisions WHERE persona_id = ? AND at > ? ORDER BY at ASC, id ASC LIMIT ?",
  );
  const selectByOrderId = db.prepare(`
    SELECT intents.*, decisions.id AS decision_id, decisions.at AS decision_at,
           decisions.persona_id AS decision_persona_id, decisions.mode AS decision_mode,
           decisions.halted AS decision_halted, decisions.context_json AS decision_context_json
    FROM intents JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.order_id = ?
    LIMIT 1
  `);
  // Every filled intent this persona has ever recorded for one symbol, oldest first — the
  // retrospective writer's own read of its FIFO tape. `intents_symbol` + `decisions_persona_at`
  // keep this bounded to one symbol's history, never a whole-table scan.
  const selectFilledIntentsForSymbol = db.prepare(`
    SELECT intents.id AS intent_id, intents.order_id AS order_id, intents.side AS side,
           intents.filled_quantity AS filled_quantity, intents.filled_price AS filled_price,
           intents.reason AS reason, intents.momentum AS momentum, intents.sentiment AS sentiment,
           decisions.at AS at
    FROM intents JOIN decisions ON decisions.id = intents.decision_id
    WHERE decisions.persona_id = ? AND intents.symbol = ? AND intents.result_status = 'filled'
    ORDER BY decisions.at ASC, intents.id ASC
  `);
  const selectRetrospectiveKeys = db.prepare(
    "SELECT entry_intent_id, at FROM retrospectives WHERE persona_id = ? AND symbol = ?",
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
  const selectCycleCount = db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE persona_id = ?");
  const selectClosedCount = db.prepare(
    "SELECT COUNT(*) AS n FROM retrospectives WHERE persona_id = ?",
  );
  const selectFunnelIntents = db.prepare(`
    SELECT intents.guard_reason AS guard_reason, intents.action AS action,
           intents.result_status AS result_status
    FROM intents JOIN decisions ON decisions.id = intents.decision_id
    WHERE decisions.persona_id = ?
  `);
  // Retrospectives carry no playbook id of their own — only the intent that opened the closed
  // position does — so attributing realized P/L to a playbook means joining back through it.
  const selectRealizedPlForPlaybook = db.prepare(`
    SELECT SUM(retrospectives.realized) AS total
    FROM retrospectives
    JOIN intents ON intents.id = retrospectives.entry_intent_id
    JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.playbook_id = ? AND decisions.persona_id = ?
  `);

  /**
   * Recomputes one (persona, symbol)'s FIFO ledger from every filled intent on record and writes
   * any newly-closed trip — the trigger IS the fill itself, called from `recordOne` right below.
   * Deterministic recompute + `pendingRetrospectives`'s own dedup means calling this twice for the
   * same state is always safe, so this never needs its own idempotency beyond that.
   */
  function updateRetrospectivesFor(personaId: string, symbol: string): void {
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
  }

  function intentRowsFor(decisionId: number) {
    return (selectIntentsFor.all(decisionId) as Record<string, unknown>[]).map(intentRowToStored);
  }

  function recordOne(entry: DecisionRecord): void {
    const contextJson = entry.context ? JSON.stringify(entry.context) : null;
    insertDecision.run(entry.at, entry.personaId, entry.mode, entry.halted ?? null, contextJson);
    const decisionRow = findDecisionId.get(entry.personaId, entry.at) as { id: number } | undefined;
    // `INSERT OR IGNORE` means a re-run of the SAME (persona, at) — the migration's own
    // idempotency guarantee — leaves the row untouched; only a genuinely new decision gets its
    // intents inserted below (guarded a second way by `hasIntents`, in case a prior `record()`
    // call inserted the decision row but crashed before its intents finished).
    if (!decisionRow) return;
    const decisionId = decisionRow.id;
    if (hasIntents.get(decisionId)) return;

    const usedOutcomes = new Set<number>();
    for (const raw of entry.rawIntents) {
      insertIntent.run(decisionId, ...paramsForRawIntent(raw, entry, usedOutcomes));
    }

    if (entry.context) {
      for (const [symbol, quote] of Object.entries(entry.context.quotes)) {
        insertSignal.run(
          entry.at,
          symbol,
          entry.context.momentum?.[symbol] ?? null,
          entry.context.newsSentiment?.[symbol] ?? null,
          quote.bid,
          quote.ask,
          quote.last,
        );
      }
    }

    triggerRetrospectives(entry);
  }

  /** The retrospective writer's trigger: a decision that just recorded a fill may have closed a
   *  position. Never allowed to break decision capture itself — a retrospective is a derived
   *  convenience, not the audit trail — split out of `recordOne` to keep its own complexity down. */
  function triggerRetrospectives(entry: DecisionRecord): void {
    const filledSymbols = new Set(
      entry.outcomes.filter((o) => o.result?.status === "filled").map((o) => o.intent.symbol),
    );
    for (const symbol of filledSymbols) {
      try {
        updateRetrospectivesFor(entry.personaId, symbol);
      } catch {
        // Swallowed — see comment above. The next fill for this symbol retries the full recompute.
      }
    }
  }

  function rowsToRecords(
    rows: readonly {
      id: number;
      at: number;
      persona_id: string;
      mode: "observe" | "live";
      halted: string | null;
      context_json: string | null;
    }[],
  ): DecisionRecord[] {
    return rows.map((row) =>
      decisionFrom(
        row.at,
        row.persona_id,
        row.mode,
        row.halted,
        row.context_json,
        intentRowsFor(row.id),
      ),
    );
  }

  return {
    record: recordOne,

    recordBatch(entries: readonly DecisionRecord[]): void {
      db.exec("BEGIN");
      try {
        for (const entry of entries) recordOne(entry);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },

    maxAtAll(): Record<string, number> {
      const rows = selectMaxAtAll.all() as { persona_id: string; max_at: number }[];
      const out: Record<string, number> = {};
      for (const row of rows) out[row.persona_id] = row.max_at;
      return out;
    },

    listSince(personaId, afterAt, limit = DEFAULT_PAGE): DecisionRecord[] {
      const clamped = Math.max(1, Math.min(limit, MAX_PAGE));
      return rowsToRecords(
        selectSince.all(personaId, afterAt, clamped) as unknown as Parameters<
          typeof rowsToRecords
        >[0],
      );
    },

    listByPersona(personaId, opts = {}): DecisionRecord[] {
      const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE, MAX_PAGE));
      const beforeAt = opts.beforeAt ?? Number.MAX_SAFE_INTEGER;
      return rowsToRecords(
        selectDecisionsPage.all(personaId, beforeAt, limit) as unknown as Parameters<
          typeof rowsToRecords
        >[0],
      );
    },

    listRetrospectives(personaId, opts = {}): RetrospectiveRecord[] {
      const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE, MAX_PAGE));
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

    funnelFor(personaId): DecisionFunnel {
      const cycles = (selectCycleCount.get(personaId) as { n: number }).n;
      const closed = (selectClosedCount.get(personaId) as { n: number }).n;
      const rows = selectFunnelIntents.all(personaId) as {
        guard_reason: string | null;
        action: string | null;
        result_status: string | null;
      }[];
      return computeFunnel(
        cycles,
        closed,
        rows.map((r) => ({
          guardReason: r.guard_reason as GuardRefusalReason | null,
          action: r.action,
          resultStatus: r.result_status,
        })),
      );
    },

    realizedPlForPlaybook(personaId, playbookId): number {
      const row = selectRealizedPlForPlaybook.get(playbookId, personaId) as {
        total: number | null;
      };
      return row.total ?? 0;
    },

    findByOrderId(orderId) {
      const row = selectByOrderId.get(orderId) as
        | {
            decision_id: number;
            decision_at: number;
            decision_persona_id: string;
            decision_mode: "observe" | "live";
            decision_halted: string | null;
            decision_context_json: string | null;
          }
        | undefined;
      if (!row) return undefined;
      const record = decisionFrom(
        row.decision_at,
        row.decision_persona_id,
        row.decision_mode,
        row.decision_halted,
        row.decision_context_json,
        intentRowsFor(row.decision_id),
      );
      const matched = record.outcomes.find((o) => o.result?.orderId === orderId);
      return matched ? { record, intent: matched.intent } : undefined;
    },

    close() {
      db.close();
    },
  };
}
