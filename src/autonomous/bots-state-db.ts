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
  /** The beta scout's day-state (`live-cycle.ts`), or undefined before its first save. */
  loadScoutState(): ScoutState | undefined;
  saveScoutState(state: ScoutState): void;
  close(): void;
}

/**
 * The beta scout's per-day memory. Confirmed live 2026-09-04: this lived only in process memory,
 * so every restart (deploy, rotation, `flyctl secrets set`) re-armed the scout for a fresh "day"
 * and it placed another pair of forced picks — once per restart, not once per day. Persisting it
 * beside the momentum/sentiment windows makes "one scout fire per day" mean the calendar day.
 */
export interface ScoutState {
  /** The `asOf` date (YYYY-MM-DD) this state belongs to. */
  readonly day: string;
  readonly ranToday: boolean;
  readonly firedOrganicallyToday: boolean;
  /** Symbols the scout opened and still owns — exited at the next day rollover. */
  readonly ownedSymbols: readonly string[];
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
    CREATE TABLE IF NOT EXISTS scout_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      day TEXT NOT NULL,
      ran_today INTEGER NOT NULL,
      fired_organically_today INTEGER NOT NULL,
      owned_json TEXT NOT NULL
    );
  `);
  const upsertScoutState = db.prepare(
    "INSERT INTO scout_state (id, day, ran_today, fired_organically_today, owned_json) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET day = excluded.day, ran_today = excluded.ran_today, fired_organically_today = excluded.fired_organically_today, owned_json = excluded.owned_json",
  );

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
    loadScoutState(): ScoutState | undefined {
      const row = db
        .prepare(
          "SELECT day, ran_today, fired_organically_today, owned_json FROM scout_state WHERE id = 1",
        )
        .get() as
        | { day: string; ran_today: number; fired_organically_today: number; owned_json: string }
        | undefined;
      if (!row) return undefined;
      return {
        day: row.day,
        ranToday: row.ran_today === 1,
        firedOrganicallyToday: row.fired_organically_today === 1,
        ownedSymbols: JSON.parse(row.owned_json),
      };
    },
    saveScoutState(state) {
      upsertScoutState.run(
        state.day,
        state.ranToday ? 1 : 0,
        state.firedOrganicallyToday ? 1 : 0,
        JSON.stringify(state.ownedSymbols),
      );
    },
    close() {
      db.close();
    },
  };
}

/** The `LiveCycleRunner` dep shape, bound to a DB — undefined when durability is dark, so the
 *  runner's own optional-dep branch (not this file) decides what "no store" means. */
export function scoutStateStore(
  db: BotsStateDb | undefined,
): { load(): ScoutState | undefined; save(state: ScoutState): void } | undefined {
  if (!db) return undefined;
  return { load: () => db.loadScoutState(), save: (state) => db.saveScoutState(state) };
}

// --- best-effort restore/persist glue for the two in-memory trackers, kept alongside the DB
// they read/write so callers (run-autonomous.ts) don't carry this branching themselves.

/**
 * What a boot actually rehydrated off the volume. Counts, not contents: this is the number the
 * health stamp carries (`bots-health-file.ts`), so a deploy proves restore by being read rather
 * than by someone grepping `flyctl logs` for a populated context — which is the "verified live"
 * step issue #1181's slicing sketch asked for and nothing else could supply.
 *
 * `null` is a distinct verdict from all-zeroes: null means durability is dark (no
 * `SKYNET_BOTS_DB_PATH`), zeroes mean the DB opened and had nothing in it yet.
 */
export interface RestoredBotsState {
  /** Symbols whose price window came back non-empty. */
  readonly momentumSymbols: number;
  /** Symbols whose sentiment window came back non-empty. */
  readonly sentimentSymbols: number;
  /** Cooldown clocks restored across every persona in `personaIds`. */
  readonly cooldowns: number;
}

const nonEmpty = (entries: Record<string, readonly number[]>): number =>
  Object.values(entries).filter((series) => series.length > 0).length;

/** Just enough of a bot to name its cooldown rows — keeps the `Bot` type out of this module. */
type CooldownOwner = { readonly persona: { readonly id: string } };

/**
 * `roster` is the enabled bots: cooldowns are loaded per persona at trader construction
 * (`autonomous-live-wiring.ts`), so counting them here reads the same rows that call will —
 * nothing writes a cooldown between this point and the first order.
 */
export function restoreBotsState(
  db: BotsStateDb | undefined,
  tracker: MomentumTracker,
  sentiment: SentimentTracker,
  roster: readonly CooldownOwner[] = [],
): RestoredBotsState | null {
  if (!db) return null;
  const momentum = db.loadMomentum();
  const sentimentScores = db.loadSentiment();
  tracker.restore(momentum);
  sentiment.restore(sentimentScores);
  return {
    momentumSymbols: nonEmpty(momentum),
    sentimentSymbols: nonEmpty(sentimentScores),
    cooldowns: roster.reduce((total, bot) => total + db.loadCooldowns(bot.persona.id).size, 0),
  };
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
