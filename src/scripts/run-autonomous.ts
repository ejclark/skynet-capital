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
 *   SKYNET_PLAYBOOKS         playbook roster, "id:mode" pairs (e.g. "S1-NVDA:standard,G1-GOOG:conservative").
 *                            Empty (default) = all playbooks dark. Flip via autonomy-ops only.
 *   SKYNET_BETA_FORCING      beta-phase forced-pick count (e.g. "3"). 0/unset (default) = dark. When
 *                            armed, and nothing organic trades on a given day, forces up to N small,
 *                            honestly-labeled BETA-SCOUT picks from whatever signal already exists —
 *                            see src/playbooks/beta-scout.ts. Flip via autonomy-ops only.
 *   SKYNET_HARDCORE_BOTS     comma-separated persona ids to run in HARDCORE research mode (Eric,
 *                            2026-08-20): loosened thresholds, tranche scale-in/out, momentum
 *                            scalps, 90s cooldown, every trade carrying strategy + expectation —
 *                            volume as research data. Unset (default) = dark. Currently: sauron.
 *                            Flip via autonomy-ops only.
 */
import { existsSync } from "node:fs";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { resolveBotCredentialsClient } from "../autonomous/bot-credentials-client.js";
import {
  armMomentumPersistence,
  persistSentiment,
  restoreBotsState,
  scoutStateStore,
} from "../autonomous/bots-state-db.js";
import type { LiveBot } from "../autonomous/live-cycle.js";
import { LiveCycleRunner } from "../autonomous/live-cycle.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { SafetyController } from "../autonomous/safety.js";
import { guardAccountCollisions } from "../bots/account-guard.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { enabledBotIds, loadBots } from "../bots/bot-registry.js";
import { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { SentimentTracker } from "../news/sentiment-tracker.js";
import { enabledPlaybooks } from "../playbooks/registry.js";
import type { BrokerPort } from "../ports/broker.js";
import { primeBotCredentials } from "./autonomous-boot-credentials.js";
import { startSharedDataConnections } from "./autonomous-data-connections.js";
import {
  bootMissionControl,
  buildBotRosters,
  buildLiveBot,
  buildScoutDeps,
  resolveRoster,
  seedBotsState,
  seedDailyLossBaseline,
} from "./autonomous-live-wiring.js";
import { runOffline } from "./autonomous-offline-runner.js";
import { auditStore, decisionSink, logResult, traderMode } from "./autonomous-sinks.js";

// The universe the bots watch: the Day Trader's big-tech focus, plus the Prospector's warm-up
// claims (CRWV, MRVL). A symbol absent here has no quote, so a persona simply never sees it —
// adding a claim to the Prospector without adding it here is a silent no-op.
const UNIVERSE = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "CRWV", "MRVL"];
const LIVE_EVAL_INTERVAL_MS = 15_000;
const NEWS_POLL_MS = 60_000;

async function main(): Promise<void> {
  if ((process.env.SKYNET_DATA_SOURCE ?? "live") === "offline") {
    runOffline();
    return;
  }
  await runLive();
}

// --- live: the real Alpaca market-data stream + broker, gated on market hours ------------

