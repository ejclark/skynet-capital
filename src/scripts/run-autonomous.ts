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
import { InMemoryBroker } from "../adapters/in-memory-broker.js";
import { ReplayEventStream } from "../adapters/replay-event-stream.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaMarketDataStream } from "../alpaca/market-data-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { AutonomousTrader, type TraderMode } from "../autonomous/autonomous-trader.js";
import {
  type ControlsState,
  effectiveMode as controlsMode,
  EMPTY_CONTROLS,
} from "../autonomous/bot-controls.js";
import { type BotControlsClient, resolveBotControls } from "../autonomous/bot-controls-client.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { JsonlAuditStore } from "../autonomous/jsonl-audit-store.js";
import { type BetaScoutDeps, type LiveBot, LiveCycleRunner } from "../autonomous/live-cycle.js";
import { MomentumTracker } from "../autonomous/momentum-tracker.js";
import { assessReadiness } from "../autonomous/readiness.js";
import { SafetyController } from "../autonomous/safety.js";
import { guardAccountCollisions } from "../bots/account-guard.js";
import { ALPACA_PAPER_BASE_URL, type Bot } from "../bots/bot.js";
import { createBotBroker } from "../bots/bot-broker.js";
import { enabledBotIds, loadBots } from "../bots/bot-registry.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { RiskConfig } from "../engine/guards.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { hardcoreScenarioPacks, scenarioPacks } from "../evals/scenarios/index.js";
import { AlpacaNewsClient } from "../news/alpaca-news-client.js";
import { SentimentTracker } from "../news/sentiment-tracker.js";
import { applyHardcore, createDefaultPersonas } from "../personas/registry.js";
import { enabledPlaybooks } from "../playbooks/registry.js";
import { withPlaybooks } from "../playbooks/with-playbooks.js";
import type { BrokerPort } from "../ports/broker.js";
import { ALPACA_DATA_BASE_URL, readOfflineEvents } from "../runtime/data-source.js";

// The universe the bots watch: the Day Trader's big-tech focus, plus the Prospector's warm-up
// claims (CRWV, MRVL). A symbol absent here has no quote, so a persona simply never sees it —
// adding a claim to the Prospector without adding it here is a silent no-op.
const UNIVERSE = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "CRWV", "MRVL"];
const LIVE_EVAL_INTERVAL_MS = 15_000;
const OFFLINE_STARTING_CASH = 1_000_000;
/** Hardcore research mode paces per-symbol orders at 90s (standard: 5m) — iteration is the goal. */
const HARDCORE_COOLDOWN_MS = 90_000;
const _EVAL_INTERVAL_MS = 15_000;
const NEWS_POLL_MS = 60_000;

async function main(): Promise<void> {
  if ((process.env.SKYNET_DATA_SOURCE ?? "live") === "offline") {
    runOffline();
    return;
  }
  await runLive();
}

// --- offline: replay fixtures against in-memory brokers, no keys, always "open" ----------

