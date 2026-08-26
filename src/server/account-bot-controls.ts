import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type AccountFormContext, suffix } from "./account-form-context.js";
import type { Session } from "./auth/session.js";
import type { ControlsDeps } from "./controls-form.js";
import { railedShell } from "./page-shell.js";
import { submitSelfServiceForm } from "./self-service-forms.js";

/**
 * The suspend/resume fold-in — Mission Control's per-bot toggle, moved onto `/account` (Eric,
 * 2026-08-25: "all the account related actions should live under one roof"; 2026-08-26: "fold
 * mission control into account"). Split out of account-forms.ts to stay under its line cap; the
 * two modules share `AccountFormContext` and `suffix` via account-form-context.ts (avoids a
 * circular import between the two feature modules).
 *
 * Authorization is the SAME ownership check `/account`'s edit/remove already use — the caller's
 * session must resolve to this exact bot — deliberately NOT `requireOwner`/env-allowlist status:
 * this is self-service for a bot you own, the same tier as renaming it, not Mission Control's
 * fleet-wide authority over every bot (which stays at `/u/:id?tab=settings`, unclaimed bots and
 * suspend-everything included).
 */

/**
 * The toggle block for `/account`'s settings page. Only for a bot the caller owns, and only when
 * bot controls are wired — an unclaimed bot, or one belonging to someone else, never shows this
 * here (Mission Control is still the tool for those).
 */
export function botControlsBlock(ctx: AccountFormContext): string {
  if (!(ctx.bot && ctx.requesterId)) return "";
  const action = ctx.bot.suspended ? "resume" : "suspend";
  const label = ctx.bot.suspended ? "Resume trading" : "Suspend trading";
  return `<div class="note" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:11px">
  <span>Autonomous trading is currently <b>${ctx.bot.suspended ? "suspended" : "active"}</b> for this bot.</span>
  <form method="post" action="/account/bot-control${suffix(ctx.key)}" style="margin:0">
    <input type="hidden" name="id" value="${escapeHtml(ctx.requesterId)}">
    <input type="hidden" name="action" value="${action}">
    <button type="submit" style="margin:0">${label}</button>
  </form>
</div>`;
}

type BotControlResult =
  | { readonly ok: true; readonly suspended: boolean; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

/** POST-only: flip the caller's OWN bot's suspend state. See module doc for the authorization rule. */
export async function handleBotControl(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  ctx: AccountFormContext,
  controls: ControlsDeps | undefined,
  session: Session | undefined,
): Promise<void> {
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  await submitSelfServiceForm<BotControlResult>(
    req,
    res,
    (form) => {
      const id = form.get("id") ?? "";
      const action = form.get("action") ?? "";
      if (!(controls && ctx.requesterId) || id !== ctx.requesterId) {
        return Promise.resolve({ ok: false, error: "You can only control your own bot." });
      }
      if (action !== "suspend" && action !== "resume") {
        return Promise.resolve({ ok: false, error: "Unknown action." });
      }
      const suspended = action === "suspend";
      controls.store.setBot(id, { suspended }, session?.email ?? "unknown");
      return Promise.resolve({ ok: true, suspended, displayName: ctx.profile?.displayName ?? id });
    },
    (result) => botControlResultHtml(result, ctx.key, ctx.nav),
  );
}

function botControlResultHtml(result: BotControlResult, key: string, nav: NavContext): string {
  const inner = result.ok
    ? `<div class="res-icon">${result.suspended ? "⏸️" : "▶️"}</div><h1>${result.suspended ? "Trading suspended" : "Trading resumed"}</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> ${result.suspended ? "stands down" : "resumes its own settings"} within ~30 seconds — no restart needed.</p>
<p class="backrow"><a href="/account${suffix(key)}">← Back to account</a></p>`
    : `<h1>Couldn't change that</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/account${suffix(key)}">← Back to account</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}
