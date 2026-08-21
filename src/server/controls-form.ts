import type { IncomingMessage, ServerResponse } from "node:http";
import type { BotControls, ControlsState } from "../autonomous/bot-controls.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { BotControlsStore } from "./bot-controls-store.js";
import { brandedShell } from "./page-shell.js";
import { handleSelfServiceForm, requireOwner } from "./self-service-forms.js";

/**
 * `/controls` — MISSION CONTROL: the owner's switchboard for the autonomous fleet (Eric,
 * 2026-08-21: settings belong behind toggles, not env pushes).
 *
 * V1 is DELIBERATELY only the suspend/resume toggles (Eric's follow-up, same day: start with the
 * easy features; mode/hardcore/persona knobs confused more than they controlled). Everything on
 * this page acts within ~30 s with no restart — the store schema and the runner already support
 * mode/hardcore overrides, but those stay env-only until they earn a self-explanatory control.
 *
 * Security model, in order of the walls:
 *  1. The whole observatory sits behind the invite-gated login.
 *  2. This page answers only to OWNERS (env-allowlisted identities) — members get the same 403 a
 *     signed-out probe gets, exactly like `/invite`, so its existence leaks nothing.
 *  3. State-changing POSTs additionally require a same-origin `Sec-Fetch-Site` when the browser
 *     sends one — a cross-site form can't flip the fleet's switches with a rider's cookie.
 */
export interface ControlsDeps {
  readonly store: BotControlsStore;
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** The bots currently on the board (id + display name), from the live hub. */
  readonly bots: () => ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
  readonly now?: () => Date;
}

export async function handleControls(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  viewerEmail: string | undefined,
  deps: ControlsDeps,
): Promise<void> {
  const owner = requireOwner(res, viewerEmail, deps.isOwner, brandedShell);
  if (!owner) return;
  if (method === "POST" && !sameOrigin(req)) {
    res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
    res.end(brandedShell("Refused", `<p class="err">Cross-site request refused.</p>`));
    return;
  }

  const render = () => brandedShell("Mission Control", panelHtml(deps));
  await handleSelfServiceForm(
    req,
    res,
    method,
    render,
    (form) => Promise.resolve(applyAction(form, owner, deps)),
    (result) => brandedShell("Mission Control", result.note + panelHtml(deps)),
  );
}

/** Browsers stamp cross-site posts; when the header exists it must be same-origin (or a direct
 *  navigation). Absent (curl, old browsers) passes — parity with every other form on the app. */
function sameOrigin(req: IncomingMessage): boolean {
  const site = req.headers["sec-fetch-site"];
  return site === undefined || site === "same-origin" || site === "none";
}

type ActionResult = { ok: boolean; note: string };

/** One POST = one switch flipped. The action surface is exactly what the page renders — a control
 *  plane accepts nothing it doesn't show. Unknown actions/bots refuse loudly, never guess. */
function applyAction(form: URLSearchParams, editor: string, deps: ControlsDeps): ActionResult {
  const action = form.get("action") ?? "";
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
      return { ok: false, note: `<p class="err">Unknown action.</p>` };
    }

    const botId = form.get("bot") ?? "";
    if (!deps.bots().some((b) => b.id === botId)) {
      return { ok: false, note: `<p class="err">Unknown bot.</p>` };
    }
    const suspended = action === "suspend";
    deps.store.setBot(botId, { suspended }, editor, at);
    return okNote(
      suspended
        ? "Trading suspended — takes effect within ~30 seconds, no restart needed."
        : "Trading resumed — takes effect within ~30 seconds.",
    );
  } catch (err) {
    return { ok: false, note: `<p class="err">Couldn't save: ${escapeHtml(String(err))}</p>` };
  }
}

function okNote(note: string): ActionResult {
  return { ok: true, note: `<p class="ok">${note}</p>` };
}

// --- rendering --------------------------------------------------------------------------------

function botRow(bot: { id: string; displayName: string }, controls: BotControls): string {
  const id = escapeHtml(bot.id);
  const suspended = controls.suspended === true;
  // Green-means-trading / red-means-suspended, the market-color rule (docs/BRAND.md).
  const stateChip = suspended
    ? `<span style="color:#F2555A;font-weight:700;letter-spacing:.08em">SUSPENDED</span>`
    : `<span style="color:#35D0BA;font-weight:700;letter-spacing:.08em">TRADING</span>`;
  return `<tr>
      <td><b>${escapeHtml(bot.displayName)}</b><br><code>${id}</code></td>
      <td>${stateChip}</td>
      <td><form method="post" action="/controls" class="inlineform">
        <input type="hidden" name="bot" value="${id}">
        <input type="hidden" name="action" value="${suspended ? "resume" : "suspend"}">
        <button type="submit">${suspended ? "Resume trading" : "Suspend trading"}</button>
      </form></td>
    </tr>`;
}

function panelHtml(deps: ControlsDeps): string {
  const state: ControlsState = deps.store.load();
  const bots = deps.bots();
  const rows = bots.length
    ? bots.map((b) => botRow(b, state.bots[b.id] ?? {})).join("")
    : `<tr><td colspan="3">No bots on the board.</td></tr>`;
  const globalBanner = state.allSuspended
    ? `<p class="err"><b>ALL AUTONOMOUS TRADING IS SUSPENDED.</b> Lift it and each bot returns to its own setting below.</p>
       <form method="post" action="/controls"><input type="hidden" name="action" value="resume-all">
       <button type="submit">Lift global suspend</button></form>`
    : `<form method="post" action="/controls"><input type="hidden" name="action" value="suspend-all">
       <button type="submit">Suspend ALL autonomous trading</button></form>
       <p><small>The everything-stops switch — every bot (and the beta scout) stands down within ~30 seconds.</small></p>`;
  const audit = state.updatedAt
    ? `<p><small>Last change ${escapeHtml(state.updatedAt.slice(0, 16).replace("T", " "))} UTC by ${escapeHtml(state.updatedBy ?? "unknown")}</small></p>`
    : "";

  return `<h1>Mission Control</h1>
<p>The autonomous fleet's switchboard. Every control here takes effect within ~30 seconds —
no restarts, no env pushes.</p>
${globalBanner}
<table><thead><tr><th>Bot</th><th>Status</th><th></th></tr></thead>
<tbody>${rows}</tbody></table>
${audit}
<p><small>Suspending stops a bot from placing new (paper) orders; existing positions are left as
they are. Safety nets are independent of this page — the readiness gate, risk guards, circuit
breakers, and the host kill switch all still apply.</small></p>`;
}
