/**
 * COND-SCOUT's live wiring (#3651 slice 2c) — kept out of `run-autonomous.ts` to hold that file
 * under its line cap, the same reason `autonomous-scout-staging.ts` exists.
 *
 * DARK BY DEFAULT. The names it scans are its host bot's own setting (#4535 slice 2a): that bot's
 * COND-SCOUT subscription, read on every check, so the owner changes them with no restart and the
 * only gate is ownership (Eric, #928 — no approval step). A host holding no such subscription scans
 * nothing, whatever `SKYNET_COND_SCOUT_UNIVERSE` says (#4535 slice 4c-2; the dashboard copied the
 * env's names into the host's subscription once, slice 4c-1) — `resolveCondScoutUniverse`.
 * Even armed, the runner holds no broker: probes live on the shadow ledger only (Eric, 2026-09-30
 * — "keeps the information contained to the health dashboard").
 */
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { type BotsStateDb, condScoutStore } from "../autonomous/bots-state-db.js";
import {
  type CondScoutDeps,
  CondScoutRunner,
  type CondScoutStore,
  type DailyBars,
} from "../autonomous/cond-scout-runner.js";
import type { CondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import type { MarketContext, PlaybookSubscription } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";
import { parseCondScoutUniverse, resolveCondScoutUniverse } from "../playbooks/cond-scout.js";
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
  /** The host bot's subscriptions as last received from the dashboard, asked on every check
   *  (#4535 slice 2a). Absent = the scout is not armed. */
  readonly hostSubscriptions?: () => readonly PlaybookSubscription[];
  /** Hands the app-bound snapshot getter to the bridge sender once there is a ledger to show. */
  readonly publish?: (get: () => CondScoutSnapshot) => void;
  /** Replaces the Alpaca bars reader — specs only; production always reads Alpaca. */
  readonly closesFor?: CondScoutDeps["closesFor"];
  readonly barsFor?: DailyBars;
}

/**
 * The scout's names, resolved on every check and said in the log only when they change: where
 * they came from, which the price stream can't carry, and when a pause or a removal turns it dark.
 * A probe needs a live quote to open and to close, so a name off the stream is dropped, never kept.
 */
function followUniverse(
  env: NodeJS.ProcessEnv,
  wiring: CondScoutWiring,
  store: CondScoutStore | undefined,
): () => readonly string[] {
  const log = wiring.log ?? console;
  const host = wiring.hostPersonaId ?? "the host bot";
  let last: { readonly key: string; readonly universe: readonly string[] } | undefined;
  let warnedNoStore = false;
  return () => {
    const { wanted, source } = resolveCondScoutUniverse(
      wiring.hostSubscriptions?.() ?? [],
      wiring.streamed,
    );
    const key = `${source}:${wanted.join(",")}`;
    if (last?.key === key) return last.universe;
    const universe = condScoutUniverse(wanted.join(","), wiring.streamed, log);
    const from = source === "subscription" ? ` — from ${host}'s COND-SCOUT subscription` : "";
    if (universe.length > 0) {
      if (!(store || warnedNoStore)) {
        warnedNoStore = true;
        log.warn(
          "[cond-scout] no SKYNET_BOTS_DB_PATH — probes live in memory and vanish on restart.",
        );
      }
      log.log(
        `[cond-scout] armed on the shadow ledger (no orders): ${universe.join(", ")}${from}.`,
      );
    } else if (source === "subscription") {
      log.warn(
        `[cond-scout] ${host}'s COND-SCOUT subscription names nothing the stream carries — staying dark.`,
      );
    } else if (source === "paused") {
      log.log(
        `[cond-scout] paused on ${host}'s COND-SCOUT subscription — no new probes; open ones still close.`,
      );
    } else if (last) {
      log.log("[cond-scout] dark — no COND-SCOUT subscription; open probes still close.");
    } else if (env.SKYNET_COND_SCOUT_UNIVERSE) {
      log.warn(
        `[cond-scout] SKYNET_COND_SCOUT_UNIVERSE is no longer read — ${host} holds no COND-SCOUT subscription, so the scout stays dark. Subscribe it in the Playbook Store.`,
      );
    }
    last = { key, universe };
    return universe;
  };
}

/**
 * The runner, or undefined when nothing could ever arm it: no env knob and no host settings to
 * follow. With either, it runs every check — closing open probes even while its names are empty.
 */
function buildCondScout(
  env: NodeJS.ProcessEnv,
  wiring: CondScoutWiring,
): { readonly runner: CondScoutRunner; readonly universe: () => readonly string[] } | undefined {
  const log = wiring.log ?? console;
  if (!wiring.hostSubscriptions) return undefined;
  const store = condScoutStore(wiring.botsStateDb);
  const universe = followUniverse(env, wiring, store);
  universe(); // the boot line: armed, dark-and-why, or (nothing ever set) silence
  const runner = new CondScoutRunner({
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
  return { runner, universe };
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
  const built = buildCondScout(env, wiring);
  if (!built) return () => Promise.resolve();
  const { runner, universe } = built;
  const log = wiring.log ?? console;
  const host = wiring.hostPersonaId;
  // The Heartbeat card appears once there is something to show — armed, or a ledger kept from an
  // earlier run — and stays after, so switching the scout off never hides its record.
  let published = false;
  const publishOnce = () => {
    if (published || !host) return;
    const ledger = runner.snapshot(host, Date.now());
    if (universe().length === 0 && ledger.open.length === 0 && ledger.retros.length === 0) return;
    published = true;
    wiring.publish?.(() => runner.snapshot(host, Date.now()));
  };
  publishOnce();
  let inFlight = false;
  return async (context) => {
    if (inFlight) return;
    inFlight = true;
    try {
      await runner.runPass(context);
      publishOnce();
    } catch (error) {
      log.warn("[cond-scout] pass failed:", error);
    } finally {
      inFlight = false;
    }
  };
}
