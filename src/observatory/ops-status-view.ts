import type { OpsSignal, OpsStatus, SignalVerdict } from "../server/ops-status-service.js";
import { escapeHtml } from "../ui/escape-html.js";
import { formatTimestamp } from "./render-atoms.js";

/**
 * THE OPS-STATUS PANEL VIEW (#666 slice 1) — read-only, owner-gated, one glance from a phone.
 * Every row is one signal from `ops-status-service.ts`: a colored dot (the market-color rule,
 * `docs/BRAND.md` — green/ok, red/attention, muted/unknown-not-alarming), the plain-language
 * detail, and — on anything short of `ok` — the deep link to the Actions run that fixes it
 * (the issue's own EARS criterion: "every failure row shall deep-link to its recovery control").
 *
 * Deliberately NOT a desk tab: this isn't about any one account, it's the whole fleet's
 * infrastructure health, so it gets its own top-level route (`/ops-status`) and its own small
 * stylesheet rather than borrowing `desk-style.ts`'s trading-terminal chrome.
 */

const DOT_CLASS: Record<SignalVerdict, string> = { ok: "pos", attention: "neg", unknown: "flat" };
const DOT_GLYPH: Record<SignalVerdict, string> = { ok: "●", attention: "●", unknown: "○" };
const VERDICT_LABEL: Record<SignalVerdict, string> = {
  ok: "OK",
  attention: "ATTENTION",
  unknown: "UNKNOWN",
};

const OPS_STATUS_STYLE = `<style>
  .ops-status{ display:flex; flex-direction:column; gap:16px; max-width:var(--col-narrow); }
  .ops-head{ display:flex; flex-direction:column; gap:4px; }
  .ops-eyebrow{ font-family:var(--mono); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); }
  .ops-title{ font-size:20px; font-weight:700; letter-spacing:-.01em; }
  .ops-sub{ font-size:13px; color:var(--muted); line-height:1.5; }
  .ops-list{ display:flex; flex-direction:column; gap:10px; }
  .ops-row{ display:flex; gap:12px; align-items:flex-start; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 18px; }
  .ops-dot{ flex:0 0 auto; font-size:13px; line-height:1.5; margin-top:1px; }
  .ops-dot.pos{ color:var(--pos); } .ops-dot.neg{ color:var(--neg); } .ops-dot.flat{ color:var(--muted); }
  .ops-body{ flex:1 1 auto; min-width:0; }
  .ops-row-head{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  .ops-label{ font-size:14px; font-weight:700; }
  .ops-verdict{ font-family:var(--mono); font-size:10px; letter-spacing:.1em; }
  .ops-verdict.pos{ color:var(--pos); } .ops-verdict.neg{ color:var(--neg); } .ops-verdict.flat{ color:var(--muted); }
  .ops-detail{ font-size:13px; color:var(--muted); line-height:1.5; margin-top:4px; }
  .ops-link{ display:inline-block; margin-top:9px; font-size:12.5px; font-weight:600; color:var(--accent); text-decoration:none; }
  .ops-link:hover{ text-decoration:underline; }
  .ops-degraded{ display:flex; gap:9px; align-items:flex-start; font-size:12px; color:var(--muted); line-height:1.5;
    background:var(--surface-2); border:1px solid var(--border); border-left:3px solid color-mix(in srgb,var(--accent) 60%,var(--border));
    border-radius:9px; padding:11px 14px; }
  .ops-degraded b{ color:var(--text); }
  .ops-asof{ font-family:var(--mono); font-size:11px; color:var(--muted); }
</style>`;

function signalRow(signal: OpsSignal): string {
  const cls = DOT_CLASS[signal.verdict];
  return `<div class="ops-row">
    <span class="ops-dot ${cls}" aria-hidden="true">${DOT_GLYPH[signal.verdict]}</span>
    <div class="ops-body">
      <div class="ops-row-head">
        <span class="ops-label">${escapeHtml(signal.label)}</span>
        <span class="ops-verdict ${cls}">${VERDICT_LABEL[signal.verdict]}</span>
      </div>
      <p class="ops-detail">${escapeHtml(signal.detail)}</p>
      ${signal.link ? `<a class="ops-link" href="${escapeHtml(signal.link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(signal.link.label)} →</a>` : ""}
    </div>
  </div>`;
}

export function renderOpsStatusBody(status: OpsStatus): string {
  const degraded = status.degraded
    ? `<p class="ops-degraded"><b>Credential-free mode.</b> No GitHub token is configured for this app, so deploy-lag isn't computed here — every row still tells you where to check by hand.</p>`
    : "";
  return `${OPS_STATUS_STYLE}<section class="ops-status">
    <div class="ops-head">
      <span class="ops-eyebrow">Owner only · read-only</span>
      <h1 class="ops-title">Ops status</h1>
      <p class="ops-sub">Bots and deploy health, glanceable from a phone. Nothing here mutates
      anything — every failure row links to the Actions button that fixes it.</p>
    </div>
    ${degraded}
    <div class="ops-list">${status.signals.map(signalRow).join("")}</div>
    <span class="ops-asof">Checked ${escapeHtml(formatTimestamp(status.generatedAt))}</span>
  </section>`;
}
