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
 *                            see src/playbooks/beta-scout.ts. "3+stage" also lets the scout stage
 *                            its picks after the close for Alpaca's next open (holiday-aware) —
 *                            see autonomous-scout-staging.ts. Flip via autonomy-ops only.
 *   SKYNET_HARDCORE_BOTS     comma-separated persona ids to run in HARDCORE research mode (Eric,
 *                            2026-08-20): loosened thresholds, tranche scale-in/out, momentum
 *                            scalps, 90s cooldown, every trade carrying strategy + expectation —
 *                            volume as research data. Unset (default) = dark. Currently: sauron.
 *                            Flip via autonomy-ops only.
 */
import { existsSync } from "node:fs";
import { resolveBotCredentialsClient } from "../autonomous/bot-credentials-client.js";
import {
  armMomentumPersistence,
  persistSentiment,
  restoreBotsState,
  scoutStateStore,
} from "../autonomous/bots-state-db.js";
import { followBotsStream } from "../autonomous/bots-stream.js";
import type { DecisionDb } from "../autonomous/decision-db.js";
import { migrateAuditToDecisionDb } from "../autonomous/decision-db-migration.js";
import { houseRosterReport } from "../autonomous/house-roster-wire.js";
import type { LiveBot } from "../autonomous/live-cycle.js";
import { LiveCycleRunner } from "../autonomous/live-cycle.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { SafetyController } from "../autonomous/safety.js";
import { createSubscriptionSync, type SubscriptionSync } from "../autonomous/subscription-sync.js";
import type { SubscriptionsSnapshot } from "../autonomous/subscriptions-wire.js";
import { guardAccountCollisions } from "../bots/account-guard.js";
import { botTradingClient } from "../bots/bot-broker.js";
import { enabledBotIds, loadBots } from "../bots/bot-registry.js";
import { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import { BOTS_UNIVERSE as UNIVERSE } from "../domain/bots-universe.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { SentimentTracker } from "../news/sentiment-tracker.js";
import { parseBetaForcing } from "../playbooks/beta-scout.js";
import { enabledPlaybooks } from "../playbooks/registry.js";
import type { BrokerPort } from "../ports/broker.js";
import { primeBotCredentials } from "./autonomous-boot-credentials.js";
import { bridgeReplication } from "./autonomous-bridge-replication.js";
import { armCondScout } from "./autonomous-cond-scout.js";
import { startSharedDataConnections } from "./autonomous-data-connections.js";
import {
  type BotRoster,
  bootMissionControl,
  buildBotRosters,
  buildLiveBot,
  buildScoutDeps,
  resolveBotRoster,
  resolveRoster,
  seedBotsState,
  seedDailyLossBaseline,
  seedDecisionDb,
  tradingRoster,
} from "./autonomous-live-wiring.js";
import { runOffline } from "./autonomous-offline-runner.js";
import {
  armOptionLifecycleSweep,
  BotOptionLevels,
  sweepOrphanOptionOrders,
} from "./autonomous-option-wiring.js";
import {
  announceRoster,
  announceScout,
  armScoutStaging,
  scoutSkipSymbols,
} from "./autonomous-scout-staging.js";
import { resumeWorkingOrders, settlementSink } from "./autonomous-settlement-wiring.js";
import { auditStore, botBus, decisionSink, logResult, traderMode } from "./autonomous-sinks.js";

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
  const optionLevels = new BotOptionLevels(); // read at boot below; re-read on every rotation
  // The bot supplying the shared data connections below — its rotation refreshes them too.
  let dataCredsPersonaId: string | undefined;
  let shared: Awaited<ReturnType<typeof startSharedDataConnections>> | undefined;
  const credentials = resolveBotCredentialsClient((personaId, next) => {
    const broker = brokerHolders.get(personaId);
    if (!broker) return false;
    broker.replaceCredentials(next);
    void optionLevels.refresh(personaId, next);
    console.log(`[creds] ${personaId}: broker swapped in place (rotated) — no restart`);
    if (personaId === dataCredsPersonaId) {
      shared?.replaceCredentials(next);
      console.log(`[creds] ${personaId}: also refreshed the shared clock/news/price-stream`);
    }
    return true;
  });
  // `decisionDb` doesn't exist yet at this point in boot (it's seeded further down, once the
  // enabled roster is known) — `replication` reads it fresh via a getter on every poll
  // rather than closing over a value, so the background poll (started later) sees it once seeded.
  let decisionDbRef: DecisionDb | undefined;
  const replication = bridgeReplication(process.env, () => decisionDbRef);
  // The subscription swap (issue #3595) can't exist yet either — the roster it swaps is built much
  // further down, once credentials and the collision guard have settled who is actually trading.
  // The hook below therefore PARKS the boot fetch's own snapshot instead of dropping it, and the
  // roster replays it the moment it exists: a member's saved subscriptions are in force from this
  // process's first cycle, not 30s into it.
  let subscriptionSync: SubscriptionSync | undefined;
  let parkedSubscriptions: SubscriptionsSnapshot | undefined;
  const { controls, bootControls, health } = await bootMissionControl(
    (state) => void credentials.reconcile(state),
    undefined,
    (cursor) => replication.onPoll(cursor),
    (snapshot) => {
      if (subscriptionSync) subscriptionSync.accept(snapshot);
      else parkedSubscriptions = snapshot;
    },
  );
  // Filter to the ENABLED roster before resolving credentials: the shared-account fallback has
  // exactly one seat, and a roster of one must not be denied it because eight idle personas in the
  // registry would also have qualified.
  const hardcoreRoster = resolveRoster(enabled, bootControls);
  const roster = hardcoreRoster.personas;
  const { bots: fromEnv, sharedAccount } = loadBots(roster, process.env);
  const loaded = await primeBotCredentials(credentials, bootControls, fromEnv);
  for (const id of sharedAccount) {
    console.warn(
      `[creds] ${id} is trading the SHARED account (SKYNET_BOT_KEY) — its P/L is not separable from anything else already on that account.`,
    );
  }

  // Confirmed-collision guard (docs/LESSONS.md, 2026-08-11): two bots that authenticate fine but
  // secretly resolve to the SAME Alpaca account look completely healthy individually — nothing
  // else here would ever notice. Check once at boot, before anything trades.
  const { safe: bots, collisions } = await guardAccountCollisions(loaded, (bot) =>
    botTradingClient(bot.credentials),
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
  announceRoster(playbookRoster);
  const tracker = new MomentumTracker(Number(process.env.SKYNET_MOMENTUM_WINDOW ?? "20"));
  const sentiment = new SentimentTracker(Number(process.env.SKYNET_SENTIMENT_WINDOW ?? "10"));
  const universeSet = new Set(UNIVERSE);

  // Durable momentum/sentiment/cooldowns (slice 4) — dark unless SKYNET_BOTS_DB_PATH is set, and
  // stamped on /data/health.json so the next deploy PROVES restore by being read (issue #1181).
  const botsStateDb = seedBotsState(process.env);
  health.restored(restoreBotsState(botsStateDb, tracker, sentiment, bots));

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
  const { marketClock, marketDataStream, getNews, currentCredentials } = shared;

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
  const decisionDb = seedDecisionDb(process.env);
  decisionDbRef = decisionDb;
  if (decisionDb && audit) {
    // Best-effort, idempotent (see decision-db-migration.ts) — a missing/corrupt read must never
    // fail boot, it just leaves this boot's backfill incomplete until the next one retries it.
    migrateAuditToDecisionDb(audit, decisionDb)
      .then(
        (n) => n > 0 && console.log(`[decision-db] migrated ${n} historical cycle(s) from JSONL`),
      )
      .catch((error) => console.warn("[decision-db] JSONL migration failed (non-fatal):", error));
  }
  const onDecision = decisionSink(audit, decisionDb);
  const onSettled = settlementSink(decisionDb); // a `working` order's late fill, beside its decision
  const botActivityBus = botBus(process.env); // #1211 slice 2 — dark unless configured
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
  seedDailyLossBaseline(await optionLevels.readAtBoot(bots), safety); // one read: baseline + levels
  const botRosters = buildBotRosters(bots, playbookRoster, process.env); // issue #885
  // #4535 slice 1b: tell the dashboard the env house roster so it can seed each bot's own
  // subscriptions from it (uncapped, behaviour-preserving) — rides the next `/controls` poll.
  controls.reportHouseRoster(
    houseRosterReport(
      bots.map((bot) => bot.persona.id),
      playbookRoster.enabled,
    ),
  );
  // What one bot trades under — at boot and on every swap: its roster, its own options level, and
  // (decision store on) its realized P/L per playbook.
  const rosterFor = (r: BotRoster) =>
    tradingRoster(
      r,
      optionLevels.risk(r.bot.persona.id, risk),
      decisionDb &&
        ((playbookId: string) => decisionDb.realizedPlForPlaybook(r.bot.persona.id, playbookId)),
    );
  const traders: LiveBot[] = botRosters.map((botRoster) =>
    buildLiveBot(botRoster.bot, {
      mode,
      trading: rosterFor(botRoster),
      blockedReason,
      safety,
      onDecision,
      hardcore: hardcoreRoster.hardcore,
      controls,
      bootControls,
      ...(botsStateDb ? { botsStateDb } : {}),
      ...(botActivityBus ? { activityBus: botActivityBus } : {}),
      ...(onSettled ? { onSettled } : {}),
    }),
  );
  botRosters.forEach(({ bot }, i) => {
    const broker = traders[i]?.broker;
    if (broker instanceof SwappableBotBroker) brokerHolders.set(bot.persona.id, broker);
  });
  // The stream follows what the rosters trade and the bots hold (#4777): the ten names, plus a
  // playbook's own tickers, re-subscribed in place on every swap below — never a restart.
  const botsStream = followBotsStream({
    stream: marketDataStream,
    tracker,
    universe: UNIVERSE,
    rosters: () => botRosters,
    log: console.log,
  });
  botsStream.refresh();
  // ONE swap path (Store change, options-level change), so every later read sees what is traded.
  const swapIn = (i: number, next: BotRoster) => {
    botRosters[i] = next;
    traders[i]?.trader.swapRoster(rosterFor(next));
    botsStream.refresh();
  };
  optionLevels.follow(botRosters, swapIn);
  // Boot-time correction (mirrors mergeRoster's "store overrides stale env" precedent): a
  // rotation that landed while this process was down is caught here, using the snapshot
  // bootMissionControl already fetched, rather than waiting up to 30s for the next live poll.
  // The shared data connections above are already wired, so this catches them too.
  await credentials.reconcile(bootControls);
  // Orders an earlier run left working go back to the settle loop first: the sweep below may end them.
  resumeWorkingOrders(brokerHolders, decisionDb, { scoutHost: botRosters[0]?.bot.persona.id });
  await sweepOrphanOptionOrders(brokerHolders); // our own stamped orders only, before any cycle
  // Expiries and assignments close option round trips no fill ever closes (#4642 slice 8).
  armOptionLifecycleSweep(brokerHolders, decisionDb);

  // --- beta scout: Eric's beta-phase directive (2026-08-13) — "deploying playbooks to observe
  // mechanics acting in live environments gives me confidence"; if nothing organic fires, force
  // a few small, honestly-labeled picks rather than wait indefinitely. Deliberately NOT a
  // Persona (which the contract requires to be pure — "same inputs, same intents"); this is
  // stateful orchestration, same category as smoke-trade.ts, run directly against a broker so
  // its picks still flow through the SAME guards (S2/E1, position cap) and audit trail as every
  // organic trade. Dark by default (SKYNET_BETA_FORCING unset = 0 = off).
  const betaForcing = parseBetaForcing(process.env.SKYNET_BETA_FORCING);
  const betaForcingMaxPicks = betaForcing.maxPicks;
  const scoutBroker: BrokerPort | undefined = traders[0]?.broker;
  announceScout(betaForcing, traders[0]?.personaName);
  const managedSymbols = scoutSkipSymbols(botRosters[0]); // traders[0]'s account

  // --- the Playbook Store bridge (issue #3595): a member's subscribe/allocate/toggle reaches
  // these already-running traders on the next `/controls` poll, in place, through `swapIn`.
  subscriptionSync = createSubscriptionSync({
    bots: botRosters.map((botRoster, i) => ({
      personaId: botRoster.bot.persona.id,
      applySubscriptions: (subscriptions) =>
        swapIn(i, resolveBotRoster(botRoster.bot, playbookRoster.enabled, subscriptions)),
    })),
    onApplied: (version, at) => {
      // The scout skips symbols a bot's own playbooks manage. Mutated in place rather than
      // rebuilt: `buildScoutDeps` below closes over THIS set, so a replacement would never be seen.
      managedSymbols.clear();
      for (const symbol of scoutSkipSymbols(botRosters[0])) managedSymbols.add(symbol);
      console.log(
        `[playbooks] Playbook Store subscriptions applied in place — version ${version}, stamped ${new Date(at).toISOString()}; no restart`,
      );
    },
    onStale: (version, at, inForceAt) =>
      console.warn(
        `[playbooks] REFUSED subscriptions ${version} stamped ${new Date(at).toISOString()} — older than the snapshot already in force (${new Date(inForceAt).toISOString()})`,
      ),
    onApplyError: (personaId, error) =>
      console.error(
        `[playbooks] ${personaId}: subscription swap failed (roster unchanged):`,
        error,
      ),
  });
  // Whatever the boot fetch already carried, applied now that there is a roster to apply it to.
  if (parkedSubscriptions) subscriptionSync.accept(parkedSubscriptions);

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
    onPortfolios: (portfolios) => botsStream.observeHoldings(portfolios),
    onEvalError: (personaName, error) => console.error(`[eval] ${personaName} failed:`, error),
    onBetaScoutError: (error) => console.error("[beta-scout] cycle failed:", error),
    onScoutHalted: (reason) => console.warn(`[beta-scout] skipped — halted: ${reason}`),
    onScoutObserve: (intent) =>
      console.log(
        `[beta-scout] would ${intent.side} ${intent.quantity} ${intent.symbol} (observe mode)`,
      ),
  });

  // COND-SCOUT (#3651): shadow probes only, dark unless SKYNET_COND_SCOUT_UNIVERSE is set.
  const condScoutPass = armCondScout(process.env, {
    streamed: UNIVERSE,
    credentials: currentCredentials,
    risk,
    blockedReason,
    botsStateDb,
    onDecision,
    ...(dataCredsPersonaId ? { hostPersonaId: dataCredsPersonaId } : {}),
    publish: replication.publishCondScout,
  });

  armMomentumPersistence(botsStateDb, tracker);

  const contextNow = () => sentiment.overlay(tracker.context(new Date().toISOString()));
  let lastEval = 0;
  let evaluating = false;
  const maybeEvaluate = async () => {
    const now = Date.now();
    if (evaluating || now - lastEval < LIVE_EVAL_INTERVAL_MS || !marketClock.isOpen()) return;
    lastEval = now;
    evaluating = true;
    const context = contextNow();
    await runner.runCycle(context);
    void condScoutPass(context); // never awaited: the shadow scout can't stall a real cycle
    evaluating = false;
  };
  // After-close staging (Eric, 2026-09-04) — dark unless SKYNET_BETA_FORCING carries "+stage".
  if (betaForcing.stageAfterClose && scoutBroker) {
    armScoutStaging({ clock: marketClock, runner, context: contextNow, log: console.log });
  }

  marketDataStream.start();

  console.log(
    `Autonomous trading started [live] — bots: ${bots.map((b) => b.persona.name).join(", ")}; streaming: ${botsStream.symbols().join(", ")}; maxPosition ${(risk.maxPositionPct * 100).toFixed(1)}%; market ${marketClock.isOpen() ? "OPEN" : "closed"}.`,
  );
}

main().catch((error) => {
  console.error("Autonomous trading failed:", error);
  process.exit(1);
});
