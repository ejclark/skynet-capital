/**
 * Boot-time wiring for the live autonomous runner in `run-autonomous.ts`: the Mission Control
 * bootstrap fetch, the enabled-persona roster (hardcore builds applied and announced), and the
 * per-bot construction that gates a persona's mode on its readiness pack before wiring its
 * `AutonomousTrader`. Pulled out to keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`'s sibling lint gate) — everything here is wiring, no state of its own.
 */
import { AutonomousTrader, type TraderMode } from "../autonomous/autonomous-trader.js";
import {
  type ControlsState,
  effectiveMode as controlsMode,
  EMPTY_CONTROLS,
} from "../autonomous/bot-controls.js";
import { type BotControlsClient, resolveBotControls } from "../autonomous/bot-controls-client.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { BetaScoutDeps, LiveBot } from "../autonomous/live-cycle.js";
import { assessReadiness } from "../autonomous/readiness.js";
import type { SafetyController } from "../autonomous/safety.js";
import type { Bot } from "../bots/bot.js";
import { createBotBroker } from "../bots/bot-broker.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { RiskConfig } from "../engine/guards.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { hardcoreScenarioPacks, scenarioPacks } from "../evals/scenarios/index.js";
import { applyHardcore, createDefaultPersonas } from "../personas/registry.js";
import type { enabledPlaybooks } from "../playbooks/registry.js";
import { withPlaybooks } from "../playbooks/with-playbooks.js";
import type { BrokerPort } from "../ports/broker.js";
import { logResult } from "./autonomous-sinks.js";

const HARDCORE_COOLDOWN_MS = 90_000;

/** Mission Control boot (Eric, 2026-08-21): one bounded fetch for the boot-applied overrides
 *  (mode/hardcore); the dynamic suspend toggles ride the background poll started in runLive. */
export async function bootMissionControl(): Promise<{
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
