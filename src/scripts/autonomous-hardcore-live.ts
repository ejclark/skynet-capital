/**
 * The owner's hardcore setting, live (#4535 slice 2c). Mission Control's per-bot hardcore switch used
 * to apply at the next boot, because a hardcore build is more than a persona: it also brings a faster
 * order cooldown and its own readiness pack, and the readiness verdict decides whether the bot may
 * trade live at all. Those three change together or not at all — a hardcore persona running under
 * the standard pack's verdict, or the other way round, is exactly the mismatch the gate exists to stop.
 *
 * So the flip re-runs the gate (`gateBuild`, the same code the boot path uses) on the build being
 * swapped IN, and the resulting mode, the cooldown and the persona land in one `swapRoster`. A hardcore
 * build that is not ready leaves the bot pinned to observe, exactly as at boot — flipping the switch
 * can never put a bot live that the gate would not have.
 *
 * Mode itself (observe/live) stays the house-wide ops action (the plan's stated default): the flip
 * keeps whatever mode the bot WANTED at boot and lets the gate narrow it.
 */

import type { TraderMode, TraderTuning } from "../autonomous/autonomous-trader.js";
import { type ControlsState, effectiveHardcoreIds } from "../autonomous/bot-controls.js";
import type { BotControlsClient } from "../autonomous/bot-controls-client.js";
import { assessReadiness } from "../autonomous/readiness.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { hardcoreScenarioPacks, scenarioPacks } from "../evals/scenarios/index.js";
import type { Persona } from "../personas/persona.js";
import { personaBuild } from "../personas/registry.js";

/** Hardcore research mode iterates fast: 90s between orders in a symbol instead of 5m. Small tranches
 *  keep the order-rate breaker (20/min) and daily-loss breaker (5%) binding. */
export const HARDCORE_COOLDOWN_MS = 90_000;

/** What a build trades under: the mode its readiness gate allows, and its order cooldown. */
export function buildTuning(mode: TraderMode, hardcore: boolean): TraderTuning {
  return { mode, ...(hardcore ? { cooldownMs: HARDCORE_COOLDOWN_MS } : {}) };
}

/**
 * READINESS GATE for one persona build: a not-ready build is pinned to `observe` (watched, placing
 * nothing) no matter what mode was wanted. Logged and reported on the `/controls` poll (#666 slice 3)
 * — the ops-status panel's credential-free "which personas are gated, and why". Shared by boot
 * (`buildLiveBot`) and the live hardcore flip, so the two can never judge a build differently.
 */
export function gateBuild(
  persona: Persona,
  hardcore: boolean,
  wantedMode: TraderMode,
  report: BotControlsClient["reportPersonaGate"],
): TraderMode {
  const readiness = assessReadiness(persona, {
    pack: hardcore ? hardcoreScenarioPacks[persona.id] : scenarioPacks[persona.id],
    safetyScenarios: genericSafetyScenarios,
  });
  const mode = wantedMode === "live" && readiness.ready ? "live" : "observe";
  if (wantedMode === "live" && !readiness.ready) {
    console.warn(`[gate] ${persona.name} is NOT ready — pinned to observe. ${readiness.reason}`);
  } else {
    console.log(`[gate] ${persona.name}: ${readiness.reason} → ${mode}`);
  }
  report({ id: persona.id, ready: readiness.ready, reason: readiness.reason });
  return mode;
}

export interface HardcoreWatchDeps {
  /** The bot accounts this process trades. */
  readonly ids: readonly string[];
  /** Who is running the hardcore build right now (the boot roster). Copied, not kept. */
  readonly initial: ReadonlySet<string>;
  /** The mode a bot wanted at boot, before any readiness gate narrowed it. */
  readonly wantedMode: (id: string) => TraderMode;
  readonly report: BotControlsClient["reportPersonaGate"];
  /** Put the new persona and tuning in force for this bot — one swap, between cycles. */
  readonly apply: (id: string, persona: Persona, tuning: TraderTuning) => void;
  readonly log?: (line: string) => void;
  readonly warn?: (line: string) => void;
}

/**
 * Call the returned function with every parsed `/controls` state. A bot whose effective hardcore
 * setting differs from the one in force is swapped to the other build; quiet while nothing differs.
 * A flip whose `apply` throws is not recorded, so the next poll tries again. A bot asked for a
 * hardcore build it does not have is refused once, loudly, and stays as it is.
 */
export function watchHardcore(deps: HardcoreWatchDeps): (state: ControlsState) => void {
  const log = deps.log ?? console.log;
  const warn = deps.warn ?? console.error;
  const inForce = new Set(deps.initial);
  const refused = new Set<string>();

  /** Swap one bot to the build it should run; false = left as it was. */
  const flip = (id: string, hardcore: boolean): boolean => {
    const persona = personaBuild(id, hardcore);
    if (!persona) {
      if (!refused.has(id)) {
        refused.add(id);
        warn(
          `[hardcore] REFUSED the owner's setting for "${id}" — no ${hardcore ? "hardcore" : "standard"} build exists for it; it keeps the build it has`,
        );
      }
      return false;
    }
    try {
      const mode = gateBuild(persona, hardcore, deps.wantedMode(id), deps.report);
      deps.apply(id, persona, buildTuning(mode, hardcore));
    } catch (error) {
      warn(`[hardcore] ${id}: build swap failed (unchanged, retried next poll): ${String(error)}`);
      return false;
    }
    log(
      hardcore
        ? `[hardcore] armed: ${id} — research mode, ${HARDCORE_COOLDOWN_MS / 1000}s cooldown (the owner's setting; applied with no restart)`
        : `[hardcore] disarmed: ${id} — standard build and the 5m cooldown (the owner's setting; applied with no restart)`,
    );
    return true;
  };

  return (state) => {
    const wanted = effectiveHardcoreIds(deps.ids, state);
    for (const id of deps.ids) {
      const hardcore = wanted.has(id);
      if (hardcore === inForce.has(id)) {
        refused.delete(id);
      } else if (flip(id, hardcore)) {
        if (hardcore) inForce.add(id);
        else inForce.delete(id);
      }
    }
  };
}
