/**
 * Boot-time wiring for the live autonomous runner in `run-autonomous.ts`: the Mission Control
 * bootstrap fetch, the enabled-persona roster (hardcore builds applied and announced), and the
 * per-bot construction that gates a persona's mode on its readiness pack before wiring its
 * `AutonomousTrader`. Pulled out to keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`'s sibling lint gate) — everything here is wiring, no state of its own.
 */

import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { AutonomousTrader, type TraderMode } from "../autonomous/autonomous-trader.js";
import {
  type ControlsState,
  effectiveMode as controlsMode,
  EMPTY_CONTROLS,
} from "../autonomous/bot-controls.js";
import { type BotControlsClient, resolveBotControls } from "../autonomous/bot-controls-client.js";
import { fleetDayOpenEquity, parseDayOpenEquity } from "../autonomous/day-open-equity.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { BetaScoutDeps, LiveBot } from "../autonomous/live-cycle.js";
import { assessReadiness } from "../autonomous/readiness.js";
import type { SafetyController } from "../autonomous/safety.js";
import { ALPACA_PAPER_BASE_URL, type Bot } from "../bots/bot.js";
import { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { PlaybookSubscription } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { hardcoreScenarioPacks, scenarioPacks } from "../evals/scenarios/index.js";
import { applyHardcore, createDefaultPersonas } from "../personas/registry.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import type { enabledPlaybooks } from "../playbooks/registry.js";
import { withPlaybooks } from "../playbooks/with-playbooks.js";
import type { BrokerPort } from "../ports/broker.js";
import { createSubscriptionStore } from "../server/subscription-store.js";
import { mergeRosters, subscriptionRoster } from "../subscriptions/subscription-roster.js";
import { logResult } from "./autonomous-sinks.js";

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
export async function bootMissionControl(onFetched?: (state: ControlsState) => void): Promise<{
  controls: BotControlsClient;
  bootControls: ControlsState;
}> {
  const controls = resolveBotControls(process.env, onFetched);
  const fetched = await controls.fetchOnce();
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
  return { controls, bootControls: fetched ?? EMPTY_CONTROLS };
}

/**
 * Seed the daily-loss breaker from Alpaca's own day-open equity (`last_equity`) — best-effort,
 * never fatal to boot. The gap this closes: `SafetyController` is constructed fresh on every
 * process boot, so without this a mid-day restart (this app's whole reason to exist, see
 * `fly.bots.toml`) quietly re-anchors the breaker to whatever equity it happens to read first,
 * forgiving the day's drawdown so far. A read failure here simply leaves the baseline unset — the
 * pre-existing first-`recordEquity` fallback in `safety.ts` takes over exactly as it always has;
 * this can only make the correct case (a real day-open number) possible, never the fallback worse.
 */
export async function seedDailyLossBaseline(
  bots: readonly Bot[],
  safety: SafetyController,
): Promise<void> {
  try {
    const perBotEquity = await Promise.all(
      bots.map(async (bot) => {
        const client = new AlpacaTradingClient(
          new FetchAlpacaTradingTransport({
            baseUrl: bot.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
            apiKey: bot.credentials.apiKey,
            apiSecret: bot.credentials.apiSecret,
          }),
        );
        return parseDayOpenEquity(await client.getAccount());
      }),
    );
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
  return bots.map((bot) => {
    const subscriptions = subscriptionsByAccount[bot.persona.id] ?? [];
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
    return {
      bot,
      subscriptions,
      enabled: mergeRosters(playbookRoster.enabled, acctRoster.enabled),
    };
  });
}

/** READINESS GATE + wiring for one live bot: a not-ready persona is pinned to `observe` (watched,
 *  placing nothing) no matter what `SKYNET_AUTONOMOUS_MODE` says. Pulled out of `runLive` to keep
 *  its own branching off that function's complexity budget (`scripts/arch-scan.mjs`'s sibling
 *  lint gate) — it has no state of its own, so it's still just wiring, not a `LiveCycleRunner`. */
export function buildLiveBot(
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
  // Swappable, not the plain factory: lets a future credential rotation swap the Alpaca
  // client this bot trades with in place, without restarting the process (and therefore
  // without losing any bot's in-memory momentum/sentiment/cooldown state).
  const broker = new SwappableBotBroker(bot);
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
