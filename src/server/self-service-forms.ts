import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { ALLOWED_TIMEZONES } from "../participants/allowed-timezones.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { OwnedAccountOption } from "./account-form-context.js";
import { railedShell, readBody } from "./page-shell.js";
import type {
  AddParticipantInput,
  AddResult,
  RotateCredentialsInput,
  RotateResult,
} from "./participant-service.js";
import { personaClasses } from "./persona-classes.js";

/**
 * Self-service account forms — `/add` (join the board) and `/rotate` (swap an existing
 * account's Alpaca key after regenerating it). Split out of dashboard-server.ts as its own
 * module once /rotate pushed that file over its arch budget; these routes are a cohesive unit
 * with no dependency on the live dashboard/SSE machinery around them.
 */

/**
 * The owner gate the admin forms share: resolves the viewer to a lowercased owner email, or
 * writes the 403 and returns null. Deliberately identical for "not signed in" and "signed in but
 * not an owner" — a member probing an owner page learns nothing about whether it exists.
 */
export function requireOwner(
  res: ServerResponse,
  viewerEmail: string | undefined,
  isOwner: (email: string) => boolean,
  page: (title: string, inner: string) => string,
): string | null {
  const email = viewerEmail?.toLowerCase();
  if (email && isOwner(email)) return email;
  res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
  res.end(page("Not available", `<p class="err">This page isn't available on your account.</p>`));
  return null;
}

/** Shared by /add and /rotate: "GET serves a form, POST parses it and submits" — only the form
 *  fields and the submit/render callbacks differ. */
export async function handleSelfServiceForm<TResult extends { ok: boolean }>(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  renderForm: () => string,
  submit: (form: URLSearchParams) => Promise<TResult>,
  renderResult: (result: TResult) => string,
): Promise<void> {
  if (method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(renderForm());
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  await submitSelfServiceForm(req, res, submit, renderResult);
}

/** Just the POST half — for routes whose GET does something other than render a form. */
export async function submitSelfServiceForm<TResult extends { ok: boolean }>(
  req: IncomingMessage,
  res: ServerResponse,
  submit: (form: URLSearchParams) => Promise<TResult>,
  renderResult: (result: TResult) => string,
): Promise<void> {
  const form = new URLSearchParams(await readBody(req));
  const result = await submit(form);
  res.writeHead(result.ok ? 200 : 400, { "content-type": "text/html; charset=utf-8" });
  res.end(renderResult(result));
}

export async function handleAdd(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  key: string,
  ownerEmail: string | undefined,
  addParticipant: (input: AddParticipantInput) => Promise<AddResult>,
  nav: NavContext,
): Promise<void> {
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => addFormHtml(key, nav),
    (form) =>
      addParticipant({
        displayName: form.get("displayName") ?? "",
        apiKey: form.get("apiKey") ?? "",
        apiSecret: form.get("apiSecret") ?? "",
        kind: form.get("kind") === "bot" ? "bot" : "human",
        ...(form.get("personaId") ? { personaId: form.get("personaId") as string } : {}),
        ...(form.get("timezone") ? { timezone: form.get("timezone") as string } : {}),
        ...(ownerEmail ? { ownerEmail } : {}),
      }),
    (result) => addResultHtml(result, key, nav),
  );
}

export async function handleRotate(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  key: string,
  /** The id nobody remembers (Eric, 2026-08-25): a link that ALREADY names the account carries it
   *  here, locked — not just pre-filled — so a stray edit can't retarget it. Empty when no link
   *  named one, including when the viewer owns MORE than one account (falls to the picker below). */
  prefillId: string,
  /** `prefillId`'s board display name, shown in its place — the id itself is an internal slug
   *  nobody should have to read (Eric, 2026-08-26: "why do you even bother showing it?"). */
  prefillName: string,
  /** Every account the viewer's sign-in owns (Eric, 2026-08-25: "a dropdown of the accounts tied
   *  to the email address"). Zero, one, or many — `/claim` makes more than one a normal state. */
  ownedAccounts: readonly OwnedAccountOption[],
  requester: { readonly id?: string; readonly email?: string },
  rotateCredentials: (input: RotateCredentialsInput) => Promise<RotateResult>,
  nav: NavContext,
): Promise<void> {
  // True when the prefill came from the VIEWER'S OWN sign-in resolving to exactly one account
  // (not from a link naming some other account, e.g. an owner fixing a bot's key) — the case
  // worth telling them "this is you, no id needed" rather than leaving the fill unexplained.
  const resolvedFromEmail = prefillId !== "" && requester.id === prefillId;
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => rotateFormHtml(key, nav, prefillId, prefillName, resolvedFromEmail, ownedAccounts),
    (form) =>
      rotateCredentials({
        id: form.get("id") ?? "",
        apiKey: form.get("apiKey") ?? "",
        apiSecret: form.get("apiSecret") ?? "",
        ...(requester.id !== undefined ? { requesterId: requester.id } : {}),
        ...(requester.email !== undefined ? { requesterEmail: requester.email } : {}),
      }),
    (result) => rotateResultHtml(result, key, nav),
  );
}

