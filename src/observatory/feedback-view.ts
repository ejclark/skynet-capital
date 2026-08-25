import { FEEDBACK_AREAS } from "../server/feedback-areas.js";
import { COACH_SCRIPT } from "../server/feedback-coach-script.js";
import type { FollowupResult } from "../server/feedback-followup.js";
import type { FeedbackLogEntry } from "../server/feedback-log.js";
import { PREVIEW_SCRIPT } from "../server/feedback-preview-script.js";
import type { FeedbackResult } from "../server/feedback-service.js";
import { FEEDBACK_STATUS_LABEL, type FeedbackStatus } from "../server/feedback-status.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";
import { IMAGE_SCRIPT } from "./feedback-image-script.js";

// Mirrors feedback-issue.ts's private FEEDBACK_KIND_LABEL — kept separate rather than exported
// across the module boundary, since feedback-issue.ts sits right at its architecture budget
// (127/130) and any addition there needs its own decompose-first PR first (#429, #502).
const FEEDBACK_KIND_ICON: Record<FeedbackLogEntry["kind"], string> = {
  bug: "🐞",
  feature: "✨",
  idea: "🗺️",
};

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
 *
 * The details field carries a Write | Preview tab pair (2026-08-22): the body becomes a GitHub
 * issue, so a member should see their markdown rendered before they send it — bullets, a table and
 * a `<details>` fold are exactly what the house issue shape asks for (docs/ISSUES.md). The tabs
 * render `hidden` and are unhidden by script, so a no-JS member gets a plain textarea, never dead
 * tabs.
 */

export interface FeedbackFormViewOptions {
  readonly nav?: NavContext;
  readonly enabled: boolean;
  readonly coachEnabled: boolean;
  /** The signed-in member's own past filings (#429 slice), newest first. Omit/empty renders nothing
   *  — a member who hasn't filed anything yet sees just the form, not an empty list. */
  readonly recent?: readonly FeedbackLogEntry[];
  /** Live status per filed issue number, when the status fetch is wired. A row with no entry here
   *  (unwired, or GitHub unreachable) renders with no badge — never a stale or guessed one. */
  readonly statuses?: ReadonlyMap<number, FeedbackStatus>;
  /** Whether `/feedback/followup` is wired — gates the per-row "Follow up" disclosure. A member
   *  can only ever follow up on an issue this same list already shows is theirs. */
  readonly followupEnabled?: boolean;
}

function formField(inner: string): string {
  return `<div class="fdbk-field">${inner}</div>`;
}

function statusBadge(status: FeedbackStatus | undefined): string {
  if (!status) return "";
  return `<span class="fdbk-recent-status fdbk-status-${status}">${escapeHtml(FEEDBACK_STATUS_LABEL[status])}</span>`;
}

/** A zero-JS disclosure: `<details>` needs no script to open, and the form inside posts for real
 *  — this works identically with or without the page's other scripts loaded. */
function followupDisclosure(e: FeedbackLogEntry): string {
  return `<details class="fdbk-followup">
      <summary>💬 Follow up</summary>
      <form method="post" action="/feedback/followup">
        <input type="hidden" name="issueNumber" value="${e.issueNumber}">
        <textarea name="details" rows="3" placeholder="Add more detail, a correction, or say it's still happening…" required></textarea>
        <button type="submit">Post &amp; re-open the build</button>
      </form>
    </details>`;
}

function recentRow(
  e: FeedbackLogEntry,
  statuses: ReadonlyMap<number, FeedbackStatus> | undefined,
  followupEnabled: boolean,
): string {
  return `<li class="fdbk-recent-row">
      <span class="fdbk-recent-kind" title="${escapeHtml(e.kind)}">${FEEDBACK_KIND_ICON[e.kind]}</span>
      <a href="${escapeHtml(e.url)}" target="_blank" rel="noopener">${escapeHtml(e.title)}</a>
      ${statusBadge(statuses?.get(e.issueNumber))}
      <span class="fdbk-recent-meta">#${e.issueNumber} · ${escapeHtml(new Date(e.filedAt).toLocaleDateString())}</span>
      ${followupEnabled ? followupDisclosure(e) : ""}
    </li>`;
}

/** Closed reads as `shipped` — the lane never closes a filed issue any other way
 *  (docs/FEEDBACK.md, "the four ways a build session ends"). No status known (unwired, or GitHub
 *  unreachable) defaults an entry to open — never hide a filing the app can't confirm is done. */
function isClosed(
  e: FeedbackLogEntry,
  statuses: ReadonlyMap<number, FeedbackStatus> | undefined,
): boolean {
  return statuses?.get(e.issueNumber) === "shipped";
}

