/**
 * Boot-time wiring for the live autonomous runner in `run-autonomous.ts`: the Mission Control
 * bootstrap fetch, the enabled-persona roster (hardcore builds applied and announced), and the
 * per-bot construction that gates a persona's mode on its readiness pack before wiring its
 * `AutonomousTrader`. Pulled out to keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`'s sibling lint gate) — everything here is wiring, no state of its own.
 */

import type { AlpacaAccount } from "../alpaca/alpaca-trading-client.js";
import { AutonomousTrader, type TraderMode } from "../autonomous/autonomous-trader.js";
import {
  type ControlsState,
  effectiveMode as controlsMode,
  EMPTY_CONTROLS,
} from "../autonomous/bot-controls.js";
import { type BotControlsClient, resolveBotControls } from "../autonomous/bot-controls-client.js";
import { type BotsHealthFile, resolveBotsHealthFile } from "../autonomous/bots-health-file.js";
import type { BotsStateDb } from "../autonomous/bots-state-db.js";
import { openBotsStateDb } from "../autonomous/bots-state-db.js";
import { fleetDayOpenEquity, parseDayOpenEquity } from "../autonomous/day-open-equity.js";
import { type DecisionDb, decisionDbPathFrom, openDecisionDb } from "../autonomous/decision-db.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { BetaScoutDeps, LiveBot } from "../autonomous/live-cycle.js";
import { assessReadiness } from "../autonomous/readiness.js";
import type { SafetyController } from "../autonomous/safety.js";
import type { SubscriptionsSnapshot } from "../autonomous/subscriptions-wire.js";
import type { Bot } from "../bots/bot.js";
import { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import { BOTS_UNIVERSE } from "../domain/bots-universe.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { OrderSettlement } from "../domain/order-settlement.js";
import type { PlaybookSubscription } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { hardcoreScenarioPacks, scenarioPacks } from "../evals/scenarios/index.js";
import type { ActivityEventBus } from "../observatory/activity-event.js";
import type { Persona } from "../personas/persona.js";
import { applyHardcore, createDefaultPersonas } from "../personas/registry.js";
import { withQuoteUniverse } from "../personas/universe-view.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import { withOptionSafety } from "../playbooks/with-option-safety.js";
import { withPlaybooks } from "../playbooks/with-playbooks.js";
import type { BrokerPort } from "../ports/broker.js";
import { createSubscriptionStore } from "../server/subscription-store.js";
import {
  mergeRosters,
  pausedRoster,
  subscriptionRoster,
} from "../subscriptions/subscription-roster.js";
import { optionReadWarn, optionTraderConfig, ownedRoster } from "./autonomous-option-wiring.js";
import { botOrderPublisher, logResult } from "./autonomous-sinks.js";

const HARDCORE_COOLDOWN_MS = 90_000;

/** Mission Control boot (Eric, 2026-08-21): one bounded fetch for the boot-applied overrides
 *  (mode/hardcore); the dynamic suspend toggles ride the background poll started in runLive.
 *
 *  The three boot lines are load-bearing OBSERVABILITY, not flavor: "armed — controls fetched"
 *  prints only when the fetch actually RETURNED a parsed state, because scripts/smoke-bots.sh
 *  greps for it as proof the cross-app bridge is reachable. The earlier single "armed" line fired
 *  whenever the env var was merely SET — which made the one silent failure mode this deployment
 *  has (bridge unreachable → fail-open to env-only controls → Eric's suspend toggles quietly stop
 *  arriving) indistinguishable from health. */
export async function bootMissionControl(
  onFetched?: (state: ControlsState) => void,
  // The process's own health stamp on the volume (bots-health-file.ts): the same three verdicts
  // as the log lines below, but readable the instant they're written — what scripts/smoke-bots.sh
  // reads instead of lagging `flyctl logs`. Dark unless SKYNET_BOTS_HEALTH_PATH is set.
  health: BotsHealthFile = resolveBotsHealthFile(process.env),
  // Fires on every poll with the app's decisionsCursor (decision-replication-client.ts's hook) —
  // threaded straight through to resolveBotControls, see that file's own doc for why this is a
  // separate hook from onFetched rather than folded into ControlsState.
  onDecisionsCursor?: (cursor: Readonly<Record<string, number>>) => void,
  // Fires on every poll carrying a well-formed Playbook Store snapshot (subscription-sync.ts's
  // hook) — threaded straight through to resolveBotControls, same shape as the cursor above.
  onSubscriptions?: (snapshot: SubscriptionsSnapshot) => void,
): Promise<{
  controls: BotControlsClient;
  bootControls: ControlsState;
  /** Handed back so the caller can stamp what `restoreBotsState` rehydrated — that happens
   *  later in boot, after the roster and the DB exist (`run-autonomous.ts`). */
  health: BotsHealthFile;
}> {
  const controls = resolveBotControls(
    process.env,
    (state) => {
      health.controlsFetched();
      onFetched?.(state);
    },
    onDecisionsCursor,
    onSubscriptions,
  );
  const fetched = await controls.fetchOnce();
  health.boot(controls.enabled);
  if (health.path) console.log(`[health] stamping ${health.path}`);
  if (!controls.enabled) {
    console.log("[controls] bridge unset (SKYNET_INSIGHTS_BRIDGE_URL) — env-only controls");
  } else if (fetched) {
    console.log(
      "[controls] bridge armed — controls fetched; Mission Control suspend toggles apply within ~30s",
    );
  } else {
    console.warn(
      "[controls] bridge configured but UNREACHABLE — env-only controls until the 30s poll succeeds",
    );
  }
  return { controls, bootControls: fetched ?? EMPTY_CONTROLS, health };
}

/**
 * Seed the daily-loss breaker from Alpaca's own day-open equity (`last_equity`) — best-effort,
 * never fatal to boot. The gap this closes: `SafetyController` is constructed fresh on every
 * process boot, so without this a mid-day restart (this app's whole reason to exist, see
 * `fly.bots.toml`) quietly re-anchors the breaker to whatever equity it happens to read first,
 * forgiving the day's drawdown so far. A read failure here simply leaves the baseline unset — the
 * pre-existing first-`recordEquity` fallback in `safety.ts` takes over exactly as it always has;
 * this can only make the correct case (a real day-open number) possible, never the fallback worse.
 * The accounts come from the one boot read (`readBootAccounts`); a bot whose read failed drops the
 * whole seed, never a partial one (`fleetDayOpenEquity`).
 */
export function seedDailyLossBaseline(
  accounts: ReadonlyMap<string, AlpacaAccount | undefined>,
  safety: SafetyController,
): void {
  // The read already cannot throw (`readBootAccounts`); this catch keeps the parse and the seed
  // just as non-fatal, so a malformed payload never stops every bot at boot.
  try {
    const perBotEquity = [...accounts.values()].map((a) => (a ? parseDayOpenEquity(a) : null));
    const seed = fleetDayOpenEquity(perBotEquity);
    if (seed === null) {
      console.warn(
        "[safety] day-open equity unavailable — daily-loss baseline falls back to the first equity reading this process sees",
      );
      return;
    }
    safety.seedBaseline(seed);
    console.log(`[safety] daily-loss baseline seeded from day-open equity: $${seed.toFixed(2)}`);
  } catch (error) {
    console.warn("[safety] day-open equity seed failed (non-fatal):", error);
  }
}

/**
 * Opens the bots-state DB (momentum/sentiment/cooldown durability, `docs/plans/trade-insights-loop.md`
 * slice 4) when `SKYNET_BOTS_DB_PATH` is set — dark by default, exactly like `SKYNET_AUDIT_DIR`.
 * Best-effort, same posture as `seedDailyLossBaseline`: a missing/corrupt DB file must never fail
 * boot, it just leaves durability off for this run (today's cold-start behavior, unchanged).
 */
export function seedBotsState(env: NodeJS.ProcessEnv): BotsStateDb | undefined {
  const path = env.SKYNET_BOTS_DB_PATH;
  if (!path) return undefined;
  try {
    const db = openBotsStateDb(path);
    console.log(`[bots-state] durable momentum/sentiment/cooldown storage armed: ${path}`);
    return db;
  } catch (error) {
    console.warn("[bots-state] open failed (non-fatal) — falling back to cold-start state:", error);
    return undefined;
  }
}

/**
 * Opens the queryable decision store (`docs/plans/where-are-we-documenting-*.md` PR 3 / issue
 * #2287) on a path DERIVED from `SKYNET_BOTS_DB_PATH` — a sibling `decisions.db` in the same
 * directory, never a new env var (declaring one with its own relative-path fallback would trip
 * the blocking `tests/arch/volume-persistence.spec.ts` gate, which scans for exactly that shape).
 * Dark exactly when bots-state durability is dark; best-effort, same posture as `seedBotsState` —
 * a missing/corrupt file must never fail boot.
 */
export function seedDecisionDb(env: NodeJS.ProcessEnv): DecisionDb | undefined {
  const botsStatePath = env.SKYNET_BOTS_DB_PATH;
  if (!botsStatePath) return undefined;
  try {
    const path = decisionDbPathFrom(botsStatePath);
    const db = openDecisionDb(path);
    console.log(`[decision-db] queryable decision store armed: ${path}`);
    return db;
  } catch (error) {
    console.warn(
      "[decision-db] open failed (non-fatal) — falling back to JSONL-audit-only behavior:",
      error,
    );
    return undefined;
  }
}

/** The enabled personas with hardcore builds applied and announced — shared by both runners. */
export function resolveRoster(
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
export function buildScoutDeps(
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

/** One bot's resolved roster: the house roster plus its own subscriptions layered on top. */
export interface BotRoster {
  readonly bot: Bot;
  readonly subscriptions: readonly PlaybookSubscription[];
  readonly enabled: readonly EnabledPlaybook[];
}

/**
 * Per-account playbook subscriptions: each bot runs the house roster PLUS whatever
 * it has personally subscribed to, with its own capital sub-allocation — a subscription
 * overrides the house roster's entry for the same playbook id (its own mode/capital wins), never
 * a second conflicting entry for the same symbol. A bot with no subscriptions is byte-identical
 * to the pre-subscription roster. Pulled out for the same reason as `buildLiveBot` — keeps
 * `runLive`'s own complexity budget.
 */
export function buildBotRosters(
  bots: readonly Bot[],
  playbookRoster: { readonly enabled: readonly EnabledPlaybook[] },
  env: NodeJS.ProcessEnv,
): BotRoster[] {
  const subscriptionsByAccount = createSubscriptionStore(env).load();
  return bots.map((bot) =>
    resolveBotRoster(bot, playbookRoster.enabled, subscriptionsByAccount[bot.persona.id] ?? []),
  );
}

/**
 * One bot's roster for a given subscription set. THE single definition, called both at boot (via
 * `buildBotRosters` above, off the local file) and on every live subscription swap (issue #3595,
 * off the snapshot the `/controls` poll carries) — a second copy is exactly how a swapped roster
 * would drift from what a restart would have produced. An option playbook then claims its
 * underlyings from every other playbook in the roster, and a persona's own rules (SAURON) yield
 * every symbol another playbook trades (`option-ownership.ts`).
 */
export function resolveBotRoster(
  bot: Bot,
  houseEnabled: readonly EnabledPlaybook[],
  subscriptions: readonly PlaybookSubscription[],
): BotRoster {
  const acctRoster = subscriptionRoster(subscriptions);
  for (const bad of acctRoster.rejected) {
    console.error(
      `[playbooks] ${bot.persona.id} is subscribed to unknown playbook "${bad}" — refused`,
    );
  }
  if (acctRoster.enabled.length > 0) {
    console.log(
      `[playbooks] ${bot.persona.id} subscribed: ${acctRoster.enabled.map((e) => `${e.playbook.id}:${e.mode}`).join(", ")}`,
    );
  }
  // Paused: opens nothing new (a covered call excepted); its names and exits are unchanged.
  const paused = pausedRoster(subscriptions);
  if (paused.length > 0) {
    console.log(
      `[playbooks] ${bot.persona.id} paused (opens nothing new): ${paused.map((e) => e.playbook.id).join(", ")}`,
    );
  }
  const merged = mergeRosters(houseEnabled, [...acctRoster.enabled, ...paused]);
  return { bot, subscriptions, enabled: ownedRoster(bot.persona.id, merged) };
}

/** The two subscription-sensitive halves of a bot's trader config. */
export interface TradingRoster {
  /** The base persona with this roster's playbooks composed on (`withPlaybooks`), wrapped in expiry
   *  hygiene (`withOptionSafety`). */
  readonly persona: Persona;
  /** The risk config the guards read — capital allocations and symbol filters ride here. */
  readonly risk: RiskConfig;
}

/**
 * What one bot trades under, for a resolved roster. Like `resolveBotRoster`, ONE definition shared
 * by boot (`buildLiveBot` below) and by the live swap (`AutonomousTrader.swapRoster`), so a
 * subscription change applied without a restart produces byte-for-byte what a restart would.
 */
export function tradingRoster(
  roster: BotRoster,
  baseRisk: RiskConfig,
  realizedPlForPlaybook?: (playbookId: string) => number,
): TradingRoster {
  return {
    // Readiness is assessed on the BASE persona (its certified judgment); playbooks compose on
    // top as date-keyed plays with their own evidence trail, dark until SKYNET_PLAYBOOKS or a
    // Playbook Store subscription names them.
    // `console` is the live runtime's log sink: an opted-in playbook's mixed-signals readings
    // (#3194 step 5b-i) land beside the `[playbooks]`/`[gate]` lines. Observe-only — the sink
    // never feeds back into a decision. Expiry hygiene wraps it all, so a contract on the account is
    // looked after even with no option playbook subscribed (`with-option-safety.ts`). The base persona
    // sees only the ten names, whatever else the stream carries for a playbook (#4777) — on every
    // bot, a bot with no playbook included.
    persona: withOptionSafety(
      withPlaybooks(
        withQuoteUniverse(roster.bot.persona, BOTS_UNIVERSE),
        roster.enabled,
        UPCOMING_PRINTS,
        [],
        console,
      ),
      roster.enabled,
      UPCOMING_PRINTS,
    ),
    risk: {
      ...baseRisk,
      subscriptions: roster.subscriptions,
      playbookSymbols: new Map(roster.enabled.map((e) => [e.playbook.id, e.playbook.symbols])),
      ...(realizedPlForPlaybook ? { realizedPlForPlaybook } : {}),
    },
  };
}

/** READINESS GATE + wiring for one live bot: a not-ready persona is pinned to `observe` (watched,
 *  placing nothing) no matter what `SKYNET_AUTONOMOUS_MODE` says. Pulled out of `runLive` to keep
 *  its own branching off that function's complexity budget (`scripts/arch-scan.mjs`'s sibling
 *  lint gate) — it has no state of its own, so it's still just wiring, not a `LiveCycleRunner`. */
export function buildLiveBot(
  bot: Bot,
  opts: {
    mode: TraderMode;
    /** What this bot trades under at boot — `tradingRoster` above. The live subscription swap
     *  (issue #3595) replaces exactly this pair via `AutonomousTrader.swapRoster`. */
    trading: TradingRoster;
    blockedReason: () => string | null;
    safety: SafetyController;
    onDecision: (r: DecisionRecord) => void;
    /** Ids running their hardcore research-mode build — own readiness pack, faster cooldown. */
    hardcore: ReadonlySet<string>;
    /** Mission Control: dynamic suspend checks (polled) + the boot snapshot for mode overrides. */
    controls: BotControlsClient;
    bootControls: ControlsState;
    /** Durable cooldown storage (slice 4) — omit to run cold-start, exactly as before this existed. */
    botsStateDb?: BotsStateDb;
    /** The bots app's local event bus (#1211 slice 2) — omit (no durable dir configured) to run
     *  exactly as before this existed: no publish attempted, nothing to fail. */
    activityBus?: ActivityEventBus;
    /** What an order this bot left `working` became once the broker ended it (#4650) — omit (no
     *  decision store) and late fills stay with the broker's own ledger, as before. */
    onSettled?: (settlement: OrderSettlement) => void;
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
  // The same verdict as the log line above, riding the `/controls` poll this bot's process is
  // already making — the ops-status panel's credential-free "which personas are gated, and why"
  // (#666 slice 3).
  opts.controls.reportPersonaGate({
    id: bot.persona.id,
    ready: readiness.ready,
    reason: readiness.reason,
  });
  // Swappable, not the plain factory: lets a future credential rotation swap the Alpaca
  // client this bot trades with in place, without restarting the process (and therefore
  // without losing any bot's in-memory momentum/sentiment/cooldown state).
  const broker = new SwappableBotBroker(bot, {
    ...(opts.activityBus
      ? { onSubmitted: botOrderPublisher(bot.persona.id, opts.activityBus) }
      : {}),
    onOptionReadError: optionReadWarn(bot.persona.id),
    ...(opts.onSettled ? { onSettled: opts.onSettled } : {}),
  });
  return {
    personaName: bot.persona.name,
    broker,
    trader: new AutonomousTrader({
      persona: opts.trading.persona,
      broker,
      ...optionTraderConfig(broker),
      risk: opts.trading.risk,
      mode: effectiveMode,
      // Hardcore research mode iterates fast: 90s between orders in a symbol instead of 5m.
      // Small tranches keep the order-rate breaker (20/min) and daily-loss breaker (5%) binding.
      ...(hardcore ? { cooldownMs: HARDCORE_COOLDOWN_MS } : {}),
      // Durable cooldowns (slice 4): restored at construction, persisted on every order — dark
      // (both no-ops) unless SKYNET_BOTS_DB_PATH is set.
      ...(opts.botsStateDb
        ? {
            initialCooldowns: opts.botsStateDb.loadCooldowns(bot.persona.id),
            onCooldownSet: (symbol: string, at: number) =>
              opts.botsStateDb?.saveCooldown(bot.persona.id, symbol, at),
          }
        : {}),
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
