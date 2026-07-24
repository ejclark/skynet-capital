/**
 * CLI: run autonomous trading. Event-driven off the live market-data stream — each price
 * tick updates momentum; on a short throttle the enabled bots assess and place paper orders.
 * Their fills then propagate to the dashboard exactly like a manual trade.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run run:autonomous            # Day Trader only, conservative sizing (default)
 *
 * Env knobs:
 *   SKYNET_AUTONOMOUS_BOTS   comma-separated persona ids (default: day-trader)
 *   SKYNET_MAX_POSITION_PCT  per-position cap as a fraction of equity (default: 0.03)
 *   SKYNET_MOMENTUM_WINDOW   ticks in the momentum window (default: 20)
 */
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaMarketDataStream } from "../alpaca/market-data-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { AutonomousTrader } from "../autonomous/autonomous-trader.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { createBotBroker } from "../bots/bot-broker.js";
import { loadBots } from "../bots/bot-registry.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { createDefaultPersonas } from "../personas/registry.js";

// The universe the momentum bots watch (the Day Trader's big-tech focus).
const UNIVERSE = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA"];
const EVAL_INTERVAL_MS = 15_000;

function enabledIds(): string[] {
  return (process.env.SKYNET_AUTONOMOUS_BOTS ?? "day-trader").split(",").map((s) => s.trim());
}

async function main(): Promise<void> {
  const enabled = new Set(enabledIds());
  const bots = loadBots(createDefaultPersonas(), process.env).bots.filter((b) =>
    enabled.has(b.persona.id),
  );
  if (bots.length === 0) {
    console.error(`No enabled bots with credentials. Wanted: ${[...enabled].join(", ")}`);
    process.exit(1);
  }

  const dataCreds = bots[0]?.credentials;
  if (!dataCreds) {
    process.exit(1);
  }
  const risk = { maxPositionPct: Number(process.env.SKYNET_MAX_POSITION_PCT ?? "0.03") };
  const tracker = new MomentumTracker(Number(process.env.SKYNET_MOMENTUM_WINDOW ?? "20"));

  const traders = bots.map((bot) => ({
    bot,
    trader: new AutonomousTrader({
      persona: bot.persona,
      broker: createBotBroker(bot),
      risk,
      onResult: (r) =>
        console.log(
          `[order] ${bot.persona.name}: ${r.intent.side} ${r.intent.quantity} ${r.intent.symbol} -> ${r.status}${r.reason ? ` (${r.reason})` : ""}`,
        ),
    }),
  }));

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
    if (evaluating || now - lastEval < EVAL_INTERVAL_MS || !marketOpen) {
      return;
    }
    lastEval = now;
    evaluating = true;
    const context = tracker.context(new Date(now).toISOString());
    for (const { bot, trader } of traders) {
      try {
        await trader.evaluate(context);
      } catch (error) {
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
    `Autonomous trading started — bots: ${bots.map((b) => b.persona.name).join(", ")}; universe: ${UNIVERSE.join(", ")}; maxPosition ${(risk.maxPositionPct * 100).toFixed(1)}%; market ${marketOpen ? "OPEN" : "closed"}.`,
  );
}

main().catch((error) => {
  console.error("Autonomous trading failed:", error);
  process.exit(1);
});
