import { DatabaseSync } from "node:sqlite";
import type { SentimentTracker } from "../news/sentiment-tracker.js";
import type { MomentumTracker } from "./momentum-tracker.js";

/**
 * Durable current-state storage for the bots process, on the dedicated volume
 * `docs/plans/trade-insights-loop.md` slice 4 provisions (`SKYNET_BOTS_DB_PATH`). Dark by
 * default: this module is only ever opened when that path is set, and every call site wraps it
 * best-effort (same posture as `seedDailyLossBaseline` in `autonomous-live-wiring.ts`) — a
 * missing/corrupt file falls back to today's cold-start behavior, never fails boot.
 *
 * One SQLite DB, one `DatabaseSync` handle shared across all three tables (not three separate
 * connections to the same file) — avoids `SQLITE_BUSY` lock contention between them. These are
 * CURRENT-STATE tables (upsert-per-key, not append-only) on purpose: momentum/sentiment windows
 * and cooldown clocks are mutable point-in-time state, the same distinction that makes the
 * insight-record stream a poor fit for them (see `jsonl-insight-store.ts`'s own append-only
 * design intent) and SQLite a genuine fit here, not just reuse of the DB slice 4 introduces.
 */
export interface BotsStateDb {
  /** Every symbol's persisted momentum-window prices, keyed by symbol. */
  loadMomentum(): Record<string, number[]>;
  saveMomentum(symbol: string, prices: readonly number[]): void;
  /** Every symbol's persisted sentiment-window scores, keyed by symbol. */
  loadSentiment(): Record<string, number[]>;
  saveSentiment(symbol: string, scores: readonly number[]): void;
  /** One persona's persisted per-symbol cooldown clocks. */
  loadCooldowns(personaId: string): Map<string, number>;
  saveCooldown(personaId: string, symbol: string, at: number): void;
  close(): void;
}

export function openBotsStateDb(path: string): BotsStateDb {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS momentum (symbol TEXT PRIMARY KEY, prices_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sentiment (symbol TEXT PRIMARY KEY, scores_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cooldowns (
      persona_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      at INTEGER NOT NULL,
      PRIMARY KEY (persona_id, symbol)
    );
  `);

  const upsertMomentum = db.prepare(
    "INSERT INTO momentum (symbol, prices_json) VALUES (?, ?) ON CONFLICT(symbol) DO UPDATE SET prices_json = excluded.prices_json",
  );
  const upsertSentiment = db.prepare(
    "INSERT INTO sentiment (symbol, scores_json) VALUES (?, ?) ON CONFLICT(symbol) DO UPDATE SET scores_json = excluded.scores_json",
  );
  const upsertCooldown = db.prepare(
    "INSERT INTO cooldowns (persona_id, symbol, at) VALUES (?, ?, ?) ON CONFLICT(persona_id, symbol) DO UPDATE SET at = excluded.at",
  );

  return {
    loadMomentum(): Record<string, number[]> {
      const out: Record<string, number[]> = {};
      for (const row of db.prepare("SELECT symbol, prices_json FROM momentum").all() as {
        symbol: string;
        prices_json: string;
      }[]) {
        out[row.symbol] = JSON.parse(row.prices_json);
      }
      return out;
    },
    saveMomentum(symbol, prices) {
      upsertMomentum.run(symbol, JSON.stringify(prices));
    },
    loadSentiment(): Record<string, number[]> {
      const out: Record<string, number[]> = {};
      for (const row of db.prepare("SELECT symbol, scores_json FROM sentiment").all() as {
        symbol: string;
        scores_json: string;
      }[]) {
        out[row.symbol] = JSON.parse(row.scores_json);
      }
      return out;
    },
    saveSentiment(symbol, scores) {
      upsertSentiment.run(symbol, JSON.stringify(scores));
    },
    loadCooldowns(personaId): Map<string, number> {
      const out = new Map<string, number>();
      for (const row of db
        .prepare("SELECT symbol, at FROM cooldowns WHERE persona_id = ?")
        .all(personaId) as { symbol: string; at: number }[]) {
        out.set(row.symbol, row.at);
      }
      return out;
    },
    saveCooldown(personaId, symbol, at) {
      upsertCooldown.run(personaId, symbol, at);
    },
    close() {
      db.close();
    },
  };
}

// --- best-effort restore/persist glue for the two in-memory trackers, kept alongside the DB
// they read/write so callers (run-autonomous.ts) don't carry this branching themselves.

export function restoreBotsState(
  db: BotsStateDb | undefined,
  tracker: MomentumTracker,
  sentiment: SentimentTracker,
): void {
  if (!db) return;
  tracker.restore(db.loadMomentum());
  sentiment.restore(db.loadSentiment());
}

export function persistSentiment(db: BotsStateDb | undefined, sentiment: SentimentTracker): void {
  if (!db) return;
  for (const [symbol, scores] of Object.entries(sentiment.snapshot())) {
    db.saveSentiment(symbol, scores);
  }
}

// Momentum persists on a fixed interval, not per-tick — price ticks arrive far more often than a
// recovery point needs, and a synchronous DB write on the hot tick-handling path would add latency
// the live eval loop doesn't need. Best-effort recency: losing the last ~10s of a restored window
// is a fine trade.
const MOMENTUM_PERSIST_MS = 10_000;

export function armMomentumPersistence(
  db: BotsStateDb | undefined,
  tracker: MomentumTracker,
): void {
  if (!db) return;
  setInterval(() => {
    for (const [symbol, prices] of Object.entries(tracker.snapshot())) {
      db.saveMomentum(symbol, prices);
    }
  }, MOMENTUM_PERSIST_MS).unref();
}