function runOffline(): void {
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

// --- live: the real Alpaca market-data stream + broker, gated on market hours ------------

async function runLive(): Promise<void> {
  const enabled = new Set(enabledBotIds(process.env));
  const { controls, bootControls } = await bootMissionControl();
  // Filter to the ENABLED roster before resolving credentials: the shared-account fallback has
  // exactly one seat, and a roster of one must not be denied it because eight idle personas in the
  // registry would also have qualified.
  const hardcoreRoster = resolveRoster(enabled, bootControls);
  const roster = hardcoreRoster.personas;
  const { bots: loaded, sharedAccount } = loadBots(roster, process.env);
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
  if (!dataCreds) {
    process.exit(1);
  }
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
    // The owner's global suspend gates everything this seam gates — the beta scout included.
    // Empty id = only the all-bots switch can match; per-bot suspends compose in buildLiveBot.
    return safety.blockedReason() ?? controls.suspendedReason("");
  };
  controls.start();
  console.log(
    `[autonomous] mode=${mode}${mode === "observe" ? " (dry run — no orders placed; set SKYNET_AUTONOMOUS_MODE=live to trade)" : " — PLACING PAPER ORDERS"}${haltFile ? `; kill switch: touch ${haltFile}` : ""}`,
  );
  const traders: LiveBot[] = bots.map((bot) =>
    buildLiveBot(bot, {
      mode,
      playbookRoster,
      risk,
      blockedReason,
      safety,
      onDecision,
      hardcore: hardcoreRoster.hardcore,
      controls,
      bootControls,
    }),
  );

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
  const managedSymbols = new Set(playbookRoster.enabled.map((e) => e.playbook.symbol));

  // The per-cycle orchestration core (docs/GAPS-2026-08.md item 7) — pure, dependency-injected,
  // fully spec'd in tests/autonomous/live-cycle.spec.ts. Everything below is wiring: real
  // brokers, the halt-file-aware blockedReason, and console/audit sinks for its hooks.
  const runner = new LiveCycleRunner({
    traders,
    safety,
    blockedReason,
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
    await runner.runCycle(context);
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

/** READINESS GATE + wiring for one live bot: a not-ready persona is pinned to `observe` (watched,
 *  placing nothing) no matter what `SKYNET_AUTONOMOUS_MODE` says. Pulled out of `runLive` to keep
 *  its own branching off that function's complexity budget (`scripts/arch-scan.mjs`'s sibling
 *  lint gate) — it has no state of its own, so it's still just wiring, not a `LiveCycleRunner`. */
function buildLiveBot(
  bot: Bot,
  opts: {
    mode: TraderMode;
    playbookRoster: ReturnType<typeof enabledPlaybooks>;
    risk: RiskConfig;
    blockedReason: () => string | null;
    safety: SafetyController;
    onDecision: (r: DecisionRecord) => void;
    /** Ids running their hardcore research-mode build — own readiness pack, faster cooldown. */
    hardcore: ReadonlySet<string>;
    /** Mission Control: dynamic suspend checks (polled) + the boot snapshot for mode overrides. */
    controls: BotControlsClient;
    bootControls: ControlsState;
  },
): LiveBot {
  const hardcore = opts.hardcore.has(bot.persona.id);
  const readiness = assessReadiness(bot.persona, {
    pack: hardcore ? hardcoreScenarioPacks[bot.persona.id] : scenarioPacks[bot.persona.id],
    safetyScenarios: genericSafetyScenarios,
  });
  // The owner's per-bot mode override (Mission Control, boot-applied) narrows the env default;
  // the readiness gate still has the final say below.
  const wantedMode = controlsMode(opts.bootControls, bot.persona.id, opts.mode);
  if (wantedMode !== opts.mode) {
    console.log(`[controls] ${bot.persona.name}: mode ${wantedMode} (owner override)`);
  }
  const effectiveMode = wantedMode === "live" && readiness.ready ? "live" : "observe";
  if (wantedMode === "live" && !readiness.ready) {
    console.warn(
      `[gate] ${bot.persona.name} is NOT ready — pinned to observe. ${readiness.reason}`,
    );
  } else {
    console.log(`[gate] ${bot.persona.name}: ${readiness.reason} → ${effectiveMode}`);
  }
  const broker = createBotBroker(bot);
  return {
    personaName: bot.persona.name,
    broker,
    trader: new AutonomousTrader({
      // Readiness is assessed on the BASE persona (its certified judgment); playbooks compose on
      // top as date-keyed plays with their own evidence trail, dark until SKYNET_PLAYBOOKS names
      // them — the enablement flip rides the approval-gated autonomy-ops path.
      persona: withPlaybooks(bot.persona, opts.playbookRoster.enabled, UPCOMING_PRINTS),
      broker,
      risk: opts.risk,
      mode: effectiveMode,
      // Hardcore research mode iterates fast: 90s between orders in a symbol instead of 5m.
      // Small tranches keep the order-rate breaker (20/min) and daily-loss breaker (5%) binding.
      ...(hardcore ? { cooldownMs: HARDCORE_COOLDOWN_MS } : {}),
      // Per-bot suspend (Mission Control, polled) composes with the kill switch/breakers: either
      // blocks the cycle, and the decision record carries the owner's reason verbatim.
      blockedReason: () => opts.controls.suspendedReason(bot.persona.id) ?? opts.blockedReason(),
      onResult: (r) => {
        opts.safety.recordOrder();
        logResult(r);
      },
      onDecision: (r) => {
        if (r.halted) console.warn(`[HALTED] ${r.personaId}: ${r.halted} — not trading`);
        opts.onDecision(r);
      },
    }),
  };
}

/** Mission Control boot (Eric, 2026-08-21): one bounded fetch for the boot-applied overrides
 *  (mode/hardcore); the dynamic suspend toggles ride the background poll started in runLive. */
async function bootMissionControl(): Promise<{
  controls: BotControlsClient;
  bootControls: ControlsState;
}> {
  const controls = resolveBotControls(process.env);
  const bootControls = (await controls.fetchOnce()) ?? EMPTY_CONTROLS;
  console.log(
    controls.enabled
      ? "[controls] bridge armed — Mission Control suspend toggles apply within ~30s"
      : "[controls] bridge unset (SKYNET_INSIGHTS_BRIDGE_URL) — env-only controls",
  );
  return { controls, bootControls };
}

/** The enabled personas with hardcore builds applied and announced — shared by both runners. */
function resolveRoster(
  enabled: ReadonlySet<string>,
  controls: ControlsState = EMPTY_CONTROLS,
): ReturnType<typeof applyHardcore> {
  const roster = applyHardcore(
    createDefaultPersonas().filter((p) => enabled.has(p.id)),
    process.env,
    controls,
  );
  logHardcore(roster);
  return roster;
}

/** Announce the hardcore roster at boot — armed loudly, unknown ids refused, dark silently. */
function logHardcore(roster: ReturnType<typeof applyHardcore>): void {
  for (const bad of roster.rejected) {
    console.error(
      `[hardcore] REFUSED unknown id "${bad}" in SKYNET_HARDCORE_BOTS — no hardcore build exists for it`,
    );
  }
  if (roster.hardcore.size > 0) {
    console.log(
      `[hardcore] armed: ${[...roster.hardcore].join(", ")} — research mode (loosened extremes, tranche scale-in/out, momentum scalps, ${HARDCORE_COOLDOWN_MS / 1000}s cooldown, E1 waived per-intent, S2 + breakers intact)`,
    );
  }
}

/** The beta scout's config, or `undefined` (dark) when unarmed or no bot account exists yet. */
function buildScoutDeps(
  betaForcingMaxPicks: number,
  scoutBroker: BrokerPort | undefined,
  opts: {
    universe: readonly string[];
    managedSymbols: ReadonlySet<string>;
    risk: RiskConfig;
    mode: TraderMode;
  },
): BetaScoutDeps | undefined {
  if (betaForcingMaxPicks <= 0 || !scoutBroker) {
    return undefined;
  }
  return { maxPicks: betaForcingMaxPicks, broker: scoutBroker, ...opts };
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
