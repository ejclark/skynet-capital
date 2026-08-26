import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { ALLOWED_TIMEZONES } from "../participants/allowed-timezones.js";
import { escapeHtml } from "../ui/escape-html.js";
import { botControlsBlock, handleBotControl } from "./account-bot-controls.js";
import { type AccountFormContext, suffix } from "./account-form-context.js";
import type {
  RemoveAccountInput,
  RemoveAccountResult,
  UpdateProfileInput,
  UpdateProfileResult,
} from "./account-service.js";
import type { Session } from "./auth/session.js";
import type { ControlsDeps } from "./controls-form.js";
import { railedShell } from "./page-shell.js";
import {
  handleSelfServiceForm,
  type OwnedAccountOption,
  submitSelfServiceForm,
} from "./self-service-forms.js";

/**
 * DAY-2 ACCOUNT FORMS — `/account` (edit your profile) and `/account/remove` (leave the board).
 * Same shape as `/add` and `/rotate` in self-service-forms.ts: GET serves a form, POST submits.
 * The authorization rules live in account-service.ts, not here — this module only renders and
 * parses, and shows back whatever the service decided.
 */

/** What the forms submit. Caller identity (requesterId, session names, auth mode) is filled in
 *  by the route wiring — the browser never supplies it. */
interface AccountRouteDeps {
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

/** The identity strings `resolveCurrentId` matches display names against — session name and
 *  email local-part, lowercased. A human rename must land on one of these (account-service.ts). */
export function sessionNameCandidates(session: Session | undefined): string[] {
  if (!session) return [];
  const name = session.name?.toLowerCase().trim();
  const local = session.email.split("@")[0]?.toLowerCase().trim();
  return [...(name ? [name] : []), ...(local ? [local] : [])];
}

/** Dispatch `/account`, `/account/remove`, and `/account/bot-control`. One call site in
 *  dashboard-server.ts. */
export async function handleAccountRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
  options: {
    readonly admin: AccountAdmin;
    readonly requesterId: string | undefined;
    readonly ownedAccounts: readonly OwnedAccountOption[];
    readonly session: Session | undefined;
    readonly authConfigured: boolean;
    readonly key: string;
    readonly nav: NavContext;
    /** Bot-controls store, when Mission Control is wired — powers the folded-in suspend toggle. */
    readonly controls?: ControlsDeps;
  },
): Promise<void> {
  const { admin, requesterId, ownedAccounts, authConfigured, key, nav, controls } = options;
  const identity = {
    ...(requesterId ? { requesterId } : {}),
    ...(options.session ? { requesterEmail: options.session.email } : {}),
    authConfigured,
  };
  const owned = ownedAccounts.find((a) => a.id === requesterId);
  const ctx: AccountFormContext = {
    ...(requesterId ? { requesterId, profile: admin.profileFor(requesterId) } : {}),
    ownedAccounts,
    ...(owned?.kind === "bot" && controls && requesterId
      ? { bot: { suspended: controls.store.load().bots[requesterId]?.suspended === true } }
      : {}),
    key,
    nav,
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
  if (path === "/account/bot-control") {
    await handleBotControl(req, res, method, ctx, controls, options.session);
    return;
  }
  if (path === "/account/remove") {
    await handleAccountRemove(req, res, method, ctx, deps);
    return;
  }
  await handleAccountSettings(req, res, method, ctx, deps);
}

/** The sentinel a "leave it as it is" timezone option submits — distinct from "" (clear). */
const KEEP = "__keep";

async function handleAccountSettings(
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
    (result) => updateResultHtml(result, ctx.key, ctx.nav),
  );
}

async function handleAccountRemove(
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
  await submitSelfServiceForm(
    req,
    res,
    (form) =>
      deps.removeAccount({
        id: form.get("id") ?? "",
        confirmName: form.get("confirmName") ?? "",
      }),
    (result) => removeResultHtml(result, ctx.key, ctx.nav),
  );
}

function timezoneOptions(current: string | undefined): string {
  const zones = ALLOWED_TIMEZONES.map(
    (t) =>
      `<option value="${escapeHtml(t.value)}"${t.value === current ? " selected" : ""}>${escapeHtml(t.label)}</option>`,
  ).join("");
  return `<option value="${KEEP}">— keep current setting —</option><option value="">No preference — show UTC-relative</option>${zones}`;
}