async function runLive(): Promise<void> {
  const enabled = new Set(enabledBotIds(process.env));

  // Populated below, once each bot's broker is built — the credentials client's callback is
  // wired to this map now (a closure over a reference, not its contents) so a rotation that polls
  // in BEFORE the map is populated is still a documented no-op (nothing to look up yet), never a
  // crash, and every poll after boot finds the map fully populated.
  const brokerHolders = new Map<string, SwappableBotBroker>();
  // The bot supplying the shared data connections below — its rotation refreshes them too.
  let dataCredsPersonaId: string | undefined;
  let shared: Awaited<ReturnType<typeof startSharedDataConnections>> | undefined;
  const credentials = resolveBotCredentialsClient((personaId, next) => {
    const broker = brokerHolders.get(personaId);
    if (!broker) return false;
    broker.replaceCredentials(next);
    console.log(`[creds] ${personaId}: broker swapped in place (rotated) — no restart`);
    if (personaId === dataCredsPersonaId) {
      shared?.replaceCredentials(next);
      console.log(`[creds] ${personaId}: also refreshed the shared clock/news/price-stream`);
    }
    return true;
  });
  const { controls, bootControls } = await bootMissionControl(
    (state) => void credentials.reconcile(state),
  );
  // Filter to the ENABLED roster before resolving credentials: the shared-account fallback has
  // exactly one seat, and a roster of one must not be denied it because eight idle personas in the
  // registry would also have qualified.
  const hardcoreRoster = resolveRoster(enabled, bootControls);
  const roster = hardcoreRoster.personas;
  const { bots: fromEnv, sharedAccount } = loadBots(roster, process.env);
  // Store credential first, env as the break-glass fallback — see autonomous-boot-credentials.ts.
  const loaded = await primeBotCredentials(credentials, bootControls, fromEnv);
  for (const id of sharedAccount) {
    console.warn(
      `[creds] ${id} is trading the SHARED account (SKYNET_BOT_KEY) — its P/L is not separable from anything else already on that account.`,
    );
  }

  // Confirmed-collision guard (docs/LESSONS.md, 2026-08-11): two bots that authenticate fine but
  // secretly resolve to the SAME Alpaca account look completely healthy individually — nothing
  // else here would ever notice. Check once at boot, before anything trades.
  const { safe: bots, collisions } = await guardAccountCollisions(
    loaded,
    (bot) =>
      new AlpacaTradingClient(
        new FetchAlpacaTradingTransport({
          baseUrl: bot.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
          apiKey: bot.credentials.apiKey,
          apiSecret: bot.credentials.apiSecret,
        }),
      ),
  );
  for (const collision of collisions) {
    console.error(
      `[collision] ${collision.ids.join(" and ")} are BOTH pointed at Alpaca account ${collision.accountId} — neither will trade until their credentials are fixed.`,
    );
  }

  if (bots.length === 0) {
    // No credentials yet, or every loaded bot got refused by the collision guard above — either
    // way, exiting would crash-loop the machine before it's fixed, so idle quietly instead.
    const reason =
      collisions.length > 0
        ? "every enabled bot was refused by the account-collision guard above"
        : `set SKYNET_BOT_<PERSONA>_KEY/SECRET and redeploy to start`;
    console.warn(
      `No enabled bots with credentials (wanted: ${[...enabled].join(", ")}). Idling — ${reason}. Nothing is trading.`,
    );
    setInterval(() => {
      /* keepalive tick — work happens on the market-event stream */
    }, 60_000);
    return;
  }

  const dataCreds = bots[0]?.credentials;
  if (!dataCreds) process.exit(1);
  dataCredsPersonaId = bots[0]?.persona.id;
  // The live path (and ONLY the live path) runs the S2/E1 trade discipline: flat through every
  // print, defer non-urgent entries past the open. Deliberately absent from the offline replay
  // and from every eval — see TradeDiscipline in engine/guards.ts for why leaking it into the
  // eval path would silently re-score readiness.
  const risk = {
    maxPositionPct: Number(process.env.SKYNET_MAX_POSITION_PCT ?? "0.03"),
    discipline: { calendar: UPCOMING_PRINTS },
  };
  const playbookRoster = enabledPlaybooks(process.env);
  for (const bad of playbookRoster.rejected) {
    console.error(`[playbooks] REFUSED unknown/malformed token "${bad}" in SKYNET_PLAYBOOKS`);
  }
  if (playbookRoster.enabled.length > 0) {
    console.log(
      `[playbooks] armed: ${playbookRoster.enabled.map((e) => `${e.playbook.id}:${e.mode}`).join(", ")}`,
    );
  }
  const tracker = new MomentumTracker(Number(process.env.SKYNET_MOMENTUM_WINDOW ?? "20"));
  const sentiment = new SentimentTracker(Number(process.env.SKYNET_SENTIMENT_WINDOW ?? "10"));
  const universeSet = new Set(UNIVERSE);

  // Durable momentum/sentiment (slice 4) — dark unless SKYNET_BOTS_DB_PATH is set; restored
  // before the market-data stream starts, persisted on every subsequent tick/article below.
  const botsStateDb = seedBotsState(process.env);
  restoreBotsState(botsStateDb, tracker, sentiment);

  // Constructed before the boot-time reconcile() below, so a credential rotated while this
  // process was down reaches these too. `onEvent` safely closes over `maybeEvaluate` (defined
  // further down) — no tick arrives until `.start()`, called near the bottom of this function.
  shared = await startSharedDataConnections(
    dataCreds,
    (event) => {
      if (event.type === "price") {
        tracker.record(event.symbol, event.price);
        void maybeEvaluate();
      }
    },
    UNIVERSE,
  );
  const { marketClock, marketDataStream, getNews } = shared;

  const pollNews = async () => {
    try {
      for (const article of await getNews(UNIVERSE)) {
        sentiment.ingest(article, universeSet);
      }
      persistSentiment(botsStateDb, sentiment);
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
    // The owner's global suspend gates everything this seam gates — the beta scout included.
    // Empty id = only the all-bots switch can match; per-bot suspends compose in buildLiveBot.
    return safety.blockedReason() ?? controls.suspendedReason("");
  };
  controls.start();
  console.log(
    `[autonomous] mode=${mode}${mode === "observe" ? " (dry run — no orders placed; set SKYNET_AUTONOMOUS_MODE=live to trade)" : " — PLACING PAPER ORDERS"}${haltFile ? `; kill switch: touch ${haltFile}` : ""}`,
  );
  await seedDailyLossBaseline(bots, safety);
  const botRosters = buildBotRosters(bots, playbookRoster, process.env); // issue #885
  const traders: LiveBot[] = botRosters.map(({ bot, subscriptions, enabled }) =>
    buildLiveBot(bot, {
      mode,
      playbookRoster: { enabled: [...enabled], rejected: playbookRoster.rejected },
      risk: { ...risk, subscriptions },
      blockedReason,
      safety,
      onDecision,
      hardcore: hardcoreRoster.hardcore,
      controls,
      bootControls,
      ...(botsStateDb ? { botsStateDb } : {}),
    }),
  );
  botRosters.forEach(({ bot }, i) => {
    const broker = traders[i]?.broker;
    if (broker instanceof SwappableBotBroker) brokerHolders.set(bot.persona.id, broker);
  });
  // Boot-time correction (mirrors mergeRoster's "store overrides stale env" precedent): a
  // rotation that landed while this process was down is caught here, using the snapshot
  // bootMissionControl already fetched, rather than waiting up to 30s for the next live poll.
  // The shared data connections above are already wired, so this catches them too.
  await credentials.reconcile(bootControls);

  // --- beta scout: Eric's beta-phase directive (2026-08-13) — "deploying playbooks to observe
  // mechanics acting in live environments gives me confidence"; if nothing organic fires, force
  // a few small, honestly-labeled picks rather than wait indefinitely. Deliberately NOT a
  // Persona (which the contract requires to be pure — "same inputs, same intents"); this is
  // stateful orchestration, same category as smoke-trade.ts, run directly against a broker so
  // its picks still flow through the SAME guards (S2/E1, position cap) and audit trail as every
  // organic trade. Dark by default (SKYNET_BETA_FORCING unset = 0 = off).
  const betaForcingMaxPicks = Number(process.env.SKYNET_BETA_FORCING ?? "0");
  const scoutBroker: BrokerPort | undefined = traders[0]?.broker;
  if (betaForcingMaxPicks > 0 && scoutBroker) {
    console.log(
      `[beta-scout] armed: up to ${betaForcingMaxPicks} forced pick(s)/day when nothing organic fires, on ${traders[0]?.personaName}'s account.`,
    );
  } else if (betaForcingMaxPicks > 0) {
    console.warn(
      "[beta-scout] SKYNET_BETA_FORCING set but no bot account available — staying dark.",
    );
  }
  const managedSymbols = new Set((botRosters[0]?.enabled ?? []).map((e) => e.playbook.symbol)); // traders[0]'s account

  // The per-cycle orchestration core (docs/GAPS-2026-08.md item 7) — pure, dependency-injected,
  // fully spec'd in tests/autonomous/live-cycle.spec.ts. Everything below is wiring: real
  // brokers, the halt-file-aware blockedReason, and console/audit sinks for its hooks.
  const runner = new LiveCycleRunner({
    traders,
    safety,
    blockedReason,
    ...(botsStateDb ? { scoutState: scoutStateStore(botsStateDb) } : {}),
    scout: buildScoutDeps(betaForcingMaxPicks, scoutBroker, {
      universe: UNIVERSE,
      managedSymbols,
      risk,
      mode,
    }),
    onResult: logResult,
    onDecision,
    onEquityReadError: (error) => console.error("[equity] read failed:", error),
    onEvalError: (personaName, error) => console.error(`[eval] ${personaName} failed:`, error),
    onBetaScoutError: (error) => console.error("[beta-scout] cycle failed:", error),
    onScoutHalted: (reason) => console.warn(`[beta-scout] skipped — halted: ${reason}`),
    onScoutObserve: (intent) =>
      console.log(
        `[beta-scout] would ${intent.side} ${intent.quantity} ${intent.symbol} (observe mode)`,
      ),
  });

  armMomentumPersistence(botsStateDb, tracker);

  let lastEval = 0;
  let evaluating = false;
  const maybeEvaluate = async () => {
    const now = Date.now();
    if (evaluating || now - lastEval < LIVE_EVAL_INTERVAL_MS || !marketClock.isOpen()) {
      return;
    }
    lastEval = now;
    evaluating = true;
    const context = sentiment.overlay(tracker.context(new Date(now).toISOString()));
    await runner.runCycle(context);
    evaluating = false;
  };

  marketDataStream.start();

  console.log(
    `Autonomous trading started [live] — bots: ${bots.map((b) => b.persona.name).join(", ")}; universe: ${UNIVERSE.join(", ")}; maxPosition ${(risk.maxPositionPct * 100).toFixed(1)}%; market ${marketClock.isOpen() ? "OPEN" : "closed"}.`,
  );
}

main().catch((error) => {
  console.error("Autonomous trading failed:", error);
  process.exit(1);
});
