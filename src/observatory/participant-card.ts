import { escapeHtml } from "../ui/escape-html.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import {
  type ActivityView,
  type ParticipantSnapshot,
  type PositionView,
  unrealizedPl,
} from "./participant-snapshot.js";
import {
  chip,
  formatActivityTime,
  formatCurrency,
  formatSigned,
  plClass,
  profileHref,
  tzAbbrev,
} from "./render-atoms.js";

/**
 * The PARTICIPANT CARD molecule — a single participant's tile on the board grid: header (name,
 * chip, status dot), equity + metrics, empire thumbnail, positions table, and activity feed. Used
 * by the board view; the individual view reuses the positions/activity atoms directly.
 */

export function participantUnrealized(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + unrealizedPl(p), 0);
}

export function participantInvested(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + p.marketValue, 0);
}

/** A participant's unrealized return, as a percent of invested — 0 when nothing's invested. */
export function participantReturnPct(snapshot: ParticipantSnapshot): number {
  const invested = participantInvested(snapshot);
  return invested > 0 ? (participantUnrealized(snapshot) / invested) * 100 : 0;
}

function positionRow(position: PositionView): string {
  const pl = unrealizedPl(position);
  return `<tr>
      <td class="sym">${escapeHtml(position.symbol)}</td>
      <td class="num">${position.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatCurrency(position.avgPrice)}</td>
      <td class="num">${formatCurrency(position.marketValue)}</td>
      <td class="num ${plClass(pl)}">${formatSigned(pl)}</td>
    </tr>`;
}

export function positionsTable(snapshot: ParticipantSnapshot): string {
  if (snapshot.positions.length === 0) {
    return `<p class="empty">No open positions — waiting is a position.</p>`;
  }
  return `<table class="positions">
      <thead>
        <tr><th>Symbol</th><th class="num">Qty</th><th class="num">Avg</th><th class="num">Mkt Value</th><th class="num">Unrealized</th></tr>
      </thead>
      <tbody>${snapshot.positions.map(positionRow).join("")}</tbody>
    </table>`;
}

function activityRow(activity: ActivityView, timezone?: string): string {
  const side = activity.side.toUpperCase();
  const sideClass = activity.side === "buy" ? "pos" : "neg";
  const px = activity.price !== undefined ? ` @ ${formatCurrency(activity.price)}` : "";
  return `<tr>
      <td class="act-time num">${escapeHtml(formatActivityTime(activity.at, timezone))}</td>
      <td class="act-trade"><span class="${sideClass}">${side}</span> <span class="sym">${escapeHtml(activity.symbol)}</span></td>
      <td class="num">${activity.quantity.toLocaleString("en-US")}${escapeHtml(px)}</td>
      <td class="act-status">${escapeHtml(activity.status)}</td>
    </tr>`;
}

export function activityFeed(snapshot: ParticipantSnapshot): string {
  const activity = snapshot.activity ?? [];
  if (activity.length === 0) {
    return "";
  }
  const rows = activity
    .slice(0, 6)
    .map((a) => activityRow(a, snapshot.timezone))
    .join("");
  return `<div class="activity">
      <div class="activity-head">Recent Activity <span class="tzlabel">${escapeHtml(tzAbbrev(snapshot.timezone))}</span></div>
      <table class="acttable"><tbody>${rows}</tbody></table>
    </div>`;
}

export interface CardOptions {
  /** This participant is the signed-in viewer — pull to the top and mark "YOU". */
  readonly isSelf?: boolean;
  /** When true the whole card links to the participant's profile (/u/:id). */
  readonly link?: boolean;
  /** Persona-landmark power (0..1) — a bot's rank among bots, scaling its Eye on the thumbnail. */
  readonly prominence?: number;
}

export function participantCard(snapshot: ParticipantSnapshot, opts: CardOptions = {}): string {
  const self = opts.isSelf ? " card-self" : "";
  const tag = opts.link ? "a" : "article";
  const href = opts.link ? ` href="${profileHref(snapshot.id)}"` : "";
  const youMark = opts.isSelf ? `<span class="you-mark">YOU</span>` : "";

  if (snapshot.error) {
    // Never render this link when the card itself is `<a href="/u/:id">` (opts.link) — a nested
    // anchor is invalid HTML with unpredictable click behavior. The profile page (isSelf-only,
    // never card-wrapped) carries the same hint via renderIndividualBody instead.
    const rotateHint =
      opts.isSelf && !opts.link
        ? ` <a href="/rotate">Regenerated your key? Rotate your credentials</a>.`
        : "";
    return `<${tag} class="card card-error${self}"${href}>
      <header class="card-head">
        <h3>${escapeHtml(snapshot.displayName)}</h3>
        ${youMark}
        ${chip(snapshot)}
        <span class="dot dot-error" title="account unreachable"></span>
      </header>
      <p class="error-msg">Account unreachable — check this participant's API keys.${rotateHint}</p>
    </${tag}>`;
  }

  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  return `<${tag} class="card${self}"${href}>
      <header class="card-head">
        <h3>${escapeHtml(snapshot.displayName)}</h3>
        ${youMark}
        ${chip(snapshot)}
        <span class="dot dot-live" title="account live"></span>
      </header>
      <div class="equity">
        <span class="equity-label">Equity</span>
        <span class="equity-num num">${formatCurrency(snapshot.equity)}</span>
      </div>
      <dl class="metrics">
        <div><dt>Cash</dt><dd class="num">${formatCurrency(snapshot.cash)}</dd></div>
        <div><dt>Invested</dt><dd class="num">${formatCurrency(invested)}</dd></div>
        <div><dt>Unrealized</dt><dd class="num ${plClass(pl)}">${formatSigned(pl)}</dd></div>
      </dl>
      <div class="empire-thumb">${renderEmpireSkyline(snapshot, {
        compact: true,
        ...(opts.prominence !== undefined ? { personaProminence: opts.prominence } : {}),
      })}</div>
      ${positionsTable(snapshot)}
      ${activityFeed(snapshot)}
    </${tag}>`;
}