function renderRecentFeedback(
  recent: readonly FeedbackLogEntry[],
  statuses: ReadonlyMap<number, FeedbackStatus> | undefined,
  followupEnabled: boolean,
): string {
  if (recent.length === 0) return "";
  const sorted = [...recent].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
  const open = sorted.filter((e) => !isClosed(e, statuses));
  const closed = sorted.filter((e) => isClosed(e, statuses));
  const list = (rows: readonly FeedbackLogEntry[]) =>
    `<ul class="fdbk-recent-list">${rows.map((e) => recentRow(e, statuses, followupEnabled)).join("\n")}</ul>`;
  return `<div class="fdbk-recent">
    <h2 class="fdbk-recent-h">Your recent feedback</h2>
    ${list(open)}
    ${closed.length ? `<h3 class="fdbk-recent-h fdbk-recent-h-closed">Closed</h3>${list(closed)}` : ""}
  </div>`;
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
        <div class="fdbk-tabs" id="fdbk-tabs" role="tablist" hidden>
          <button type="button" id="fdbk-tab-write" class="on" role="tab" aria-selected="true">Write</button>
          <button type="button" id="fdbk-tab-preview" role="tab" aria-selected="false">Preview</button>
          <span class="fdbk-tabs-hint">Markdown — bullets, tables and a <code>&lt;details&gt;</code> fold all render on GitHub.</span>
        </div>
        <textarea name="details" id="fdbk-details" rows="8" placeholder="What happened · what you'd like · the idea…"></textarea>
        <div class="fdbk-preview" id="fdbk-preview" role="tabpanel" hidden></div>`)}
        ${formField(`<label for="fdbk-image-input">Attach a screenshot <small>(optional, up to 3 — helps us see what you saw)</small></label>
        <input type="file" id="fdbk-image-input" accept="image/*" multiple>
        <div class="fdbk-images" id="fdbk-image-list"></div>
        <input type="hidden" id="fdbk-images-field" name="images">`)}
        ${formField(`<label for="fdbk-area">Where in the app? <small>(optional)</small></label>
        <select name="area" id="fdbk-area">
          <option value="" selected>— pick a spot —</option>
          ${FEEDBACK_AREAS.map((area) => `<option>${escapeHtml(area)}</option>`).join("\n          ")}
        </select>`)}
        <input type="hidden" name="spec" id="fdbk-spec">
        <button type="submit" class="fdbk-submit">Send it</button>
      </form>
      ${renderRecentFeedback(options.recent ?? [], options.statuses, Boolean(options.followupEnabled))}
    </div>
    ${options.coachEnabled ? `<script>${COACH_SCRIPT}</script>` : ""}
    <script>${PREVIEW_SCRIPT}</script>
    <script>${IMAGE_SCRIPT}</script>
    ${options.coachEnabled ? `<noscript><style>#fdbk-form{display:flex !important}#coach-box{display:none !important}</style></noscript>` : ""}
  </section>`;
  return renderShell(options.nav, content, new Date().toISOString());
}

export interface FeedbackFollowupResultViewOptions {
  readonly nav?: NavContext;
  readonly result: FollowupResult;
}

/** The result page after posting a follow-up comment — a smaller cousin of
 *  renderFeedbackResultBody's success/failure split, without the "Send another" framing (a
 *  follow-up isn't a new filing) and pointing back at the issue it was added to. */
export function renderFeedbackFollowupResultBody(
  options: FeedbackFollowupResultViewOptions,
): string {
  const { result } = options;
  const inner = result.ok
    ? `<div class="res-icon">💬</div><h1>Added to the thread</h1>
<p class="view-sub">Your note is on <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">the issue</a> now, and the build lane picked it back up.</p>
<p class="fdbk-backrow"><a href="/feedback">← Back to your feedback</a></p>`
    : `<h1>Hmm, that didn't send</h1>
<p class="view-sub">${escapeHtml(result.error)}</p>
<p class="fdbk-backrow"><a href="/feedback">← Back to your feedback</a></p>`;
  const content = `${FDBK_STYLE}
  <section class="fdbk fdbk-res">${inner}</section>`;
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
  .fdbk-flow{ display:flex; flex-direction:column; gap:22px; max-width:var(--col-form); margin-top:6px; }
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
  .fdbk-tabs{ display:flex; align-items:center; gap:6px; margin-bottom:-2px; }
  .fdbk-tabs button{ padding:6px 13px; font-size:12.5px; font-weight:600; font-family:var(--sans); color:var(--muted); background:transparent; border:1px solid transparent; border-radius:8px 8px 0 0; cursor:pointer; }
  .fdbk-tabs button.on{ color:var(--text); background:var(--surface-2); border-color:var(--border); border-bottom-color:var(--surface-2); }
  .fdbk-tabs button:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
  .fdbk-tabs-hint{ margin-left:auto; font-size:11.5px; color:var(--muted); opacity:.85; }
  .fdbk-tabs-hint code{ font-size:11px; }
  .fdbk-preview{ min-height:210px; padding:14px 16px; font-size:14.5px; line-height:1.6; color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; overflow-x:auto; }
  .fdbk-preview > :first-child{ margin-top:0; }
  .fdbk-preview > :last-child{ margin-bottom:0; }
  .fdbk-preview h2,.fdbk-preview h3,.fdbk-preview h4,.fdbk-preview h5{ margin:16px 0 8px; font-size:15px; font-weight:700; }
  .fdbk-preview p{ margin:0 0 10px; }
  .fdbk-preview ul,.fdbk-preview ol{ margin:0 0 10px; padding-left:22px; }
  .fdbk-preview li{ margin:3px 0; }
  .fdbk-preview code{ padding:1px 5px; font-size:12.5px; background:color-mix(in srgb,var(--accent) 12%,transparent); border-radius:5px; }
  .fdbk-preview pre{ margin:0 0 10px; padding:11px 13px; overflow-x:auto; background:var(--surface); border:1px solid var(--border); border-radius:8px; }
  .fdbk-preview pre code{ padding:0; background:none; }
  .fdbk-preview table{ margin:0 0 10px; border-collapse:collapse; font-size:13.5px; }
  .fdbk-preview th,.fdbk-preview td{ padding:6px 11px; border:1px solid var(--border); text-align:left; }
  .fdbk-preview th{ background:var(--surface); font-weight:700; }
  .fdbk-preview blockquote{ margin:0 0 10px; padding:2px 0 2px 13px; border-left:3px solid var(--border); color:var(--muted); }
  .fdbk-preview details{ margin:0 0 10px; padding:10px 13px; background:var(--surface); border:1px solid var(--border); border-radius:8px; }
  .fdbk-preview summary{ cursor:pointer; font-weight:600; }
  .fdbk-preview hr{ margin:14px 0; border:0; border-top:1px solid var(--border); }
  .fdbk-preview-wait{ color:var(--muted); }
  .fdbk-banner{ margin:-6px 0 4px; font-size:13px; color:var(--neg); }
  .fdbk-images{ display:flex; flex-direction:column; gap:6px; }
  .fdbk-img-row{ display:flex; align-items:center; gap:10px; padding:8px 12px; font-size:13px; background:var(--surface-2); border:1px solid var(--border); border-radius:8px; }
  .fdbk-img-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text); }
  .fdbk-img-remove{ margin-left:auto; padding:5px 10px; font-size:12px; font-weight:600; font-family:var(--sans); color:var(--muted); background:transparent; border:1px solid var(--border); border-radius:7px; cursor:pointer; }
  .fdbk-img-remove:hover{ color:var(--text); border-color:var(--accent); }
  .fdbk-recent{ display:flex; flex-direction:column; gap:10px; }
  .fdbk-recent-h{ margin:0; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  .fdbk-recent-h-closed{ margin-top:6px; padding-top:10px; border-top:1px solid var(--border); font-size:11px; opacity:.75; }
  .fdbk-recent-list{ display:flex; flex-direction:column; gap:6px; margin:0; padding:0; list-style:none; }
  .fdbk-recent-row{ display:flex; flex-wrap:wrap; align-items:baseline; gap:9px; padding:9px 12px; font-size:13.5px; background:var(--surface); border:1px solid var(--border); border-radius:9px; }
  .fdbk-recent-row a{ color:var(--text); font-weight:600; }
  .fdbk-followup{ flex-basis:100%; }
  .fdbk-followup summary{ cursor:pointer; font-size:12px; color:var(--accent); font-weight:600; list-style:none; }
  .fdbk-followup summary::-webkit-details-marker{ display:none; }
  .fdbk-followup form{ display:flex; flex-direction:column; gap:8px; margin-top:8px; }
  .fdbk-followup textarea{ width:100%; box-sizing:border-box; padding:8px 10px; font:inherit; color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:8px; resize:vertical; }
  .fdbk-followup button{ align-self:flex-start; padding:7px 14px; font-size:12.5px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:8px; cursor:pointer; }
  .fdbk-recent-status{ padding:2px 8px; font-size:11px; font-weight:600; letter-spacing:.02em; border-radius:999px; white-space:nowrap; }
  .fdbk-status-open{ color:var(--muted); background:var(--surface-2); }
  .fdbk-status-needs-info{ color:var(--accent); background:color-mix(in srgb, var(--accent) 16%, transparent); }
  .fdbk-status-needs-eric{ color:var(--neg); background:color-mix(in srgb, var(--neg) 16%, transparent); }
  .fdbk-status-next-slice{ color:var(--pos); background:color-mix(in srgb, var(--pos) 16%, transparent); }
  .fdbk-status-shipped{ color:var(--pos); background:color-mix(in srgb, var(--pos) 16%, transparent); }
  .fdbk-recent-meta{ margin-left:auto; font-size:12px; color:var(--muted); white-space:nowrap; }
  .fdbk-res{ max-width:var(--col-narrow); }
  .fdbk-res .res-icon{ font-size:34px; margin-bottom:6px; }
  .fdbk-res h1{ margin:0 0 10px; font-size:24px; font-weight:700; }
  .fdbk-backrow{ margin-top:22px; font-size:14px; color:var(--muted); }
</style>`;