/**
 * The switcher between the caller's own accounts — rendered only when there's more than one to
 * pick from. A real navigation (links to `/account?id=<id>`), never an inline form field, so the
 * profile-edit form and the remove form below always agree on the same account: switching is a
 * page load, not a value the two forms could silently drift apart on.
 */
function accountSwitcher(ctx: AccountFormContext): string {
  if (ctx.ownedAccounts.length <= 1) return "";
  const pills = ctx.ownedAccounts
    .map((a) =>
      a.id === ctx.requesterId
        ? `<b>${escapeHtml(a.displayName)}</b>`
        : `<a href="/account?id=${encodeURIComponent(a.id)}${ctx.key ? `&key=${encodeURIComponent(ctx.key)}` : ""}">${escapeHtml(a.displayName)}</a>`,
    )
    .join(" · ");
  return `<p class="note" style="margin:0 0 18px">Managing: ${pills}</p>`;
}

function settingsFormHtml(ctx: AccountFormContext): string {
  const key = ctx.key;
  const id = ctx.requesterId ?? "";
  // Resolved from the session: a submitted value, never shown — an internal slug ("human-ann")
  // that means nothing to the member (Eric: "why do you even bother showing it?"). Only the
  // no-session fallback below is genuinely a field someone must type.
  const idField = ctx.requesterId
    ? `<input type="hidden" name="id" value="${escapeHtml(id)}">`
    : `<label>Account id <small>— exactly as shown on your profile URL, e.g. <code>human-uncle_joe</code></small><input name="id" required placeholder="human-uncle_joe"></label>`;
  return railedShell(
    "Manage account — Skynet Capital",
    ctx.nav,
    `<h1>Manage your account</h1>
${accountSwitcher(ctx)}
<p class="lede">Change how this account appears on the board — its display name and time zone — or
remove it from the board entirely. Your Alpaca <b>paper</b> account itself is never touched by
anything on this page; this only changes what Skynet Capital stores and shows.</p>
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
<p class="note">Regenerated your Alpaca key? <a href="${ctx.requesterId ? rotateHref(ctx.requesterId, key) : `/rotate${suffix(key)}`}">Rotate your credentials</a> — that swaps the key and changes nothing else on this page.</p>
${botControlsBlock(ctx)}
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

/** `/rotate`, locked to a specific account rather than left to guess from the session — the same
 *  id this `/account` page is already showing. */
function rotateHref(id: string, key: string): string {
  return `/rotate?id=${encodeURIComponent(id)}${key ? `&key=${encodeURIComponent(key)}` : ""}`;
}

/**
 * The one prominent next step out of a host-configured refusal — a regenerated or dead Alpaca key
 * is fixed by rotating it, never by removing and re-adding the account (Eric, 2026-08-26: "there
 * needs to be a clear path to regenerate API secrets... part of the current process for managing
 * accounts"). A real link, not just a mention in the refusal prose — whoever legitimately lands on
 * this refusal already owns or is linked to the account, so `/rotate` is always the right door.
 */
function rotateCallout(rotateId: string | undefined, key: string): string {
  if (!rotateId) return "";
  return `<p class="backrow"><a href="${rotateHref(rotateId, key)}">→ Rotate this account's Alpaca credentials</a></p>`;
}

function updateResultHtml(result: UpdateProfileResult, key: string, nav: NavContext): string {
  const inner = result.ok
    ? `<div class="res-icon">✅</div><h1>Profile updated</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is showing the new details now.</p>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a> · <a href="/account${suffix(key)}">Manage account</a></p>`
    : `<h1>Couldn't update that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
${rotateCallout(result.rotateId, key)}
<p class="backrow"><a href="/account${suffix(key)}">← Try again</a> · <a href="/${suffix(key)}">Back to the board</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}

function removeResultHtml(result: RemoveAccountResult, key: string, nav: NavContext): string {
  const inner = result.ok
    ? `<div class="res-icon">👋</div><h1>Account removed</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is off the board and the stored credentials are
deleted. The Alpaca paper account itself is untouched — <a href="/add${suffix(key)}">re-add it any time</a> and
your recorded history picks back up.</p>
<p class="backrow"><a href="/${suffix(key)}">← Back to the board</a></p>`
    : `<h1>Couldn't remove that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
${rotateCallout(result.rotateId, key)}
<p class="backrow"><a href="/account${suffix(key)}">← Try again</a> · <a href="/${suffix(key)}">Back to the board</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}
