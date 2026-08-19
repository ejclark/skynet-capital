import type { IncomingMessage, ServerResponse } from "node:http";
import { ALLOWED_TIMEZONES } from "../participants/allowed-timezones.js";
import { escapeHtml } from "../ui/escape-html.js";
import type {
  RemoveAccountInput,
  RemoveAccountResult,
  UpdateProfileInput,
  UpdateProfileResult,
} from "./account-service.js";
import type { Session } from "./auth/session.js";
import { addShell, readBody } from "./page-shell.js";
import { handleSelfServiceForm } from "./self-service-forms.js";

/**
 * DAY-2 ACCOUNT FORMS — `/account` (edit your profile) and `/account/remove` (leave the board).
 * Same shape as `/add` and `/rotate` in self-service-forms.ts: GET serves a form, POST submits.
 * The authorization rules live in account-service.ts, not here — this module only renders and
 * parses, and shows back whatever the service decided.
 */

/** What the route layer knows about the caller and the account being edited. */
export interface AccountFormContext {
  /** Who the caller's session resolves to (prefills the forms). */
  readonly requesterId?: string;
  /** Current profile of the resolved account, for prefill. */
  readonly profile?: { readonly displayName: string; readonly timezone?: string };
  /** Legacy `?key=` password, propagated into form actions and links. */
  readonly key: string;
}

/**
 * What the forms submit. The caller's identity (requesterId, session names, auth mode) is
 * filled in by the route wiring — the browser never supplies it.
 */
export interface AccountRouteDeps {
  readonly updateProfile: (input: {
    id: string;
    displayName?: string;
    timezone?: string;
  }) => Promise<UpdateProfileResult>;
  readonly removeAccount: (input: {
    id: string;
    confirmName: string;
  }) => Promise<RemoveAccountResult>;
}

/** The service surface dashboard-server wires in (see account-service.ts + serve-dashboard.ts). */
export interface AccountAdmin {
  readonly updateProfile: (input: UpdateProfileInput) => Promise<UpdateProfileResult>;
  readonly removeAccount: (input: RemoveAccountInput) => Promise<RemoveAccountResult>;
  /** Current stored profile for prefill — undefined for env-configured or unknown ids. */
  readonly profileFor: (
    id: string,
  ) => { readonly displayName: string; readonly timezone?: string } | undefined;
}

/**
 * The identity strings `resolveCurrentId` matches display names against — the session's name
 * and email local-part, lowercased. A human rename must land on one of these (see
 * account-service.ts for why).
 */
export function sessionNameCandidates(session: Session | undefined): string[] {
  if (!session) return [];
  const name = session.name?.toLowerCase().trim();
  const local = session.email.split("@")[0]?.toLowerCase().trim();
  return [...(name ? [name] : []), ...(local ? [local] : [])];
}

/** Dispatch `/account` and `/account/remove`. One call site in dashboard-server.ts. */
export async function handleAccountRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
  options: {
    readonly admin: AccountAdmin;
    readonly requesterId: string | undefined;
    readonly session: Session | undefined;
    readonly authConfigured: boolean;
    readonly key: string;
  },
): Promise<void> {
  const { admin, requesterId, authConfigured, key } = options;
  const identity = {
    ...(requesterId ? { requesterId } : {}),
    authConfigured,
  };
  const ctx: AccountFormContext = {
    ...(requesterId ? { requesterId, profile: admin.profileFor(requesterId) } : {}),
    key,
  };
  const deps: AccountRouteDeps = {
    updateProfile: (input) =>
      admin.updateProfile({
        ...input,
        ...identity,
        sessionNames: sessionNameCandidates(options.session),
      }),
    removeAccount: (input) => admin.removeAccount({ ...input, ...identity }),
  };
  if (path === "/account/remove") {
    await handleAccountRemove(req, res, method, ctx, deps);
    return;
  }
  await handleAccountSettings(req, res, method, ctx, deps);
}

/** The sentinel a "leave it as it is" timezone option submits — distinct from "" (clear). */
const KEEP = "__keep";

export async function handleAccountSettings(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  ctx: AccountFormContext,
  deps: AccountRouteDeps,
): Promise<void> {
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => settingsFormHtml(ctx),
    (form) => {
      const displayName = form.get("displayName")?.trim();
      const timezone = form.get("timezone");
      return deps.updateProfile({
        id: form.get("id") ?? "",
        ...(displayName ? { displayName } : {}),
        ...(timezone === null || timezone === KEEP ? {} : { timezone }),
      });
    },
    (result) => updateResultHtml(result, ctx.key),
  );
}