const CLASSPICK_JS = `(function(){
  var kind=document.getElementById("kind"), pick=document.getElementById("classpick");
  if(!kind||!pick) return;
  var radios=pick.querySelectorAll('input[name=personaId]');
  function sync(){ var bot=kind.value==="bot"; pick.hidden=!bot;
    for(var i=0;i<radios.length;i++) radios[i].required=bot; }
  kind.addEventListener("change", sync); sync();
  // clicking anywhere on a card selects its radio (label already wraps it, but keep keyboard tidy)
  pick.addEventListener("click", function(e){ var card=e.target.closest(".cp-card"); if(!card) return;
    var r=card.querySelector('input[name=personaId]'); if(r){ r.checked=true; }
    var cards=pick.querySelectorAll(".cp-card"); for(var i=0;i<cards.length;i++) cards[i].classList.toggle("sel", cards[i]===card); });
})();`;

function addFormHtml(key: string, nav: NavContext): string {
  const action = `/add${key ? `?key=${encodeURIComponent(key)}` : ""}`;
  const classCards = personaClasses()
    .map(
      (c) =>
        `<label class="cp-card">
        <input type="radio" name="personaId" value="${escapeHtml(c.id)}">
        <span class="cp-name">${escapeHtml(c.name)}</span>
        <span class="cp-id">${escapeHtml(c.id)}</span>
        <span class="cp-thesis">${escapeHtml(c.thesis)}</span>
        ${c.legend ? `<span class="cp-legend">${escapeHtml(c.legend)}</span>` : ""}
      </label>`,
    )
    .join("\n      ");
  return railedShell(
    "Add your account — Skynet Capital",
    nav,
    `<h1>Connect your Alpaca account</h1>
<p class="lede">Your account trades on <b>Alpaca</b> paper money. Follow the steps to grab your keys,
then paste them below — we read them <b>only</b> to show your balance and trades. Nothing is ever placed on your behalf.</p>
<div class="setup">
  <details class="step-d" open>
    <summary><span class="step-n">1</span> Create a free Alpaca account <span class="chev">›</span></summary>
    <div class="sd-body">Go to <a href="https://alpaca.markets/" target="_blank" rel="noopener noreferrer">alpaca.markets</a> and sign up — it's free and needs no funding. <b>Paper trading is simulated money</b>, so there's nothing to deposit.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">2</span> Switch to Paper Trading <span class="chev">›</span></summary>
    <div class="sd-body">In the Alpaca dashboard, use the toggle near the top-left to switch from <b>Live</b> to <b>Paper</b>. This is important — we only ever use paper keys.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">3</span> Set your paper balance to $1,000,000 <span class="chev">›</span></summary>
    <div class="sd-body">Alpaca paper accounts default to $100,000. Everyone in the league starts from the same capital, so use the paper dashboard's reset/settings option to set your balance to exactly <b>$1,000,000 USD</b> before generating your keys.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">4</span> Generate your paper API keys <span class="chev">›</span></summary>
    <div class="sd-body">On the paper dashboard's right side, find <b>API Keys</b> and click <b>Generate</b>. Copy the <b>Key ID</b> and <b>Secret Key</b> — the secret shows only once, so grab it now.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">5</span> Paste them below <span class="chev">›</span></summary>
    <div class="sd-body">Drop the Key ID and Secret into the form and give yourself a display name. That's it — you'll land on the board.</div>
  </details>
</div>
<form method="post" action="${action}">
  <label>Display name<input name="displayName" required placeholder="e.g. Uncle Joe"></label>
  <label>Alpaca paper API key<input name="apiKey" required autocomplete="off" placeholder="PK…"></label>
  <label>Alpaca paper API secret<input name="apiSecret" required autocomplete="off" placeholder="••••••••"></label>
  <label>Account type
    <select name="kind" id="kind"><option value="human">Human — you trade it yourself</option><option value="bot">Bot — a persona trades it autonomously</option></select>
  </label>
  <div class="classpick" id="classpick" hidden>
    <span class="cp-label">Choose a class <small>— the persona your bot runs</small></span>
    <div class="cp-grid">
      ${classCards}
    </div>
  </div>
  <label>Time zone <small>(optional)</small>
    <select name="timezone"><option value="">No preference — show UTC-relative</option>${ALLOWED_TIMEZONES.map(
      (t) => `<option value="${escapeHtml(t.value)}">${escapeHtml(t.label)}</option>`,
    ).join("")}</select>
  </label>
  <button type="submit">Add my account</button>
</form>
<p class="note">Paper keys only · balance set to $1,000,000 USD · alpaca.markets → Paper Trading → API Keys</p>
<p class="note">Already on the board and just regenerated your key? <a href="/rotate${key ? `?key=${encodeURIComponent(key)}` : ""}">Rotate your credentials</a> instead — adding again will be refused as a duplicate.</p>
<script>${CLASSPICK_JS}</script>`,
  );
}

