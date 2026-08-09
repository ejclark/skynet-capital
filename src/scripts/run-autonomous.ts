/**
 * CLI: run autonomous trading. Event-driven off the live market-data stream — each price
 * tick updates momentum; on a short throttle the enabled bots assess and place paper orders.
 * Their fills then propagate to the dashboard exactly like a manual trade.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run run:autonomous            # live: Day Trader only, conservative sizing (default)
 *   npm run run:autonomous:offline    # offline: replays fixtures against in-memory brokers, no keys
 *
 * Env knobs:
 *   SKYNET_DATA_SOURCE       live (default) | offline — offline needs no credentials or network
 *   SKYNET_AUTONOMOUS_BOTS   comma-separated persona ids (default: day-trader)
 *   SKYNET_MAX_POSITION_PCT  per-position cap as a fraction of equity (default: 0.03)
 *   SKYNET_MOMENTUM_WINDOW   ticks in the momentum window (default: 20)
 */
import { existsSync } from "node:fs";
import { InMemoryBroker } from "../adapters/in-memory-broker.js";
import { ReplayEventStream } from "../adapters/replay-event-stream.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaMarketDataStream } from "../alpaca/market-data-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { AutonomousTrader, type TraderMode } from "../autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { fleetEquity } from "../autonomous/equity-watch.js";
import { JsonlAuditStore } from "../autonomous/jsonl-audit-store.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { assessReadiness } from "../autonomous/readiness.js";
import { SafetyController } from "../autonomous/safety.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { createBotBroker } from "../bots/bot-broker.js";
import { loadBots } from "../bots/bot-registry.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { scenarioPacks } from "../evals/scenarios/index.js";
import { AlpacaNewsClient } from "../news/alpaca-news-client.js";
import { SentimentTracker } from "../news/sentiment-tracker.js";
import { createDefaultPersonas } from "../personas/registry.js";
import { readOfflineEvents } from "../runtime/data-source.js";

// The universe the bots watch (the Day Trader's big-tech focus).
const UNIVERSE = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA"];
const LIVE_EVAL_INTERVAL_MS = 15_000;
const OFFLINE_STARTING_CASH = 1_000_000;
const ALPACA_DATA_BASE_URL = "https://data.alpaca.markets";
const _EVAL_INTERVAL_MS = 15_000;
const NEWS_POLL_MS = 60_000;

function enabledIds(): string[] {
  return (process.env.SKYNET_AUTONOMOUS_BOTS ?? "day-trader").split(",").map((s) => s.trim());
}

async function main(): Promise<void> {
  if ((process.env.SKYNET_DATA_SOURCE ?? "live") === "offline") {
    runOffline();
    return;
  }
  await runLive();
}

// --- offline: replay fixtures against in-memory brokers, no keys, always "open" ----------

function runOffline(): void {
  const enabled = new Set(enabledIds());
  const personas = createDefaultPersonas().filter((p) => enabled.has(p.id));
  if (personas.length === 0) {
    console.error(`No enabled personas. Wanted: ${[...enabled].join(", ")}`);
    process.exit(1);
  }
  const risk = { maxPositionPct: Number(process.env.SKYNET_MAX_POSITION_PCT ?? "0.03") };
  const tracker = new MomentumTracker(Number(process.env.SKYNET_MOMENTUM_WINDOW ?? "20"));

  const audit = auditStore(process.env);
  const onDecision = decisionSink(audit);
  const brokers: InMemoryBroker[] = [];
  const traders = personas.map((persona) => {
    const broker = new InMemoryBroker(OFFLINE_STARTING_CASH);
    brokers.push(broker);
    return {
      persona,
      // Offline replay acts (in-memory, no risk); no cooldown so we see it trade each tick.
      trader: new AutonomousTrader({
        persona,
        broker,
        risk,
        cooldownMs: 0,
        mode: "live",
        onResult: logResult,
        onDecision,
      }),
    };
  });

  const evaluate = async (asOf: string) => {
    const context = tracker.context(asOf);
    for (const { persona, trader } of traders) {
      try {
        await trader.evaluate(context);
      } catch (error) {
        console.error(`[eval] ${persona.name} failed:`, error);
      }
    }
  };

  new ReplayEventStream({
    events: readOfflineEvents(process.env),
    onStatus: (status) => console.log(`[replay] ${status}`),
    onEvent: (event) => {
      if (event.type !== "price") {
        return;
      }
      tracker.record(event.symbol, event.price);
      for (const broker of brokers) {
        broker.mark([
          {
            symbol: event.symbol,
            bid: event.price,
            ask: event.price,
            last: event.price,
            asOf: event.at,
          },
        ]);
      }
      void evaluate(event.at);
    },
  }).start();

  console.log(
    `Autonomous trading started [offline] — bots: ${personas.map((p) => p.name).join(", ")}; maxPosition ${(risk.maxPositionPct * 100).toFixed(1)}%.`,
  );
}