export async function handleAccountRemove(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  ctx: AccountFormContext,
  deps: AccountRouteDeps,
): Promise<void> {
  if (method === "GET") {
    // The remove form lives on /account — a bare GET here just goes back to it.
    res.writeHead(302, { location: `/account${suffix(ctx.key)}` });
    res.end();
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  const form = new URLSearchParams(await readBody(req));
  const result = await deps.removeAccount({
    id: form.get("id") ?? "",
    confirmName: form.get("confirmName") ?? "",
  });
  res.writeHead(result.ok ? 200 : 400, { "content-type": "text/html; charset=utf-8" });
  res.end(removeResultHtml(result, ctx.key));
}

function suffix(key: string): string {
  return key ? `?key=${encodeURIComponent(key)}` : "";
}

function timezoneOptions(current: string | undefined): string {
  const zones = ALLOWED_TIMEZONES.map(
    (t) =>
      `<option value="${escapeHtml(t.value)}"${t.value === current ? " selected" : ""}>${escapeHtml(t.label)}</option>`,
  ).join("");
  return `<option value="${KEEP}">— keep current setting —</option><option value="">No preference — show UTC-relative</option>${zones}`;
}

function settingsFormHtml(ctx: AccountFormContext): string {
  const key = ctx.key;
  const id = ctx.requesterId ?? "";
  const idField = ctx.requesterId
    ? `<label>Account id <small>— your account, from your session</small><input name="id" required readonly value="${escapeHtml(id)}"></label>`
    : `<label>Account id <small>— exactly as shown on your profile URL, e.g. <code>human-uncle_joe</code></small><input name="id" required placeholder="human-uncle_joe"></label>`;
  return addShell(
    "Manage account — Skynet Capital",
    `<h1>Manage your account</h1>
<p class="lede">Change how your account appears on the board, rotate a regenerated Alpaca key, or
remove the account entirely. Your Alpaca <b>paper</b> account itself is never touched — this only
changes what Skynet Capital stores and shows.</p>
<form method="post" action="/account${suffix(key)}">
  ${idField}
  <label>Display name <small>— leave blank to keep the current one</small><input name="displayName" placeholder="${escapeHtml(ctx.profile?.displayName ?? "e.g. Uncle Joe")}"></label>
  <label>Time zone
    <select name="timezone">${timezoneOptions(ctx.profile?.timezone)}</select>
  </label>
  <button type="submit">Save changes</button>
</form>
<p class="note">Renames stay linked to your sign-in: the name must match your sign-in name or your
email's local part, so the board keeps recognizing you. Bots can't be renamed — remove and re-add.</p>
<p class="note">Regenerated your Alpaca key? <a href="/rotate${suffix(key)}">Rotate your credentials</a> — that swaps the key and changes nothing else.</p>
<div style="margin-top:34px;padding:18px;border:1px solid color-mix(in srgb,var(--neg) 55%,var(--border));border-radius:11px">
  <h1 style="font-size:16px;color:var(--neg)">Remove this account</h1>
  <p class="lede" style="margin-bottom:8px;font-size:13px">Takes the account off the board and deletes its stored
  credentials here. Your Alpaca paper account is untouched, and your recorded history is kept —
  re-adding the same account later picks the story back up.</p>
  <form method="post" action="/account/remove${suffix(key)}">
    ${
      ctx.requesterId
        ? `<input type="hidden" name="id" value="${escapeHtml(id)}">`
        : `<label>Account id<input name="id" required placeholder="human-uncle_joe"></label>`
    }
    <label>Type the display name to confirm<input name="confirmName" required autocomplete="off" placeholder="${escapeHtml(ctx.profile?.displayName ?? "Display name")}"></label>
    <button type="submit" style="background:var(--neg);color:#fff">Remove account</button>
  </form>
</div>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a></p>`,
  );
}

function updateResultHtml(result: UpdateProfileResult, key: string): string {
  const inner = result.ok
    ? `<div class="res-icon">✅</div><h1>Profile updated</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is showing the new details now.</p>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a> · <a href="/account${suffix(key)}">Manage account</a></p>`
    : `<h1>Couldn't update that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/account${suffix(key)}">← Try again</a> · <a href="/${suffix(key)}">Back to the board</a></p>`;
  return addShell("Skynet Capital", inner);
}

function removeResultHtml(result: RemoveAccountResult, key: string): string {
  const inner = result.ok
    ? `<div class="res-icon">👋</div><h1>Account removed</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is off the board and the stored credentials are
deleted. The Alpaca paper account itself is untouched — <a href="/add${suffix(key)}">re-add it any time</a> and
your recorded history picks back up.</p>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a></p>`
    : `<h1>Couldn't remove that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/account${suffix(key)}">← Try again</a> · <a href="/${suffix(key)}">Back to the board</a></p>`;
  return addShell("Skynet Capital", inner);
}
