/**
 * Offline replay runner for `run-autonomous.ts`: replays recorded fixtures against in-memory
 * brokers, no keys or network involved, market always "open." Pulled out to keep that file's own
 * complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate) — self-contained, no state
 * shared with the live runner beyond the roster/audit/sink helpers both import.
 */
import { InMemoryBroker } from "../adapters/in-memory-broker.js";
import { ReplayEventStream } from "../adapters/replay-event-stream.js";
import { AutonomousTrader } from "../autonomous/autonomous-trader.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { enabledBotIds } from "../bots/bot-registry.js";
import { readOfflineEvents } from "../runtime/data-source.js";
import { resolveRoster } from "./autonomous-live-wiring.js";
import { auditStore, decisionSink, logResult } from "./autonomous-sinks.js";

const OFFLINE_STARTING_CASH = 1_000_000;

/** Replay fixtures against in-memory brokers, no keys, always "open." */
export function runOffline(): void {
  const enabled = new Set(enabledBotIds(process.env));
  const personas = resolveRoster(enabled).personas;
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
