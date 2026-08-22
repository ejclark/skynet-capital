import { COACH_SCRIPT } from "../server/feedback-coach-script.js";
import type { FeedbackResult } from "../server/feedback-service.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";

/**
 * The self-service FEEDBACK form (`/feedback`) — the in-app half of the feedback funnel
 * (feedback-service.ts files the GitHub issue; feedback-coach.ts drafts it). Rides inside the
 * same push-drawer shell as every other logged-in view (#443): losing the drawer here stranded
 * the member outside the app chrome the moment they wanted to talk to it.
 *
 * AI-first, pre-writing flow (#449): the coach is the front door, not a bolt-on beside the Send
 * button. When wired, a member meets the guided intro first — pick a kind, drop a rough note,
 * answer a couple of short questions — and only then does the real title/details form appear,
 * pre-filled for review. "Skip →" (and any coach failure) reveals the plain form immediately, so
 * writing it yourself always stays one click away and the form still works with no JS or no key.
 */

export interface FeedbackFormViewOptions {
  readonly nav?: NavContext;
  readonly enabled: boolean;
  readonly coachEnabled: boolean;
}

function formField(inner: string): string {
  return `<div class="fdbk-field">${inner}</div>`;
}

function renderCoachIntro(): string {
  return `<div class="fdbk-intro" id="coach-box">
    <h2 class="coach-h">✨ Let's shape your feedback</h2>
    <p class="coach-lede">Tell me what's on your mind — a rough note is plenty — and I'll ask a couple of quick questions before you write anything formal. You always review the draft before sending.</p>
    ${formField(`<label for="coach-kind">What kind?</label>
    <select id="coach-kind">
      <option value="bug">🐞 Bug — something's broken or wrong</option>
      <option value="feature" selected>✨ Feature — make something better</option>
      <option value="idea">🗺️ Side quest — an idea worth exploring</option>
    </select>`)}
    ${formField(`<label for="coach-note">What's on your mind?</label>
    <textarea id="coach-note" rows="4" placeholder="A messy sentence is fine…"></textarea>`)}
    <button type="button" id="coach-start">Let's shape it</button>
    <div id="coach-thread" class="coach-thread"></div>
    <p class="fdbk-skip"><a href="#" id="coach-skip">Prefer to just write it yourself? Skip →</a></p>
  </div>`;
}