// --- live: the real Alpaca market-data stream + broker, gated on market hours ------------

async function runLive(): Promise<void> {
  const enabled = new Set(enabledIds());
  const bots = loadBots(createDefaultPersonas(), process.env).bots.filter((b) =>
    enabled.has(b.persona.id),
  );
  if (bots.length === 0) {
    // No credentials yet. On a hosted always-on process, exiting would crash-loop the machine before
    // Eric has set the bot secrets — so idle quietly instead, staying up and ready for a redeploy.
    console.warn(
      `No enabled bots with credentials (wanted: ${[...enabled].join(", ")}). Idling — set SKYNET_BOT_<PERSONA>_KEY/SECRET and redeploy to start. Nothing is trading.`,
    );
    setInterval(() => {
      /* keepalive tick — work happens on the market-event stream */
    }, 60_000);
    return;
  }

  const dataCreds = bots[0]?.credentials;
  if (!dataCreds) {
    process.exit(1);
  }
  const risk = { maxPositionPct: Number(process.env.SKYNET_MAX_POSITION_PCT ?? "0.03") };
  const tracker = new MomentumTracker(Number(process.env.SKYNET_MOMENTUM_WINDOW ?? "20"));
  const sentiment = new SentimentTracker(Number(process.env.SKYNET_SENTIMENT_WINDOW ?? "10"));
  const universeSet = new Set(UNIVERSE);

  // News → sentiment, polled for the universe (news is low-frequency; a short poll is plenty).
  const newsClient = new AlpacaNewsClient(
    new FetchAlpacaTradingTransport({
      baseUrl: ALPACA_DATA_BASE_URL,
      apiKey: dataCreds.apiKey,
      apiSecret: dataCreds.apiSecret,
    }),
  );
  const pollNews = async () => {
    try {
      for (const article of await newsClient.getNews(UNIVERSE)) {
        sentiment.ingest(article, universeSet);
      }
    } catch (error) {
      console.error("[news] poll failed:", error);
    }
  };
  await pollNews();
  setInterval(() => void pollNews(), NEWS_POLL_MS);

  const mode = traderMode(process.env);
  const audit = auditStore(process.env);
  const onDecision = decisionSink(audit);
  // Kill switch + circuit breakers. Throwing the switch is as simple as `touch $SKYNET_HALT_FILE`.
  const safety = new SafetyController();
  const haltFile = process.env.SKYNET_HALT_FILE;
  const blockedReason = () => {
    if (haltFile && existsSync(haltFile)) safety.halt("manual");
    return safety.blockedReason();
  };
  console.log(
    `[autonomous] mode=${mode}${mode === "observe" ? " (dry run — no orders placed; set SKYNET_AUTONOMOUS_MODE=live to trade)" : " — PLACING PAPER ORDERS"}${haltFile ? `; kill switch: touch ${haltFile}` : ""}`,
  );
  const traders = bots.map((bot) => {
    // READINESS GATE: a persona may only trade live if it PASSES its readiness eval. A not-ready
    // persona is pinned to observe (watched, placing nothing) no matter what SKYNET_AUTONOMOUS_MODE says.
    const readiness = assessReadiness(bot.persona, {
      pack: scenarioPacks[bot.persona.id],
      safetyScenarios: genericSafetyScenarios,
    });
    const effectiveMode = mode === "live" && readiness.ready ? "live" : "observe";
    if (mode === "live" && !readiness.ready) {
      console.warn(
        `[gate] ${bot.persona.name} is NOT ready — pinned to observe. ${readiness.reason}`,
      );
    } else {
      console.log(`[gate] ${bot.persona.name}: ${readiness.reason} → ${effectiveMode}`);
    }
    const broker = createBotBroker(bot);
    return {
      bot,
      broker,
      trader: new AutonomousTrader({
        persona: bot.persona,
        broker,
        risk,
        mode: effectiveMode,
        blockedReason,
        onResult: (r) => {
          safety.recordOrder();
          logResult(r);
        },
        onDecision: (r) => {
          if (r.halted) console.warn(`[HALTED] ${r.personaId}: ${r.halted} — not trading`);
          onDecision(r);
        },
      }),
    };
  });

  // Gate trading on market hours (refreshed periodically).
  const clock = new AlpacaTradingClient(
    new FetchAlpacaTradingTransport({
      baseUrl: dataCreds.baseUrl ?? ALPACA_PAPER_BASE_URL,
      apiKey: dataCreds.apiKey,
      apiSecret: dataCreds.apiSecret,
    }),
  );
  let marketOpen = false;
  const refreshOpen = async () => {
    try {
      marketOpen = await clock.isMarketOpen();
    } catch (error) {
      console.error("[clock] failed:", error);
    }
  };
  await refreshOpen();
  setInterval(() => void refreshOpen(), 60_000);

  let lastEval = 0;
  let evaluating = false;
  const maybeEvaluate = async () => {
    const now = Date.now();
    if (evaluating || now - lastEval < LIVE_EVAL_INTERVAL_MS || !marketOpen) {
      return;
    }
    lastEval = now;
    evaluating = true;
    const context = sentiment.overlay(tracker.context(new Date(now).toISOString()));
    safety.checkContext(context); // data-gap breaker — a blind bot must not trade
    // Daily-loss breaker feed: mark the fleet to this cycle's quotes BEFORE evaluating, so a
    // breach halts this very cycle. A failed read is skipped — the breaker judges real equity
    // only, never an outage (the error/data-gap breakers own outages).
    try {
      const portfolios = await Promise.all(traders.map(({ broker }) => broker.getPortfolio()));
      safety.recordEquity(fleetEquity(portfolios, context));
    } catch (error) {
      console.error("[equity] read failed:", error);
    }
    for (const { bot, trader } of traders) {
      try {
        await trader.evaluate(context);
        safety.recordSuccess();
      } catch (error) {
        safety.recordError();
        console.error(`[eval] ${bot.persona.name} failed:`, error);
      }
    }
    evaluating = false;
  };

  new AlpacaMarketDataStream({
    apiKey: dataCreds.apiKey,
    apiSecret: dataCreds.apiSecret,
    symbols: UNIVERSE,
    onEvent: (event) => {
      if (event.type === "price") {
        tracker.record(event.symbol, event.price);
        void maybeEvaluate();
      }
    },
    onStatus: (status) => console.log(`[market-data] ${status}`),
  }).start();

  console.log(
    `Autonomous trading started [live] — bots: ${bots.map((b) => b.persona.name).join(", ")}; universe: ${UNIVERSE.join(", ")}; maxPosition ${(risk.maxPositionPct * 100).toFixed(1)}%; market ${marketOpen ? "OPEN" : "closed"}.`,
  );
}

