import type { FeedbackLogEntry } from "../server/feedback-log.js";
import type { FeedbackStatus } from "../server/feedback-status.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";
import { formatPrice } from "./desk-data.js";
import { FEEDBACK_KIND_ICON, statusBadge } from "./feedback-view.js";
import { formatActivityTime, formatSigned, plClass, profileHref } from "./render-atoms.js";
import type { WirePnlRow, WireTradeRow } from "./wire-data.js";

/**
 * THE WIRE (`/wire`) — the shared activity/status board (Eric, 2026-08-25: "help track of those
 * engaging in trades and providing feedback... visibility to feedback helps others ideate as well
 * as keep tabs on the constant stream of change"). Three columns fed by data every other view
 * already produces (wire-data.ts does the joins, this file only renders): who's trading and what,
 * who's booked what P&L, and what feedback is open across the whole league — plus the onramp to
 * GitHub for anyone who wants to weigh in on someone else's idea.
 *
 * Feedback attribution here stays exactly as pseudonymous as `/feedback`'s own list: no display
 * name is resolved for a filing, honoring Eric's 2026-08-19 ruling (feedback-attribution.ts) that
 * an issue's public footer is the only place identity shows, never a second surface.
 */

export interface WireViewOptions {
  readonly nav?: NavContext;
  readonly trades: readonly WireTradeRow[];
  readonly pnl: readonly WirePnlRow[];
  readonly feedback: readonly FeedbackLogEntry[];
  readonly feedbackStatuses?: ReadonlyMap<number, FeedbackStatus>;
  /** Whether feedback is wired at all (SKYNET_FEEDBACK_GITHUB_TOKEN) — gates the pulse column's
   *  banner, same honesty seam every feedback-adjacent view already carries. */
  readonly feedbackEnabled: boolean;
}

function kindChip(kind: "human" | "bot"): string {
  return kind === "bot"
    ? `<span class="chip chip-bot">BOT</span>`
    : `<span class="chip chip-human">HUMAN</span>`;
}

function tradeRow(row: WireTradeRow): string {
  const sideCls = row.side === "buy" ? "pos" : "neg";
  return `<li class="wire-row">
    <span class="wire-side ${sideCls}">${row.side === "buy" ? "BUY" : "SELL"}</span>
    <span class="wire-symbol">${escapeHtml(row.symbol)}</span>
    <span class="wire-qty">${row.quantity}</span>
    <span class="wire-price">${row.price !== undefined ? formatPrice(row.price) : "—"}</span>
    <a class="wire-who" href="${profileHref(row.participantId)}">${escapeHtml(row.participantName)}</a>
    ${kindChip(row.kind)}
    ${row.reconstructed ? `<span class="wire-recon" title="Recovered after the fact, not watched live">reconstructed</span>` : ""}
    <span class="wire-time">${escapeHtml(formatActivityTime(row.at))}</span>
  </li>`;
}

function renderTradeFeed(trades: readonly WireTradeRow[]): string {
  if (trades.length === 0) {
    return `<p class="wire-empty">No trades on the wire yet — once the desk starts filling orders, they'll show up here.</p>`;
  }
  return `<ul class="wire-list">${trades.map(tradeRow).join("\n")}</ul>`;
}

function pnlRow(row: WirePnlRow): string {
  return `<li class="wire-pnl-row">
    <a href="${profileHref(row.participantId)}">${escapeHtml(row.participantName)}</a>
    ${kindChip(row.kind)}
    <span class="num ${plClass(row.realizedPl)}">${formatSigned(row.realizedPl)}</span>
  </li>`;
}

function renderPnlStrip(pnl: readonly WirePnlRow[]): string {
  if (pnl.length === 0) {
    return `<p class="wire-empty">Nothing booked yet — realized P&amp;L shows up here the first time someone closes a trade.</p>`;
  }
  return `<ul class="wire-pnl-list">${pnl.map(pnlRow).join("\n")}</ul>`;
}

function feedbackRow(
  entry: FeedbackLogEntry,
  statuses: ReadonlyMap<number, FeedbackStatus> | undefined,
): string {
  return `<li class="wire-fdbk-row">
    <span title="${escapeHtml(entry.kind)}">${FEEDBACK_KIND_ICON[entry.kind]}</span>
    <a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.title)}</a>
    ${statusBadge(statuses?.get(entry.issueNumber))}
    <span class="wire-fdbk-meta">#${entry.issueNumber} · ${escapeHtml(new Date(entry.filedAt).toLocaleDateString())}</span>
  </li>`;
}

function renderFeedbackPulse(
  feedback: readonly FeedbackLogEntry[],
  statuses: ReadonlyMap<number, FeedbackStatus> | undefined,
  enabled: boolean,
): string {
  if (!enabled) {
    return `<p class="wire-empty">Feedback isn't switched on yet, so there's nothing to show here.</p>`;
  }
  if (feedback.length === 0) {
    return `<p class="wire-empty">No feedback filed yet — be the first from <a href="/feedback">the feedback form</a>.</p>`;
  }
  const sorted = [...feedback].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
  return `<ul class="wire-fdbk-list">${sorted.map((e) => feedbackRow(e, statuses)).join("\n")}</ul>`;
}

