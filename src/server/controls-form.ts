import type { IncomingMessage, ServerResponse } from "node:http";
import type { ControlsState } from "../autonomous/bot-controls.js";
import type { DeskNotice } from "../observatory/desk-tabs.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type FleetControls,
  renderSettingsBody,
  type SettingsViewOptions,
} from "../observatory/settings-view.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { BotControlsStore } from "./bot-controls-store.js";
import { brandedShell, railedShell, shellDocument } from "./page-shell.js";
import { handleSelfServiceForm, requireOwner } from "./self-service-forms.js";

/**
 * MISSION CONTROL: the owner's switchboard for the autonomous fleet (Eric, 2026-08-21: settings
 * belong behind toggles, not env pushes).
 *
 * It is served as the `settings` tab of an account's desk — `GET/POST /u/:id?tab=settings` — not
 * as the standalone `/controls` page it started as (#475). The move is not cosmetic: a standalone
 * page rendered through the bare form shell has no left rail, and "stop creating views that ignore
 * the application-wide template" was the member's actual ask. As a desk tab it inherits the drawer,
 * the tokens and the tab strip for free, and can't drift out of the template again.
 *
 * V1 is DELIBERATELY only the suspend/resume toggles (Eric's follow-up, 2026-08-21: start with the
 * easy features; mode/hardcore/persona knobs confused more than they controlled). Everything on
 * this page acts within ~30 s with no restart — the store schema and the runner already support
 * mode/hardcore overrides, but those stay env-only until they earn a self-explanatory control.
 *
 * Security model, in order of the walls — unchanged by the relocation:
 *  1. The whole observatory sits behind the invite-gated login.
 *  2. This tab answers only to OWNERS (env-allowlisted identities). A member who asks for it by URL
 *     gets the desk's overview, exactly as a typo'd `?tab=` does, so its existence leaks nothing.
 *  3. State-changing POSTs additionally require a same-origin `Sec-Fetch-Site` when the browser
 *     sends one — a cross-site form can't flip the fleet's switches with a rider's cookie.
 *  4. The owner check is re-run HERE on every request, never inherited from the call site.
 */
export interface ControlsDeps {
  readonly store: BotControlsStore;
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** The bots currently on the board (id + display name), from the live hub. */
  readonly bots: () => ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
  readonly now?: () => Date;
}

/** The desk this tab is being rendered on, plus the shell context every desk view receives. */
export interface DeskSettingsView {
  readonly snapshot: ParticipantSnapshot;
  readonly options: Omit<SettingsViewOptions, "controls" | "notice">;
}

export async function handleDeskSettings(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  viewerEmail: string | undefined,
  deps: ControlsDeps,
  view: DeskSettingsView,
): Promise<void> {
  // This tab is always reached through the desk route, which always populates nav (dashboard-
  // server.ts) — the fallback to the bare shell is defensive, not an expected path.
  const nav = view.options.nav;
  const shell = nav
    ? (title: string, inner: string) => railedShell(title, nav, inner)
    : brandedShell;
  const owner = requireOwner(res, viewerEmail, deps.isOwner, shell);
  if (!owner) return;
  if (method === "POST" && !sameOrigin(req)) {
    res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
    res.end(shell("Refused", `<p class="err">Cross-site request refused.</p>`));
    return;
  }

  // Read the store INSIDE the renderer, never before: on a POST this runs after the switch has
  // been flipped, so the page an owner reads back is the state they just created.
  const render = (notice?: DeskNotice) =>
    shellDocument(
      `Settings · ${escapeHtml(view.snapshot.displayName)} — Skynet Capital`,
      renderSettingsBody(view.snapshot, {
        ...view.options,
        controls: fleetControls(deps),
        ...(notice ? { notice } : {}),
      }),
    );
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => render(),
    (form) => Promise.resolve(applyAction(form, owner, deps)),
    (result) => render(result.notice),
  );
}

/** Browsers stamp cross-site posts; when the header exists it must be same-origin (or a direct
 *  navigation). Absent (curl, old browsers) passes — parity with every other form on the app. */
function sameOrigin(req: IncomingMessage): boolean {
  const site = req.headers["sec-fetch-site"];
  return site === undefined || site === "same-origin" || site === "none";
}

/** Flatten the store's state and the live roster into what the view renders. Shared with the
 *  shell's `/api/controls` (#738 phase 8c) so both surfaces read the same truth. */
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

export type ControlsActionResult = { ok: boolean; notice: DeskNotice };

/** The HTML form's adapter over the shared action authority below. */
function applyAction(
  form: URLSearchParams,
  editor: string,
  deps: ControlsDeps,
): ControlsActionResult {
  return applyControlsAction(form.get("action") ?? "", form.get("bot") ?? undefined, editor, deps);
}

/** One call = one switch flipped — THE action authority, shared by this form and the shell's
 *  `/api/controls` (#738 phase 8c). The action surface is exactly what the page renders — a
 *  control plane accepts nothing it doesn't show. Unknown actions/bots refuse loudly, never
 *  guess. */
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