export function renderFeedbackFormBody(options: FeedbackFormViewOptions): string {
  const banner = options.enabled
    ? ""
    : `<p class="fdbk-banner">Heads up — feedback isn't switched on yet, so this won't send until it's configured.</p>`;
  const content = `${FDBK_STYLE}
  <section class="fdbk">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Share feedback</h1>
        <p class="view-sub">Found a bug, want an improvement, or spotted a side quest? Tell us here — it goes straight to the team. <b>No GitHub account needed.</b></p>
      </div>
    </div>
    ${banner}
    <div class="fdbk-flow">
      ${options.coachEnabled ? renderCoachIntro() : ""}
      <form class="fdbk-form" id="fdbk-form" method="post" action="/feedback"${options.coachEnabled ? ' style="display:none"' : ""}>
        ${formField(`<label for="fdbk-kind">What kind?</label>
        <select name="kind" id="fdbk-kind">
          <option value="bug">🐞 Bug — something's broken or wrong</option>
          <option value="feature" selected>✨ Feature — make something better</option>
          <option value="idea">🗺️ Side quest — an idea worth exploring</option>
        </select>`)}
        ${formField(`<label for="fdbk-title">Title</label>
        <input name="title" id="fdbk-title" required maxlength="120" placeholder="Short summary">`)}
        ${formField(`<label for="fdbk-details">Details</label>
        <textarea name="details" id="fdbk-details" rows="8" placeholder="What happened · what you'd like · the idea…"></textarea>`)}
        ${formField(`<label for="fdbk-area">Where in the app? <small>(optional)</small></label>
        <select name="area" id="fdbk-area">
          <option value="" selected>— pick a spot —</option>
          <option>The board (home)</option>
          <option>The login</option>
          <option>A player page</option>
          <option>The trading desk</option>
          <option>The calendar</option>
          <option>Research</option>
          <option>Somewhere else</option>
        </select>`)}
        <input type="hidden" name="capsule" id="fdbk-capsule">
        <button type="submit" class="fdbk-submit">Send it</button>
      </form>
    </div>
    ${options.coachEnabled ? `<script>${COACH_SCRIPT}</script>` : ""}
    ${options.coachEnabled ? `<noscript><style>#fdbk-form{display:flex !important}#coach-box{display:none !important}</style></noscript>` : ""}
  </section>`;
  return renderShell(options.nav, content, new Date().toISOString());
}

export interface FeedbackResultViewOptions {
  readonly nav?: NavContext;
  readonly result: FeedbackResult;
}

export function renderFeedbackResultBody(options: FeedbackResultViewOptions): string {
  const { result } = options;
  const inner = result.ok
    ? `<div class="res-icon">🎉</div><h1>Thanks — got it!</h1>
<p class="view-sub">Filed as <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener"><b>#${result.number}</b></a> — follow its progress there. Really appreciate you.</p>
<p class="fdbk-backrow"><a href="/feedback">Send another</a> · <a href="/">← Back to the board</a></p>`
    : `<h1>Hmm, that didn't send</h1>
<p class="view-sub">${escapeHtml(result.error)}</p>
<p class="fdbk-backrow"><a href="/feedback">Try again</a> · <a href="/">← Back to the board</a></p>`;
  const content = `${FDBK_STYLE}
  <section class="fdbk fdbk-res">${inner}</section>`;
  return renderShell(options.nav, content, new Date().toISOString());
}

/**
 * Feedback-only styles, kept out of dashboard-shell.ts (same doctrine as calendar-widget.ts /
 * desk-style.ts). The coach intro and the form now run sequentially, not side by side (#449) —
 * the guided step is the front door, and the form only appears once it's earned its keep (a
 * draft to review, or the member skipping ahead).
 */
const FDBK_STYLE = `<style>
  .fdbk-flow{ display:flex; flex-direction:column; gap:22px; max-width:900px; margin-top:6px; }
  .fdbk-form, .fdbk-intro{ display:flex; flex-direction:column; gap:20px; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:26px 28px; }
  .fdbk-field{ display:flex; flex-direction:column; gap:8px; }
  .fdbk-field label{ font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  .fdbk-field label small{ text-transform:none; letter-spacing:0; font-weight:400; opacity:.8; }
  .fdbk-field input, .fdbk-field select, .fdbk-field textarea{ width:100%; padding:12px 13px; font-size:15px; font-family:var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; transition:border-color .15s, box-shadow .15s; }
  .fdbk-field textarea{ font:15px/1.6 var(--sans); resize:vertical; }
  .fdbk-field input:focus, .fdbk-field select:focus, .fdbk-field textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent); }
  .fdbk-submit{ margin-top:2px; padding:13px 20px; font-size:15px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; align-self:flex-start; min-width:160px; transition:filter .15s; }
  .fdbk-submit:hover{ filter:brightness(1.08); }
  .fdbk-submit:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .coach-h{ font-size:16px; font-weight:700; margin:0; }
  .coach-lede{ font-size:13px; color:var(--muted); line-height:1.55; margin:-8px 0 0; }
  .fdbk-skip{ margin:-6px 0 0; font-size:12.5px; color:var(--muted); }
  .fdbk-skip a{ color:var(--muted); }
  #coach-start{ width:100%; padding:11px 16px; font-size:14px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; transition:filter .15s; }
  #coach-start:hover{ filter:brightness(1.08); }
  #coach-start:disabled{ opacity:.6; cursor:default; }
  .coach-thread{ display:flex; flex-direction:column; gap:12px; margin-top:16px; }
  .coach-thread p{ margin:0; padding:10px 14px; border-radius:12px; font-size:13.5px; line-height:1.55; max-width:92%; }
  .coach-ai{ align-self:flex-start; background:var(--surface-2); border:1px solid var(--border); color:var(--text); }
  .coach-you{ align-self:flex-end; background:color-mix(in srgb,var(--accent) 16%,var(--surface-2)); border:1px solid color-mix(in srgb,var(--accent) 32%,var(--border)); color:var(--text); }
  .coach-thread > div{ display:flex; gap:8px; }
  .coach-thread > div input{ flex:1; padding:10px 12px; font-size:13.5px; font-family:var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; }
  .coach-thread > div input:focus{ outline:none; border-color:var(--accent); }
  .coach-thread > div button{ padding:10px 14px; font-size:13px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; }
  .fdbk-banner{ margin:-6px 0 4px; font-size:13px; color:var(--neg); }
  .fdbk-res{ max-width:520px; }
  .fdbk-res .res-icon{ font-size:34px; margin-bottom:6px; }
  .fdbk-res h1{ margin:0 0 10px; font-size:24px; font-weight:700; }
  .fdbk-backrow{ margin-top:22px; font-size:14px; color:var(--muted); }
</style>`;