function addResultHtml(result: AddResult, key: string, nav: NavContext): string {
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const inner = result.ok
    ? `<div class="res-icon">🎉</div><h1>You're on the board</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is now live on the observatory.</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a></p>`
    : `<h1>Couldn't add that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a> · <a href="/add${suffix}">Try again</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}

/**
 * The credential-rotation form (self-service `/rotate`). The account field has three sources, in
 * priority order: a link that already names the account (an error card, a profile page) — LOCKED,
 * since the link is the one honest "which account" and a stray edit shouldn't silently retarget
 * it; the viewer's OWN sign-in resolving to exactly ONE account (Eric, 2026-08-25: "email is the
 * identifier, they don't know their account ID") — also locked, and said so plainly; the viewer's
 * sign-in resolving to SEVERAL accounts (`/claim` makes this a normal state, not an edge case;
 * Eric: "this should be a dropdown of the accounts tied to the email address") — a picker, by
 * name. Arrived cold (typed the URL, an old bookmark, still unlinked) falls back to free text —
 * the one case nothing can resolve, since there's genuinely nothing yet to resolve against.
 */
function rotateFormHtml(
  key: string,
  nav: NavContext,
  prefillId = "",
  prefillName = "",
  resolvedFromEmail = false,
  ownedAccounts: readonly OwnedAccountOption[] = [],
): string {
  const action = `/rotate${key ? `?key=${encodeURIComponent(key)}` : ""}`;
  // Shows the board NAME, never the internal id ("human-ann") — an id nobody reads or types here
  // anyway, since both branches lock the field (Eric, 2026-08-26: "why do you even bother showing
  // it?"). The submitted value is still the real id, via the paired hidden input.
  const idField = resolvedFromEmail
    ? `<label>Account <small>— resolved from your sign-in, no id needed</small><input value="${escapeHtml(prefillName)}" readonly><input type="hidden" name="id" value="${escapeHtml(prefillId)}"></label>`
    : prefillId
      ? `<label>Account<input value="${escapeHtml(prefillName)}" readonly><input type="hidden" name="id" value="${escapeHtml(prefillId)}"></label>`
      : ownedAccounts.length > 1
        ? `<label>Account <small>— one of yours, from your sign-in</small><select name="id" required>${ownedAccounts
            .map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.displayName)}</option>`)
            .join("")}</select></label>`
        : `<label>Account id <small>— exactly as shown on your profile URL, e.g. <code>human-uncle_joe</code></small><input name="id" required placeholder="human-uncle_joe"></label>`;
  const inner = `<h1>Rotate an account's Alpaca key</h1>
<p class="lede">Regenerated your key in Alpaca? <b>The old key stops working the moment you regenerate</b> — paste the
<b>new</b> key/secret here for any account already on the board and it updates in place, syncing again
immediately. This covers self-added accounts <i>and</i> the host-configured originals; it won't create
a new account, and it refuses anything that isn't already on the board.</p>
<form method="post" action="${action}">
  ${idField}
  <label>New Alpaca paper API key<input name="apiKey" required autocomplete="off" placeholder="PK…"></label>
  <label>New Alpaca paper API secret<input name="apiSecret" required autocomplete="off" placeholder="••••••••"></label>
  <button type="submit">Rotate credentials</button>
</form>
<p class="note">Paper keys only · this replaces the key on file, nothing else about the account changes.</p>`;
  return railedShell("Rotate credentials — Skynet Capital", nav, inner);
}

function rotateResultHtml(result: RotateResult, key: string, nav: NavContext): string {
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const inner = result.ok
    ? `<div class="res-icon">🔄</div><h1>Credentials rotated</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is reading from the new key now.</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a></p>`
    : `<h1>Couldn't rotate that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a> · <a href="/rotate${suffix}">Try again</a></p>`;
  return railedShell("Skynet Capital", nav, inner);
}
