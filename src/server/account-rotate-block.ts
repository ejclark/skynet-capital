import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type AccountFormContext, suffix } from "./account-form-context.js";
import type { Session } from "./auth/session.js";
import { railedShell } from "./page-shell.js";
import type { RotateCredentialsInput, RotateResult } from "./participant-service.js";
import { submitSelfServiceForm } from "./self-service-forms.js";

/**
 * The rotate-credentials fold-in — swapping a regenerated Alpaca key used to live only on the
 * separate `/rotate` page, reachable solely via a deep link that names one account and locks the
 * field. Eric, 2026-08-27, live: every real entry point passes that lock, so the promised picker
 * was never actually reachable; asked (repeatedly, by then) for rotate to live on `/account`
 * itself, acting on whichever account the switcher there already points to. Split out of
 * account-forms.ts to stay under its line cap, same shape as account-bot-controls.ts.
 */

/** Rendered for whichever account `/account`'s switcher currently points to — always, since
 *  rotation is available to every account the switcher can reach (self-owned, or any roster
 *  account for an owner — see `rotatableAccountOptions`). */
export function rotateBlock(ctx: AccountFormContext): string {
  if (!ctx.requesterId) return "";
  return `<div class="note" style="margin:18px 0;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:11px">
  <p style="margin:0 0 10px">Regenerated this account's Alpaca key? <b>The old key stops working the
  moment you regenerate</b> — paste the new one in below; it swaps the credential and changes
  nothing else about the account.</p>
  <form method="post" action="/account/rotate${suffix(ctx.key)}">
    <input type="hidden" name="id" value="${escapeHtml(ctx.requesterId)}">
    <label>New Alpaca paper API key<input name="apiKey" required autocomplete="off" placeholder="PK…"></label>
    <label>New Alpaca paper API secret<input name="apiSecret" required autocomplete="off" placeholder="••••••••"></label>
    <button type="submit">Rotate credentials</button>
  </form>
</div>`;
}

/** POST-only: rotate the credentials for whichever account the page's switcher currently points
 *  to. Authorization is entirely `rotateCredentials` (participant-service.ts's `refuseRotation`)
 *  — this layer only refuses a mismatched id (a stale form from a since-switched page). */
export async function handleAccountRotate(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  ctx: AccountFormContext,
  rotateCredentials: ((input: RotateCredentialsInput) => Promise<RotateResult>) | undefined,
  session: Session | undefined,
): Promise<void> {
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  await submitSelfServiceForm<RotateResult>(
    req,
    res,
    (form) => {
      const id = form.get("id") ?? "";
      if (!(rotateCredentials && ctx.requesterId) || id !== ctx.requesterId) {
        return Promise.resolve({
          ok: false,
          error: "That isn't the account this page is showing.",
        });
      }
      return rotateCredentials({
        id,
        apiKey: form.get("apiKey") ?? "",
        apiSecret: form.get("apiSecret") ?? "",
        requesterId: ctx.requesterId,
        ...(session ? { requesterEmail: session.email } : {}),
      });
    },
    (result) => accountRotateResultHtml(result, ctx.key, ctx.nav),
  );
}

function accountRotateResultHtml(result: RotateResult, key: string, nav: NavContext): string {
  const inner = result.ok
    ? `<div class="res-icon">🔄</div><h1>Credentials rotated</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is reading from the new key now.</p>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a> · <a href="/account${suffix(key)}">Manage account</a></p>`
    : `<h1>Couldn't rotate that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/account${suffix(key)}">← Try again</a> · <a href="/${suffix(key)}">Back to the board</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}
