/**
 * EVERY OPENING ORDER CARRIES ITS EXIT PLAN (#6954 slice 4; Eric, 2026-11-01: "a strategy carries
 * its exit plan before execution"). A play's exit plan is a stop (`exitSafety`, enforced by
 * `exitSafetyIntents`), a profit target, or a time exit (`exits`, in its own words). The guards
 * refuse an opening order `no-exit-plan` from a play that declares none of the three
 * (`RiskConfig.exitPlanned`), so a play can no longer reach a live bot with no way out.
 *
 * WHY THE OPTION PLAYS CARRY NO STOP. `exitSafetyIntents` measures a held SHARE position against
 * its cost; it never reads a contract. A dial on an option play would print "armed" on the ladder
 * (`safeguard-ladder-view.ts`) and fire on nothing — or, on the wheel, sell the assigned shares
 * its owner chose to hold until the next upswing (Eric, 2026-10-16). So they carry their target and
 * time rules, and a stop priced on a contract's own premium waits for its own mechanism
 * (docs/IDEAS.md, 2026-11-07).
 */
import type { PlaybookMode } from "../domain/types.js";
import type { ExitSafetyDial, Playbook } from "./playbook.js";

/**
 * The house stop on a share play, by mode: the whole position is sold at market once the bid is
 * this far below what the play paid. Looser as the mode grows, the way `size` grows (`playbook.ts`
 * on `exitSafety`: aggressive lets a winner run, conservative preserves capital).
 *
 * UNMEASURED. No study in the repo records how far these plays move against an entry before they
 * pay, so these are a stated default, set once here: the standard stop sits under the 15% fall
 * the long-LEAP play reads as a real pullback (`LEAP_DIP`), the conservative one at the risk
 * ladder's own flatten rung (8%). Falsifier (#6954 call 4): wrong if by 2026-12-15 more than half of stop-triggered paper
 * exits recover past their entry within 5 sessions — then widen them, here.
 */
export const HOUSE_STOP_LOSS: Readonly<Record<PlaybookMode, ExitSafetyDial>> = {
  conservative: { drawdownTripPct: 0.08, enforcement: "enforce" },
  standard: { drawdownTripPct: 0.12, enforcement: "enforce" },
  aggressive: { drawdownTripPct: 0.16, enforcement: "enforce" },
};

/** What a play does to get out of a position it opens in one mode. Every field is optional; an
 *  exit plan with none of them is no plan, so `exitPlanOf` answers `undefined` for it. */
export interface ExitPlan {
  /** Present only when ENFORCED: an alert-only dial sells nothing, so it is no way out. */
  readonly stop?: ExitSafetyDial;
  readonly target?: string;
  readonly time?: string;
}

/**
 * The play's exit plan in `mode`, or `undefined` when it has none. `mode` absent (an order that
 * carries no mode) counts only the target and time exits: a stop is set per mode.
 */
export function exitPlanOf(playbook: Playbook, mode?: PlaybookMode): ExitPlan | undefined {
  const dial = mode ? playbook.exitSafety?.[mode] : undefined;
  const stop = dial?.enforcement === "enforce" ? dial : undefined;
  const { target, time } = playbook.exits ?? {};
  if (!(stop || target || time)) return undefined;
  return {
    ...(stop ? { stop } : {}),
    ...(target ? { target } : {}),
    ...(time ? { time } : {}),
  };
}

/**
 * The guards' question — does this playbook, in this mode, carry an exit plan? — answered over a
 * list of playbooks, the first match by id winning. A live roster passes its own entries first
 * (narrowed or steered, as the bot runs them), then the house roster. An id found nowhere has no
 * plan: an opening order from a playbook nobody can read is refused, never waved through.
 */
export function exitPlannedFor(
  playbooks: readonly Playbook[],
): (playbookId: string, mode?: PlaybookMode) => boolean {
  return (playbookId, mode) => {
    const playbook = playbooks.find((p) => p.id === playbookId);
    return playbook !== undefined && exitPlanOf(playbook, mode) !== undefined;
  };
}
