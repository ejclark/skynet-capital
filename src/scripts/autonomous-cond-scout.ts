/**
 * COND-SCOUT's live wiring (#3651 slice 2c) — kept out of `run-autonomous.ts` to hold that file
 * under its line cap, the same reason `autonomous-scout-staging.ts` exists.
 *
 * DARK BY DEFAULT. Nothing runs unless `SKYNET_COND_SCOUT_UNIVERSE` names tickers, and that knob is
 * flipped through the approval-gated `autonomy-ops` workflow like every other trading-behavior
 * toggle. Even armed, the runner holds no broker: probes live on the shadow ledger only (Eric,
 * 2026-09-30 — "keeps the information contained to the health dashboard").
 */
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { type BotsStateDb, condScoutStore } from "../autonomous/bots-state-db.js";
import {
  type CondScoutDeps,
  CondScoutRunner,
  type DailyBars,
} from "../autonomous/cond-scout-runner.js";
import type { CondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import type { MarketContext } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";
import { parseCondScoutUniverse } from "../playbooks/cond-scout.js";
import { ALPACA_DATA_BASE_URL } from "../runtime/data-source.js";

const DAY_MS = 86_400_000;
/** Calendar days of daily bars to ask for: ~40 sessions, comfortably past SMA20 and RSI14. */
const LOOKBACK_DAYS = 60;

type Log = { log(line: string): void; warn(line: string, ...rest: unknown[]): void };

/**
 * The configured universe, cut down to symbols the price stream actually carries — a probe needs a
 * live quote to open and to close, and a symbol with none would sit in the scan forever.
 */
export function condScoutUniverse(
  raw: string | undefined,
  streamed: readonly string[],
  log: Log = console,
): readonly string[] {
  const wanted = parseCondScoutUniverse(raw);
  const carried = new Set(streamed);
  const dropped = wanted.filter((s) => !carried.has(s));
  if (dropped.length > 0) {
    log.warn(
      `[cond-scout] dropped ${dropped.join(", ")} — not on the live price stream (${streamed.join(", ")})`,
    );
  }
  return wanted.filter((s) => carried.has(s));
}

function barsClient(creds: AlpacaCredentials): AlpacaOptionsClient {
  return new AlpacaOptionsClient(
    new FetchAlpacaTradingTransport({ ...creds, baseUrl: ALPACA_PAPER_BASE_URL }),
    new FetchAlpacaTradingTransport({ ...creds, baseUrl: ALPACA_DATA_BASE_URL }),
  );
}

/** Dated daily closes for the later-exit backfill (#3651 slice 5); undefined on a failed read. */
export function alpacaDailyBars(credentials: () => AlpacaCredentials): DailyBars {
  return async (symbol, start, end) => {
    const bars = await barsClient(credentials()).getBars(symbol, start, end);
    return bars?.map((b) => ({ t: b.t, c: b.c }));
  };
}

/**
 * Daily closes from Alpaca's bars endpoint, ending yesterday so no partial session leaks into
 * RSI/SMA. Credentials are read per call, so a rotated key is picked up without a restart. A
 * symbol whose bars can't be read is left out — absence, and the scanner then holds no view on it.
 */
export function alpacaDailyCloses(
  credentials: () => AlpacaCredentials,
  now: () => Date = () => new Date(),
  log: Log = console,
): (symbols: readonly string[]) => Promise<Readonly<Record<string, readonly number[]>>> {
  return async (symbols) => {
    const client = barsClient(credentials());
    const today = now().getTime();
    const start = new Date(today - LOOKBACK_DAYS * DAY_MS).toISOString().slice(0, 10);
    const end = new Date(today - DAY_MS).toISOString().slice(0, 10);
    const out: Record<string, readonly number[]> = {};
    const missing: string[] = [];
    for (const symbol of symbols) {
      const bars = await client.getBars(symbol, start, end);
      if (bars && bars.length > 0) out[symbol] = bars.map((b) => b.c);
      else missing.push(symbol);
    }
    if (missing.length > 0) log.warn(`[cond-scout] no daily bars for ${missing.join(", ")}`);
    return out;
  };
}

export interface CondScoutWiring {
  readonly streamed: readonly string[];
  readonly credentials: () => AlpacaCredentials;
  readonly risk: RiskConfig;
  readonly blockedReason: () => string | null;
  readonly botsStateDb: BotsStateDb | undefined;
  readonly onDecision: (record: DecisionRecord) => void;
  readonly log?: Log;
  /** The bot account the scout runs beside — the one Heartbeat that shows its ledger. */
  readonly hostPersonaId?: string;
  /** Hands the app-bound snapshot getter to the bridge sender once the scout is armed. */
  readonly publish?: (get: () => CondScoutSnapshot) => void;
  /** Replaces the Alpaca bars reader — specs only; production always reads Alpaca. */
  readonly closesFor?: CondScoutDeps["closesFor"];
  readonly barsFor?: DailyBars;
}

/** The armed runner, or undefined when the knob is unset or names nothing the stream carries. */
function buildCondScout(
  env: NodeJS.ProcessEnv,
  wiring: CondScoutWiring,
): CondScoutRunner | undefined {
  const log = wiring.log ?? console;
  if (!env.SKYNET_COND_SCOUT_UNIVERSE) return undefined;
  const universe = condScoutUniverse(env.SKYNET_COND_SCOUT_UNIVERSE, wiring.streamed, log);
  if (universe.length === 0) {
    log.warn(
      "[cond-scout] SKYNET_COND_SCOUT_UNIVERSE set but nothing usable in it — staying dark.",
    );
    return undefined;
  }
  const store = condScoutStore(wiring.botsStateDb);
  if (!store) {
    log.warn("[cond-scout] no SKYNET_BOTS_DB_PATH — probes live in memory and vanish on restart.");
  }
  log.log(`[cond-scout] armed on the shadow ledger (no orders): ${universe.join(", ")}.`);
  return new CondScoutRunner({
    universe,
    closesFor: wiring.closesFor ?? alpacaDailyCloses(wiring.credentials, undefined, log),
    barsFor: wiring.barsFor ?? alpacaDailyBars(wiring.credentials),
    risk: wiring.risk,
    blockedReason: wiring.blockedReason,
    ...(store ? { store } : {}),
    onDecision: wiring.onDecision,
    onClose: (close) =>
      log.log(
        `[cond-scout] closed ${close.probe.symbol} ${close.probe.hypothesis} (${close.reason}) — ROI ${(close.roi * 100).toFixed(2)}% over ${close.daysHeld.toFixed(1)}d, simulated`,
      ),
  });
}

/**
 * The per-cycle hook `run-autonomous.ts` fires after every bot has evaluated: a no-op when dark,
 * never throws, and never blocks the live loop. It is fired without being awaited, so the first
 * pass of a day (which reads daily bars over the network) can't stall a real trading cycle; a
 * pass still in flight when the next cycle fires is skipped rather than stacked.
 */
export function armCondScout(
  env: NodeJS.ProcessEnv,
  wiring: CondScoutWiring,
): (context: MarketContext) => Promise<void> {
  const runner = buildCondScout(env, wiring);
  if (!runner) return () => Promise.resolve();
  const log = wiring.log ?? console;
  const host = wiring.hostPersonaId;
  if (host) wiring.publish?.(() => runner.snapshot(host, Date.now()));
  let inFlight = false;
  return async (context) => {
    if (inFlight) return;
    inFlight = true;
    try {
      await runner.runPass(context);
    } catch (error) {
      log.warn("[cond-scout] pass failed:", error);
    } finally {
      inFlight = false;
    }
  };
}