function renderOnramp(): string {
  return `<div class="wire-onramp">
    <h2 class="wire-onramp-h">Weigh in on someone else's idea</h2>
    <p class="wire-onramp-p">Every item in the feedback pulse links to its GitHub issue — that's where the real back-and-forth happens.</p>
    <ol class="wire-onramp-steps">
      <li><strong>Create a free GitHub account</strong>, if you don't already have one — <a href="https://github.com/join" target="_blank" rel="noopener">github.com/join</a>.</li>
      <li><strong>Open the issue</strong> from any item above and drop a comment — agree, add detail, or just say you want it too.</li>
      <li><strong>Mention <code>@claude</code></strong> when you want it acted on, not just read — that's the one thing to remember. (Ask Eric to add you as a project collaborator first — that's what makes the mention count.)</li>
    </ol>
  </div>`;
}

export function renderWireBody(options: WireViewOptions): string {
  const content = `${WIRE_STYLE}
  <section class="wire">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">The Wire</h1>
        <p class="view-sub">Every trade, every P&amp;L, every open idea — the live pulse of the whole league.</p>
      </div>
    </div>
    <div class="wire-cols">
      <div class="wire-col">
        <h2 class="wire-col-h">Trading activity</h2>
        ${renderTradeFeed(options.trades)}
      </div>
      <div class="wire-col">
        <h2 class="wire-col-h">Booked P&amp;L</h2>
        ${renderPnlStrip(options.pnl)}
      </div>
      <div class="wire-col">
        <h2 class="wire-col-h">Feedback pulse</h2>
        ${renderFeedbackPulse(options.feedback, options.feedbackStatuses, options.feedbackEnabled)}
      </div>
    </div>
    ${renderOnramp()}
  </section>`;
  return renderShell(options.nav, content, new Date().toISOString());
}

/** Wire-only styles, kept out of shell-style.ts (same doctrine as FDBK_STYLE in feedback-view.ts).
 *  The status-pill rules mirror `.fdbk-status-*` exactly — `statusBadge()` is imported, not
 *  reimplemented, but its class names still need a definition on whichever page renders it. */
const WIRE_STYLE = `<style>
  .wire-cols{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start; }
  @container stage (max-width:900px){ .wire-cols{ grid-template-columns:1fr; } }
  .wire-col{ display:flex; flex-direction:column; gap:10px; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 20px; min-width:0; }
  .wire-col-h{ margin:0; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  .wire-empty{ margin:0; font-size:13px; color:var(--muted); line-height:1.55; }
  .wire-list, .wire-pnl-list, .wire-fdbk-list{ display:flex; flex-direction:column; gap:6px; margin:0; padding:0; list-style:none; max-height:420px; overflow-y:auto; }
  .wire-row{ display:flex; flex-wrap:wrap; align-items:baseline; gap:8px; padding:8px 10px; font-size:13px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; }
  .wire-side{ font-weight:700; font-size:11px; letter-spacing:.04em; }
  .wire-symbol{ font-weight:600; }
  .wire-qty, .wire-price{ color:var(--muted); font-variant-numeric:tabular-nums; }
  .wire-who{ color:var(--text); }
  .wire-recon{ font-size:10.5px; color:var(--muted); border:1px solid var(--border); border-radius:999px; padding:1px 7px; }
  .wire-time{ margin-left:auto; font-size:11.5px; color:var(--muted); white-space:nowrap; }
  .wire-pnl-row{ display:flex; align-items:baseline; gap:8px; padding:8px 10px; font-size:13px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; }
  .wire-pnl-row a{ color:var(--text); font-weight:600; }
  .wire-pnl-row .num{ margin-left:auto; font-variant-numeric:tabular-nums; }
  .wire-fdbk-row{ display:flex; flex-wrap:wrap; align-items:baseline; gap:8px; padding:8px 10px; font-size:13px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; }
  .wire-fdbk-row a{ color:var(--text); font-weight:600; }
  .wire-fdbk-meta{ margin-left:auto; font-size:11px; color:var(--muted); white-space:nowrap; }
  .fdbk-recent-status{ padding:2px 8px; font-size:11px; font-weight:600; letter-spacing:.02em; border-radius:999px; white-space:nowrap; }
  .fdbk-status-open{ color:var(--muted); background:var(--surface-2); }
  .fdbk-status-needs-info{ color:var(--accent); background:color-mix(in srgb, var(--accent) 16%, transparent); }
  .fdbk-status-needs-eric{ color:var(--neg); background:color-mix(in srgb, var(--neg) 16%, transparent); }
  .fdbk-status-next-slice{ color:var(--pos); background:color-mix(in srgb, var(--pos) 16%, transparent); }
  .fdbk-status-shipped{ color:var(--pos); background:color-mix(in srgb, var(--pos) 16%, transparent); }
  .wire-onramp{ margin-top:22px; display:flex; flex-direction:column; gap:10px; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px 24px; max-width:var(--col-form); }
  .wire-onramp-h{ margin:0; font-size:16px; font-weight:700; }
  .wire-onramp-p{ margin:0; font-size:13px; color:var(--muted); line-height:1.55; }
  .wire-onramp-steps{ margin:4px 0 0; padding-left:20px; display:flex; flex-direction:column; gap:8px; font-size:13.5px; line-height:1.55; }
  .wire-onramp-steps code{ padding:1px 6px; font-size:12.5px; background:color-mix(in srgb,var(--accent) 12%,transparent); border-radius:5px; }
</style>`;