function logResult(r: {
  intent: { side: string; quantity: number; symbol: string };
  status: string;
  reason?: string;
}): void {
  console.log(
    `[order] ${r.intent.side} ${r.intent.quantity} ${r.intent.symbol} -> ${r.status}${r.reason ? ` (${r.reason})` : ""}`,
  );
}

/**
 * The trader's execution mode. **Defaults to `observe`** — safe by default: a persona must be
 * explicitly flipped to `live` (SKYNET_AUTONOMOUS_MODE=live), the market-open validation step in
 * `docs/AUTONOMY-PLAN.md`, before it can place a real (paper) order. Offline replay passes `live`
 * itself, since the in-memory broker carries no risk and the demo is meant to act.
 */
function traderMode(env: NodeJS.ProcessEnv): TraderMode {
  return env.SKYNET_AUTONOMOUS_MODE === "live" ? "live" : "observe";
}

/** Audit sink: append every decision to a JSONL store when SKYNET_AUDIT_DIR is set. */
function auditStore(env: NodeJS.ProcessEnv): JsonlAuditStore | undefined {
  return env.SKYNET_AUDIT_DIR ? new JsonlAuditStore(env.SKYNET_AUDIT_DIR) : undefined;
}

/** Console + audit-store sink for one decision cycle. Never throws on the audit write. */
function decisionSink(audit: JsonlAuditStore | undefined): (r: DecisionRecord) => void {
  return (r) => {
    const placed = r.outcomes.filter((o) => o.action === "placed").length;
    const observed = r.outcomes.filter((o) => o.action === "observed").length;
    if (r.mode === "observe" && observed > 0) {
      const names = r.guardedIntents.map((i) => `${i.side} ${i.quantity} ${i.symbol}`).join(", ");
      console.log(`[observe] ${r.personaId} would place: ${names}`);
    }
    if (placed > 0) console.log(`[cycle] ${r.personaId} placed ${placed} order(s)`);
    audit?.record(r).catch((e) => console.error("[audit] write failed:", e));
  };
}

main().catch((error) => {
  console.error("Autonomous trading failed:", error);
  process.exit(1);
});
