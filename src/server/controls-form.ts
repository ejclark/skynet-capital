import type { ControlsState } from "../autonomous/bot-controls.js";
import type { FleetControls } from "../observatory/settings-view.js";
import type { BotControlsStore } from "./bot-controls-store.js";

/**
 * MISSION CONTROL's action authority: the owner's switchboard for the autonomous fleet (Eric,
 * 2026-08-21: settings belong behind toggles, not env pushes). V1 is DELIBERATELY only the
 * suspend/resume toggles (Eric's follow-up, 2026-08-21: start with the easy features;
 * mode/hardcore/persona knobs confused more than they controlled) — everything here acts within
 * ~30 s with no restart.
 *
 * `applyControlsAction`/`fleetControls` are the shared truth behind the shell's `/api/controls`
 * (#738 phase 8c, `controls-api-routes.ts`) — one action surface, one read of the same state.
 */
export interface ControlsDeps {
  readonly store: BotControlsStore;
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** The bots currently on the board (id + display name), from the live hub. */
  readonly bots: () => ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
  readonly now?: () => Date;
}

/** The result of one control-plane action, rendered above whatever surface triggered it. */
interface DeskNotice {
  readonly kind: "ok" | "error";
  readonly message: string;
}

export type ControlsActionResult = { ok: boolean; notice: DeskNotice };

/** Flatten the store's state and the live roster into what a caller renders. */
export function fleetControls(deps: ControlsDeps): FleetControls {
  const state: ControlsState = deps.store.load();
  return {
    allSuspended: state.allSuspended === true,
    bots: deps.bots().map((bot) => ({
      id: bot.id,
      displayName: bot.displayName,
      suspended: state.bots[bot.id]?.suspended === true,
    })),
    ...(state.updatedAt ? { updatedAt: state.updatedAt } : {}),
    ...(state.updatedBy ? { updatedBy: state.updatedBy } : {}),
  };
}

/** One call = one switch flipped — THE action authority. The action surface is exactly what the
 *  shell renders — a control plane accepts nothing it doesn't show. Unknown actions/bots refuse
 *  loudly, never guess. */
export function applyControlsAction(
  action: string,
  botId: string | undefined,
  editor: string,
  deps: ControlsDeps,
): ControlsActionResult {
  const at = deps.now?.() ?? new Date();
  try {
    if (action === "suspend-all" || action === "resume-all") {
      deps.store.setAllSuspended(action === "suspend-all", editor, at);
      return okNote(
        action === "suspend-all"
          ? "All autonomous trading suspended — the fleet stands down within ~30 seconds."
          : "Global suspend lifted — bots resume their own settings within ~30 seconds.",
      );
    }
    if (action !== "suspend" && action !== "resume") {
      return { ok: false, notice: { kind: "error", message: "Unknown action." } };
    }

    if (botId === undefined || !deps.bots().some((b) => b.id === botId)) {
      return { ok: false, notice: { kind: "error", message: "Unknown bot." } };
    }
    const suspended = action === "suspend";
    deps.store.setBot(botId, { suspended }, editor, at);
    return okNote(
      suspended
        ? "Trading suspended — takes effect within ~30 seconds, no restart needed."
        : "Trading resumed — takes effect within ~30 seconds.",
    );
  } catch (err) {
    return { ok: false, notice: { kind: "error", message: `Couldn't save: ${String(err)}` } };
  }
}

function okNote(message: string): ControlsActionResult {
  return { ok: true, notice: { kind: "ok", message } };
}
