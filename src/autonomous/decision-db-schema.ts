/**
 * The decision store's core schema — `decisions`, `intents`, the per-pass verdict tables, the
 * replay tape (`market_signals`) and `retrospectives`. Everything is `CREATE ... IF NOT EXISTS`,
 * so it reaches an already-deployed database; a changed column would not, which is why each later
 * addition got a table of its own. The option, settlement, observation and result tables live
 * beside the code that reads them (`decision-db-options.ts`, `decision-db-settlements.ts`).
 * `openDecisionDb` runs this block first, before any of those and before any read is prepared.
 */
export const CORE_TABLES_SQL = `
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

    -- Each playbook consulted on a pass and what it concluded (#3687). Its own table rather than a
    -- decisions column: CREATE IF NOT EXISTS reaches an existing database, an added column would not.
    CREATE TABLE IF NOT EXISTS playbook_verdicts (
      decision_id INTEGER NOT NULL REFERENCES decisions(id),
      playbook_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      state TEXT NOT NULL,
      PRIMARY KEY (decision_id, playbook_id, mode)
    );

    -- A pass that ran no playbook at all (#4773) — every one it held paused, say. It has no
    -- playbook_verdicts row to say so, and without this the roll call would skip back to the last
    -- pass that ran one and call a paused playbook armed. Its own table, for the reason above.
    CREATE TABLE IF NOT EXISTS verdictless_passes (
      decision_id INTEGER PRIMARY KEY REFERENCES decisions(id)
    );

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
  `;
