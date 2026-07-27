import { PLAYS, PLAY_LEVELS, type Play, type PlayLevel } from "../domain/plays.js";
import type { DashboardData } from "./dashboard-data.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import { equityChange, renderEquitySparkline } from "./equity-sparkline.js";
import type { EquitySample } from "./history-store.js";
import type { ActivityView, ParticipantSnapshot, PositionView } from "./participant-snapshot.js";
import { personaLore } from "./persona-lore.js";

/**
 * Renders a `DashboardData` into a self-contained observatory dashboard.
 *
 * `renderDashboardBody` returns page content (a `<style>` block plus markup) suitable for
 * publishing directly as a Claude Artifact (which supplies the document skeleton).
 * `renderDashboardDocument` wraps that in a full HTML document for standalone files.
 *
 * Pure: same data in, same HTML out — so it's unit-testable and safe to re-run on a
 * schedule to refresh a published dashboard.
 */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatCurrency(value)}`;
}

function plClass(value: number): "pos" | "neg" | "flat" {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "flat";
}

function costBasis(position: PositionView): number {
  return position.avgPrice * position.quantity;
}

function unrealized(position: PositionView): number {
  return position.marketValue - costBasis(position);
}

function participantUnrealized(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + unrealized(p), 0);
}

function participantInvested(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + p.marketValue, 0);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function chip(snapshot: ParticipantSnapshot): string {
  if (snapshot.kind === "bot") {
    const persona = snapshot.personaId ? escapeHtml(snapshot.personaId) : "bot";
    return `<span class="chip chip-bot">BOT · ${persona}</span>`;
  }
  return `<span class="chip chip-human">HUMAN</span>`;
}

function positionRow(position: PositionView): string {
  const pl = unrealized(position);
  return `<tr>
      <td class="sym">${escapeHtml(position.symbol)}</td>
      <td class="num">${position.quantity.toLocaleString("en-US")}</td>
      <td class="num">${formatCurrency(position.avgPrice)}</td>
      <td class="num">${formatCurrency(position.marketValue)}</td>
      <td class="num ${plClass(pl)}">${formatSigned(pl)}</td>
    </tr>`;
}

function positionsTable(snapshot: ParticipantSnapshot): string {
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

function tzAbbrev(timezone?: string): string {
  if (!timezone) return "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

function formatActivityTime(iso: string, timezone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone ?? "UTC",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return iso;
  }
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

function activityFeed(snapshot: ParticipantSnapshot): string {
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

interface CardOptions {
  /** This participant is the signed-in viewer — pull to the top and mark "YOU". */
  readonly isSelf?: boolean;
  /** When true the whole card links to the participant's profile (/u/:id). */
  readonly link?: boolean;
  /** Persona-landmark power (0..1) — a bot's rank among bots, scaling its Eye on the thumbnail. */
  readonly prominence?: number;
}

/**
 * Rank the bots by return% and map each to a landmark "prominence" 0..1 — the leveling dial for the
 * persona landmark (best bot = 1, worst = ~0.55, linear by rank). Pure; humans/no-bots → empty map.
 * The landmark becomes the scoreboard: a better bot's Eye grows larger relative to its peers.
 */
export function botLandmarkProminence(
  participants: readonly ParticipantSnapshot[],
): Map<string, number> {
  const bots = participants
    .filter((p) => p.kind === "bot" && !p.error)
    .sort((a, b) => participantReturnPct(b) - participantReturnPct(a));
  const out = new Map<string, number>();
  if (bots.length === 1) {
    const only = bots[0];
    if (only) out.set(only.id, 1);
    return out;
  }
  bots.forEach((p, i) => out.set(p.id, 1 - (i / (bots.length - 1)) * 0.45));
  return out;
}

/** Slugified id → the profile URL for a participant. Ids are already URL-safe. */
function profileHref(id: string): string {
  return `/u/${encodeURIComponent(id)}`;
}

function participantCard(snapshot: ParticipantSnapshot, opts: CardOptions = {}): string {
  const self = opts.isSelf ? " card-self" : "";
  const tag = opts.link ? "a" : "article";
  const href = opts.link ? ` href="${profileHref(snapshot.id)}"` : "";
  const youMark = opts.isSelf ? `<span class="you-mark">YOU</span>` : "";

  if (snapshot.error) {
    return `<${tag} class="card card-error${self}"${href}>
      <header class="card-head">
        <h3>${escapeHtml(snapshot.displayName)}</h3>
        ${youMark}
        ${chip(snapshot)}
        <span class="dot dot-error" title="account unreachable"></span>
      </header>
      <p class="error-msg">Account unreachable — check this participant's API keys.</p>
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

function summaryStrip(data: DashboardData): string {
  const live = data.participants.filter((p) => !p.error);
  const totalEquity = live.reduce((s, p) => s + p.equity, 0);
  const totalCash = live.reduce((s, p) => s + p.cash, 0);
  const totalInvested = live.reduce((s, p) => s + participantInvested(p), 0);
  const totalPl = live.reduce((s, p) => s + participantUnrealized(p), 0);
  const bots = data.participants.filter((p) => p.kind === "bot").length;
  const humans = data.participants.filter((p) => p.kind === "human").length;

  return `<section class="summary">
      <div class="tile tile-lead">
        <span class="tile-label">Total Equity</span>
        <span class="tile-num num">${formatCurrency(totalEquity)}</span>
      </div>
      <div class="tile">
        <span class="tile-label">Cash</span>
        <span class="tile-num num">${formatCurrency(totalCash)}</span>
      </div>
      <div class="tile">
        <span class="tile-label">Invested</span>
        <span class="tile-num num">${formatCurrency(totalInvested)}</span>
      </div>
      <div class="tile">
        <span class="tile-label">Unrealized P/L</span>
        <span class="tile-num num ${plClass(totalPl)}">${formatSigned(totalPl)}</span>
      </div>
      <div class="tile tile-count">
        <span class="tile-label">Participants</span>
        <span class="tile-num num">${bots}<span class="unit"> bots</span> · ${humans}<span class="unit"> human${humans === 1 ? "" : "s"}</span></span>
      </div>
    </section>`;
}

/** Which top-level view is active, for the shared nav. */
export type NavView = "board" | "leaderboard" | "bots" | "compare" | "you" | "add" | "learn";

export interface NavContext {
  readonly active: NavView;
  /** The signed-in viewer's participant id, if resolved — powers the "You" tab + self marker. */
  readonly currentId?: string;
  readonly canAdd: boolean;
  readonly authed: boolean;
  /** Views ship incrementally; only link the ones that exist so merged states have no dead links. */
  readonly hasLeaderboard?: boolean;
  readonly hasBots?: boolean;
  readonly hasCompare?: boolean;
}

export interface DashboardViewOptions {
  /** Render the shared top nav (logged-in shell). Omit for the bare embeddable body. */
  readonly nav?: NavContext;
}

/** In-app "Feedback" links point at the self-service form (no GitHub account needed). */
const FEEDBACK_URL = "/feedback";

const NAV_ICON: Record<string, string> = {
  board: "▦",
  compare: "⇄",
  leaderboard: "≣",
  bots: "◆",
  you: "◉",
  add: "＋",
  learn: "◈",
};

function drawerLink(href: string, label: string, view: NavView, active: boolean): string {
  return `<a class="dnav-link${active ? " active" : ""}" href="${href}"${
    active ? ' aria-current="page"' : ""
  }><span class="dnav-ico" aria-hidden="true">${NAV_ICON[view] ?? "•"}</span><span class="dnav-label">${label}</span></a>`;
}

/**
 * The left DRAWER — an insulated, full-height navigation container. It is a sibling of the main
 * stage (not an overlay): opening/closing it PUSHES the stage to make room. Holds the brand, the
 * vertical view nav, and the account actions. This shell is the template every logged-in view uses.
 */
function renderDrawer(nav: NavContext): string {
  const links = [drawerLink("/", "Board", "board", nav.active === "board")];
  if (nav.hasLeaderboard) {
    links.push(
      drawerLink("/leaderboard", "Leaderboard", "leaderboard", nav.active === "leaderboard"),
    );
  }
  if (nav.hasBots) {
    links.push(drawerLink("/bots-vs-humans", "Bots vs Humans", "bots", nav.active === "bots"));
  }
  if (nav.hasCompare) {
    links.push(drawerLink("/compare", "Compare", "compare", nav.active === "compare"));
  }
  if (nav.currentId) {
    links.push(drawerLink(profileHref(nav.currentId), "You", "you", nav.active === "you"));
  }
  links.push(drawerLink("/learn", "Learn", "learn", nav.active === "learn"));
  const foot: string[] = [];
  if (nav.canAdd) {
    foot.push(
      `<a class="dnav-cta" href="/add"><span class="dnav-ico" aria-hidden="true">${NAV_ICON.add}</span><span class="dnav-label">${
        nav.currentId ? "Add account" : "Connect account"
      }</span></a>`,
    );
  }
  foot.push(
    `<a class="dnav-link dnav-muted" href="${FEEDBACK_URL}"><span class="dnav-ico" aria-hidden="true">✎</span><span class="dnav-label">Feedback</span></a>`,
  );
  if (nav.authed) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/logout"><span class="dnav-ico" aria-hidden="true">⏻</span><span class="dnav-label">Sign out</span></a>`,
    );
  }
  // The drawer is built from the same card language as the participant cards: titled sections in
  // bordered containers, all anchored top-left. New sections (e.g. a "Your standing" card, filters)
  // drop in as more `.dcard` blocks — the structure scales to more complexity without a redesign.
  return `<aside class="drawer" id="drawer" aria-label="Navigation">
      <div class="drawer-brand">
        <span class="mark">SKYNET<b>·</b>CAPITAL</span>
        <span class="sub">Observatory</span>
      </div>
      <section class="dcard">
        <h2 class="dcard-title">Views</h2>
        <nav class="drawer-nav" aria-label="Views">${links.join("")}</nav>
      </section>
      <section class="dcard">
        <h2 class="dcard-title">Account</h2>
        <div class="drawer-nav">${foot.join("")}</div>
      </section>
    </aside>`;
}

/**
 * Wrap a view's content in the push-drawer app shell. The drawer is a sibling of the scrolling
 * stage, so toggling it slides the stage over (content is pushed, never covered). #root carries the
 * `.obs` design-token scope and is what the SSE stream swaps on the board. No-JS/reduced-motion safe:
 * the drawer starts open and the toggle simply flips a class (no animation under reduced-motion).
 */
function renderShell(nav: NavContext | undefined, content: string, generatedAt: string): string {
  if (!nav) {
    // Bare embeddable body (e.g. Artifact publishing) — no shell, just the token-scoped content.
    return `${STYLE}
<div class="obs" id="root">${content}</div>`;
  }
  return `${STYLE}
<div class="app" data-drawer="open">
  ${renderDrawer(nav)}
  <main class="stage">
    <button class="drawer-toggle" type="button" aria-controls="drawer" aria-expanded="true" aria-label="Toggle navigation"><span aria-hidden="true">‹‹</span></button>
    <div class="stage-inner">
      <div class="stage-meta">
        <span class="tag">PAPER · SANDBOX</span>
        <span class="ts num">${escapeHtml(formatTimestamp(generatedAt))}</span>
      </div>
      <div class="obs" id="root">${content}</div>
    </div>
  </main>
</div>
${DRAWER_SCRIPT}`;
}

/** Drawer toggle: push (not overlay), remembers state, and stays inert under reduced-motion. */
const DRAWER_SCRIPT = `<script>
(function(){
  var app=document.querySelector(".app"), btn=document.querySelector(".drawer-toggle");
  if(!app||!btn) return;
  try{ if(localStorage.getItem("obs-drawer")==="closed") app.setAttribute("data-drawer","closed"); }catch(e){}
  function sync(){ var open=app.getAttribute("data-drawer")!=="closed"; btn.setAttribute("aria-expanded",open?"true":"false"); }
  sync();
  btn.addEventListener("click",function(){
    var closed=app.getAttribute("data-drawer")==="closed";
    app.setAttribute("data-drawer",closed?"open":"closed");
    try{ localStorage.setItem("obs-drawer",closed?"open":"closed"); }catch(e){}
    sync();
  });
})();
</script>`;

/** Signed-in viewer first (marked YOU), then everyone else in the given order. */
function orderParticipants(
  participants: ParticipantSnapshot[],
  currentId?: string,
): ParticipantSnapshot[] {
  if (!currentId) return participants;
  const self = participants.filter((p) => p.id === currentId);
  const rest = participants.filter((p) => p.id !== currentId);
  return [...self, ...rest];
}

/** A labelled stat tile (reused across summary strips and the individual hero row). */
function tile(label: string, value: string, opts: { lead?: boolean; cls?: string } = {}): string {
  return `<div class="tile${opts.lead ? " tile-lead" : ""}">
        <span class="tile-label">${label}</span>
        <span class="tile-num num${opts.cls ? ` ${opts.cls}` : ""}">${value}</span>
      </div>`;
}

/**
 * The INDIVIDUAL view — one participant's own performance. Hero equity + a stat row, then the
 * full position detail and activity timeline, plus (for bots) the persona read. Deferred
 * history metrics (equity over time, realized P/L, win rate) show as reserved seams, never
 * fabricated numbers — they light up once the history layer lands.
 */
export function renderIndividualBody(
  snapshot: ParticipantSnapshot,
  options: DashboardViewOptions & {
    isSelf?: boolean;
    generatedAt?: string;
    history?: readonly EquitySample[];
  } = {},
): string {
  const isSelf = Boolean(options.isSelf);
  const asOf = options.generatedAt ?? new Date().toISOString();
  const who = isSelf ? "Your desk" : `${escapeHtml(snapshot.displayName)}'s desk`;
  const lore = snapshot.kind === "bot" ? personaLore(snapshot.personaId) : undefined;
  const persona = lore
    ? `<div class="persona"><span class="persona-label">Persona</span><span class="persona-id">${escapeHtml(
        lore.name,
      )}</span></div>`
    : snapshot.kind === "bot" && snapshot.personaId
      ? `<div class="persona"><span class="persona-label">Strategy</span><span class="persona-id">${escapeHtml(
          snapshot.personaId,
        )}</span></div>`
      : "";
  const personaCard = lore
    ? `<section class="persona-card">
    <span class="persona-eyebrow">Persona · ${escapeHtml(lore.name)}</span>
    <p class="persona-thesis">${escapeHtml(lore.thesis)}</p>
    ${lore.lore ? `<p class="persona-legend">${escapeHtml(lore.lore)}</p>` : ""}
  </section>`
    : "";

  if (snapshot.error) {
    return renderShell(
      options.nav,
      `<section class="indiv indiv-error">
    <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}</h1>
    <p class="error-msg">Account unreachable — check this participant's API keys.</p>
  </section>`,
      asOf,
    );
  }

  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  const buyingPower = snapshot.cash;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  return renderShell(
    options.nav,
    `<section class="indiv">
    <header class="indiv-head">
      <div class="indiv-title">
        <span class="indiv-eyebrow">${who}</span>
        <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}${
          isSelf ? `<span class="you-mark">YOU</span>` : ""
        }</h1>
      </div>
      ${persona}
    </header>
    <div class="empire-band">${renderEmpireSkyline(snapshot)}</div>
    <div class="indiv-hero">
      <div class="hero-equity">
        <span class="tile-label">Equity</span>
        <span class="hero-num num">${formatCurrency(snapshot.equity)}</span>
        <span class="hero-sub num ${plClass(pl)}">${formatSigned(pl)} unrealized · ${
          plPct >= 0 ? "+" : ""
        }${plPct.toFixed(2)}%</span>
      </div>
      <div class="summary indiv-tiles">
        ${tile("Cash", formatCurrency(snapshot.cash))}
        ${tile("Invested", formatCurrency(invested))}
        ${tile("Unrealized P/L", formatSigned(pl), { cls: plClass(pl) })}
        ${tile("Buying Power", formatCurrency(buyingPower))}
      </div>
    </div>
    ${personaCard}
    <div class="indiv-cols">
      <div class="indiv-col">
        <h2 class="col-head">Positions</h2>
        ${positionsTable(snapshot)}
      </div>
      <div class="indiv-col">
        <h2 class="col-head">Activity <span class="tzlabel">${escapeHtml(
          tzAbbrev(snapshot.timezone),
        )}</span></h2>
        ${activityFeed(snapshot) || `<p class="empty">No recent activity.</p>`}
      </div>
    </div>
    ${historyPanel(snapshot, options.history)}
  </section>`,
    asOf,
  );
}

/**
 * The performance-history panel. Lights up the equity sparkline + realized P/L once ≥2 samples have
 * been recorded; otherwise shows the honest "still accruing" seam — never a fabricated line.
 */
function historyPanel(snapshot: ParticipantSnapshot, history?: readonly EquitySample[]): string {
  const spark = history ? renderEquitySparkline(history) : null;
  if (!spark) {
    return `<div class="history-seam">
      <span class="seam-label">Performance history</span>
      <p class="seam-note">Equity over time, realized P/L, and per-play win rate light up here once we've recorded your history.</p>
    </div>`;
  }
  const change = equityChange(history ?? []);
  const realized = snapshot.realizedPl;
  return `<section class="history-panel">
      <h2 class="col-head">Performance history</h2>
      <div class="history-spark">${spark}</div>
      <dl class="metrics history-metrics">
        ${
          change
            ? `<div><dt>Since first sample</dt><dd class="num ${plClass(change.abs)}">${formatSigned(
                change.abs,
              )} · ${change.pct >= 0 ? "+" : ""}${change.pct.toFixed(2)}%</dd></div>`
            : ""
        }
        ${
          realized !== undefined
            ? `<div><dt>Realized P/L</dt><dd class="num ${plClass(realized)}">${formatSigned(realized)}</dd></div>`
            : ""
        }
      </dl>
      <p class="seam-note">Per-play win rate lights up as more history accrues.</p>
    </section>`;
}

/** Metrics the leaderboard can rank by — all snapshot-derived (no history needed). */
export type LeaderMetric = "equity" | "pl" | "return";

const LEADER_METRICS: ReadonlyArray<{ key: LeaderMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
];

function metricValue(snapshot: ParticipantSnapshot, metric: LeaderMetric): number {
  const pl = participantUnrealized(snapshot);
  if (metric === "pl") return pl;
  if (metric === "return") {
    const invested = participantInvested(snapshot);
    return invested > 0 ? (pl / invested) * 100 : 0;
  }
  return snapshot.equity;
}

function formatMetric(value: number, metric: LeaderMetric): string {
  if (metric === "return") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  if (metric === "pl") return formatSigned(value);
  return formatCurrency(value);
}

/**
 * The LEADERBOARD view — comparison at scale. Ranks everyone by a selectable metric (equity,
 * unrealized P/L, or return %), humans and bots interleaved. Friendly/celebratory framing: this
 * is a friends-and-family league, so it's bragging rights, not a zero-sum war. The metric picker
 * is plain links (?by=…) so it stays shareable and back/forward-friendly with no JS.
 */
export function renderLeaderboardBody(
  data: DashboardData,
  options: DashboardViewOptions & { metric?: LeaderMetric } = {},
): string {
  const metric = options.metric ?? "equity";
  const currentId = options.nav?.currentId;
  const live = data.participants.filter((p) => !p.error);
  const ranked = [...live].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  const maxAbs = ranked.reduce((m, p) => Math.max(m, Math.abs(metricValue(p, metric))), 0) || 1;

  const picker = LEADER_METRICS.map(
    (m) =>
      `<a class="msel${m.key === metric ? " active" : ""}" href="/leaderboard?by=${m.key}">${m.label}</a>`,
  ).join("");

  const rows = ranked
    .map((p, i) => {
      const v = metricValue(p, metric);
      const width = Math.max(2, (Math.abs(v) / maxAbs) * 100);
      const sign = metric === "equity" ? "flat" : plClass(v);
      const self = currentId && p.id === currentId ? " rank-self" : "";
      const you = currentId && p.id === currentId ? `<span class="you-mark">YOU</span>` : "";
      const medal = i < 3 ? ` rank-top rank-${i + 1}` : "";
      return `<li class="rank-row${self}${medal}">
        <span class="rank">${i + 1}</span>
        <a class="rank-name" href="${profileHref(p.id)}">${escapeHtml(p.displayName)} ${chip(p)}${you}</a>
        <span class="rank-bar"><i class="bar-${sign}" style="width:${width.toFixed(1)}%"></i></span>
        <span class="rank-val num ${sign}">${formatMetric(v, metric)}</span>
      </li>`;
    })
    .join("\n      ");

  return renderShell(
    options.nav,
    `<section class="ladder-wrap">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Leaderboard</h1>
        <p class="view-sub">Everybody's welcome to win — it's a friendly league.</p>
      </div>
      <div class="metricsel">${picker}</div>
    </div>
    <ol class="ladder">
      ${rows || `<li class="empty">No participants on the board yet.</li>`}
    </ol>
  </section>
  <footer class="obs-foot">Read-only observatory · ranked by ${escapeHtml(
    LEADER_METRICS.find((m) => m.key === metric)?.label ?? "equity",
  )} · figures reflect the last account read.</footer>`,
    data.generatedAt,
  );
}

interface CohortStats {
  readonly kind: "human" | "bot";
  readonly label: string;
  readonly count: number;
  readonly totalEquity: number;
  readonly avgEquity: number;
  readonly totalUnrealized: number;
  readonly returnPct: number;
  readonly breadthPct: number; // share of the cohort currently in profit
  readonly best?: { name: string; pct: number };
  readonly spread: number; // best return% − worst return%
}

function participantReturnPct(snapshot: ParticipantSnapshot): number {
  const invested = participantInvested(snapshot);
  return invested > 0 ? (participantUnrealized(snapshot) / invested) * 100 : 0;
}

function cohortStats(
  participants: ParticipantSnapshot[],
  kind: "human" | "bot",
  label: string,
): CohortStats {
  const c = participants.filter((p) => p.kind === kind && !p.error);
  const count = c.length;
  const totalEquity = c.reduce((s, p) => s + p.equity, 0);
  const totalUnrealized = c.reduce((s, p) => s + participantUnrealized(p), 0);
  const totalInvested = c.reduce((s, p) => s + participantInvested(p), 0);
  const returns = c.map(participantReturnPct);
  const inProfit = c.filter((p) => participantUnrealized(p) >= 0).length;
  let best: { name: string; pct: number } | undefined;
  for (const p of c) {
    const pct = participantReturnPct(p);
    if (!best || pct > best.pct) best = { name: p.displayName, pct };
  }
  return {
    kind,
    label,
    count,
    totalEquity,
    avgEquity: count ? totalEquity / count : 0,
    totalUnrealized,
    returnPct: totalInvested > 0 ? (totalUnrealized / totalInvested) * 100 : 0,
    breadthPct: count ? (inProfit / count) * 100 : 0,
    best,
    spread: returns.length ? Math.max(...returns) - Math.min(...returns) : 0,
  };
}

function pct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/**
 * Collapse a cohort's members into one synthetic snapshot: positions summed by ticker (blended cost
 * basis so per-symbol unrealized sign survives), cash + equity summed. Feeds the nation skyline —
 * the cohort rendered as a single country of combined towers (the scale-ladder's country zoom).
 */
function cohortSnapshot(
  participants: ParticipantSnapshot[],
  kind: "human" | "bot",
  label: string,
): ParticipantSnapshot {
  const c = participants.filter((p) => p.kind === kind && !p.error);
  const byTicker = new Map<string, { quantity: number; cost: number; marketValue: number }>();
  for (const p of c)
    for (const pos of p.positions) {
      const key = pos.symbol.toUpperCase();
      const agg = byTicker.get(key) ?? { quantity: 0, cost: 0, marketValue: 0 };
      agg.quantity += pos.quantity;
      agg.cost += pos.quantity * pos.avgPrice;
      agg.marketValue += pos.marketValue;
      byTicker.set(key, agg);
    }
  const positions: PositionView[] = [...byTicker.entries()].map(([symbol, a]) => ({
    symbol,
    quantity: a.quantity,
    avgPrice: a.quantity > 0 ? a.cost / a.quantity : 0,
    marketValue: a.marketValue,
  }));
  return {
    id: `cohort-${kind}`,
    displayName: label,
    kind,
    cash: c.reduce((s, p) => s + p.cash, 0),
    equity: c.reduce((s, p) => s + p.equity, 0),
    positions,
    activity: [],
  };
}

function cohortCard(stats: CohortStats, leads: boolean, nation: ParticipantSnapshot): string {
  const chipCls = stats.kind === "bot" ? "chip-bot" : "chip-human";
  return `<article class="cohort ${leads ? "cohort-lead" : ""}">
      <header class="cohort-head">
        <span class="chip ${chipCls}">${stats.label.toUpperCase()}</span>
        <span class="cohort-count num">${stats.count}<span class="unit"> account${stats.count === 1 ? "" : "s"}</span></span>
        ${leads ? `<span class="cohort-badge">LEADS</span>` : ""}
      </header>
      <div class="cohort-equity num">${formatCurrency(stats.totalEquity)}</div>
      <div class="cohort-eqlabel">total equity</div>
      <div class="cohort-nation">${renderEmpireSkyline(nation)}</div>
      <dl class="cohort-metrics">
        <div><dt>Avg equity</dt><dd class="num">${formatCurrency(stats.avgEquity)}</dd></div>
        <div><dt>Unrealized P/L</dt><dd class="num ${plClass(stats.totalUnrealized)}">${formatSigned(stats.totalUnrealized)}</dd></div>
        <div><dt>Cohort return</dt><dd class="num ${plClass(stats.returnPct)}">${pct(stats.returnPct)}</dd></div>
        <div><dt>In profit</dt><dd class="num">${stats.breadthPct.toFixed(0)}%</dd></div>
        <div><dt>Best</dt><dd>${stats.best ? `${escapeHtml(stats.best.name)} <span class="num ${plClass(stats.best.pct)}">${pct(stats.best.pct)}</span>` : "—"}</dd></div>
        <div><dt>Spread</dt><dd class="num">${stats.spread.toFixed(2)}%</dd></div>
      </dl>
    </article>`;
}

/**
 * The BOTS vs HUMANS view — aggregates each cohort and compares the two. Surfaces aggregate-only
 * reads an individual can't show (cohort average, breadth in profit, dispersion) alongside the
 * head-to-head on total & average equity. Friendly league framing: it's a friendly rivalry, and
 * everyone doing well is the ideal. All snapshot-derived.
 */
export function renderCohortsBody(data: DashboardData, options: DashboardViewOptions = {}): string {
  const humans = cohortStats(data.participants, "human", "Humans");
  const bots = cohortStats(data.participants, "bot", "Bots");
  const humansNation = cohortSnapshot(data.participants, "human", "Humans");
  const botsNation = cohortSnapshot(data.participants, "bot", "Bots");
  const humansLeadTotal = humans.totalEquity >= bots.totalEquity;
  const avgLeader = humans.avgEquity >= bots.avgEquity ? "Humans" : "Bots";
  const avgGap = Math.abs(humans.avgEquity - bots.avgEquity);
  const totalGap = Math.abs(humans.totalEquity - bots.totalEquity);

  const content = `<section class="cohorts">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Bots vs Humans</h1>
        <p class="view-sub">A friendly rivalry — the whole league winning is the point.</p>
      </div>
    </div>
    <div class="versus">
      ${cohortCard(humans, humansLeadTotal, humansNation)}
      <div class="versus-mid"><span class="vs">VS</span></div>
      ${cohortCard(bots, !humansLeadTotal, botsNation)}
    </div>
    <div class="versus-read">
      <span><strong>${humansLeadTotal ? "Humans" : "Bots"}</strong> lead on total equity by <span class="num">${formatCurrency(totalGap)}</span></span>
      <span><strong>${avgLeader}</strong> lead on average equity by <span class="num">${formatCurrency(avgGap)}</span></span>
    </div>
  </section>
  <footer class="obs-foot">Read-only observatory · cohort aggregates over the last account read · unrealized P/L is mark-to-market vs. average cost.</footer>`;
  return renderShell(options.nav, content, data.generatedAt);
}

/** One lesson card for a play. `start` badges the very first rung (the cash-covered put). */
function lessonCard(play: Play, start: boolean): string {
  return `<article class="lesson${start ? " start" : ""}">
      ${start ? `<p class="start-tag">◈ START HERE</p>` : ""}
      <div class="lesson-top">
        <h4>${escapeHtml(play.name)}</h4>
        <span class="lesson-risk ${play.risk}">${play.risk === "defined" ? "Defined risk" : "Uncapped risk"}</span>
      </div>
      <p class="lesson-sum">${escapeHtml(play.summary)}</p>
      <dl>
        <dt>When to use</dt><dd>${escapeHtml(play.whenToUse)}</dd>
        <dt>Max profit</dt><dd class="pos">${escapeHtml(play.maxProfit)}</dd>
        <dt>Max loss</dt><dd class="neg">${escapeHtml(play.maxLoss)}</dd>
        <dt>What it teaches</dt><dd>${escapeHtml(play.teaches)}</dd>
      </dl>
    </article>`;
}

/**
 * The ACADEMY (`/learn`) — a tutorial that meets new traders where they are. It opens with an
 * options primer, then a RISK LADDER: level 1 (the cash-covered put) is unlocked from the start,
 * and each higher, riskier level stays gated until the learner graduates the one before it. The
 * gate is client-side progress (localStorage) for now; the `src/domain/plays.ts` catalog is the
 * shared source a future in-app play picker will enforce the same ladder against.
 */
export function renderAcademyBody(options: DashboardViewOptions = {}): string {
  const first = PLAYS.reduce((a, b) =>
    a.level < b.level || (a.level === b.level && a.order <= b.order) ? a : b,
  );
  const topLevel: PlayLevel = PLAY_LEVELS[PLAY_LEVELS.length - 1]?.level ?? 4;
  const ladder = PLAY_LEVELS.map((meta) => {
    const plays = PLAYS.filter((p) => p.level === meta.level).sort((a, b) => a.order - b.order);
    const open = meta.level === 1; // level 1 open by default; the script opens more as they unlock
    return `<details class="lvl${meta.level > 1 ? " locked" : ""}" data-level="${meta.level}"${open ? " open" : ""}>
      <summary>
        <span class="lvl-badge">${meta.level}</span>
        <span class="lvl-h"><h3>Level ${meta.level} · ${escapeHtml(meta.title)}</h3><p>${escapeHtml(meta.summary)}</p></span>
        <span class="lvl-lock" data-lock>${meta.level > 1 ? `🔒 Complete Level ${meta.level - 1}` : ""}</span>
        <span class="lvl-chev" aria-hidden="true">›</span>
      </summary>
      <div class="lessons">
        ${plays.map((p) => lessonCard(p, p.id === first.id)).join("\n        ")}
      </div>
      <div class="lvl-cta">${
        meta.level < topLevel
          ? `<button type="button" class="lvl-grad" data-grad="${meta.level}">I've got Level ${meta.level} — unlock the next →</button>`
          : `<span class="lvl-done">◆ Top of the ladder — you've graduated the full playbook.</span>`
      }</div>
    </details>`;
  }).join("\n    ");

  const content = `<section class="academy">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Learn options — one rung at a time</h1>
        <p class="view-sub">It's all paper money, so there's zero risk to learning. Start with the safest play and earn your way up.</p>
      </div>
    </div>
    <div class="primer">
      <h2>The basics, in one minute</h2>
      <div class="primer-grid">
        <div><p class="primer-term">Option</p><p class="primer-def">A contract to buy (a <b>call</b>) or sell (a <b>put</b>) a stock at a set price. You can buy one, or <b>sell</b> one to collect a premium.</p></div>
        <div><p class="primer-term">Strike</p><p class="primer-def">The agreed price in the contract. It's the level everything is measured against.</p></div>
        <div><p class="primer-term">Expiration</p><p class="primer-def">The date the contract settles. Options lose value as it nears — <b>time decay</b>.</p></div>
        <div><p class="primer-term">Premium</p><p class="primer-def">The price of the option. Sell one and you <b>collect</b> it; buy one and you <b>pay</b> it.</p></div>
        <div><p class="primer-term">Defined vs. uncapped risk</p><p class="primer-def"><b>Defined</b> means the worst case is known up front. <b>Uncapped</b> means a loss can keep growing — save those for last.</p></div>
        <div><p class="primer-term">Why start small</p><p class="primer-def">The plays below climb from safest to riskiest. Learn each rung before the next unlocks — that's how the pros build.</p></div>
      </div>
    </div>
    <div class="ladder">
    ${ladder}
    </div>
  </section>
  <footer class="obs-foot">Educational · paper trading only · nothing here is financial advice. Plays unlock as you graduate each level.</footer>
  ${ACADEMY_SCRIPT}`;
  return renderShell(options.nav, content, new Date().toISOString());
}

/**
 * Client-side progression: unlock levels as the learner graduates. localStorage remembers how far
 * they've climbed; no-JS still gets a fully readable page (every level is present, level 1 open).
 */
const ACADEMY_SCRIPT = `<script>
(function(){
  var KEY="skynet.academy.level";
  var levels=[].slice.call(document.querySelectorAll(".lvl"));
  if(!levels.length) return;
  function get(){ try{ return Math.max(1, parseInt(localStorage.getItem(KEY)||"1",10)||1); }catch(e){ return 1; } }
  function set(n){ try{ localStorage.setItem(KEY, String(n)); }catch(e){} }
  function sync(){ var u=get();
    levels.forEach(function(el){ var lv=parseInt(el.getAttribute("data-level"),10);
      var locked=lv>u; el.classList.toggle("locked", locked);
      var lock=el.querySelector("[data-lock]"); if(lock) lock.textContent=locked?("🔒 Complete Level "+(lv-1)):"";
      if(!locked && lv>1 && lv===u && !el.open) el.open=true;
    });
  }
  levels.forEach(function(el){
    var btn=el.querySelector("[data-grad]");
    if(btn) btn.addEventListener("click", function(){ var lv=parseInt(btn.getAttribute("data-grad"),10);
      if(get()<lv+1) set(lv+1); sync();
      var next=document.querySelector('.lvl[data-level="'+(lv+1)+'"]'); if(next){ next.open=true; next.scrollIntoView({behavior:"smooth",block:"start"}); }
    });
  });
  sync();
})();
</script>`;

function compareColumn(snapshot: ParticipantSnapshot): string {
  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  return `<div class="cmp-col">
      <div class="cmp-who"><a class="cmp-name" href="${profileHref(snapshot.id)}">${escapeHtml(
        snapshot.displayName,
      )}</a> ${chip(snapshot)}</div>
      <div class="cmp-equity num">${formatCurrency(snapshot.equity)}</div>
      <dl class="cmp-metrics">
        <div><dt>Cash</dt><dd class="num">${formatCurrency(snapshot.cash)}</dd></div>
        <div><dt>Invested</dt><dd class="num">${formatCurrency(invested)}</dd></div>
        <div><dt>Unrealized</dt><dd class="num ${plClass(pl)}">${formatSigned(pl)}</dd></div>
        <div><dt>Return</dt><dd class="num ${plClass(participantReturnPct(snapshot))}">${pct(
          participantReturnPct(snapshot),
        )}</dd></div>
      </dl>
    </div>`;
}

/** A signed delta row for the center column: which side leads on a metric, and by how much. */
function deltaRow(label: string, aVal: number, bVal: number, fmt: (n: number) => string): string {
  const d = aVal - bVal;
  const lead = d === 0 ? "—" : d > 0 ? "◀" : "▶";
  const cls = d === 0 ? "flat" : d > 0 ? "pos" : "neg";
  return `<div class="cmp-delta">
      <span class="cmp-dlabel">${label}</span>
      <span class="cmp-dval num ${cls}">${lead} ${escapeHtml(fmt(Math.abs(d)))}</span>
    </div>`;
}

/** Union of both sides' holdings — shared symbols first (heavier side marked), then the singles. */
function holdingsCompare(a: ParticipantSnapshot, b: ParticipantSnapshot): string {
  const byA = new Map(a.positions.map((p) => [p.symbol, p.marketValue]));
  const byB = new Map(b.positions.map((p) => [p.symbol, p.marketValue]));
  const symbols = [...new Set([...byA.keys(), ...byB.keys()])].sort(
    (x, y) => (byA.get(y) ?? 0) + (byB.get(y) ?? 0) - ((byA.get(x) ?? 0) + (byB.get(x) ?? 0)),
  );
  if (symbols.length === 0) return `<p class="empty">Neither holds an open position yet.</p>`;
  const rows = symbols
    .map((s) => {
      const av = byA.get(s);
      const bv = byB.get(s);
      const shared = av !== undefined && bv !== undefined;
      const heavier = (av ?? 0) === (bv ?? 0) ? "" : (av ?? 0) > (bv ?? 0) ? "aheavy" : "bheavy";
      return `<tr class="${shared ? "cmp-shared" : ""} ${heavier}">
        <td class="num cmp-aval">${av !== undefined ? formatCurrency(av) : "·"}</td>
        <td class="cmp-sym">${escapeHtml(s)}${shared ? ` <span class="cmp-tag">SHARED</span>` : ""}</td>
        <td class="num cmp-bval">${bv !== undefined ? formatCurrency(bv) : "·"}</td>
      </tr>`;
    })
    .join("");
  return `<table class="cmp-holdings"><tbody>${rows}</tbody></table>`;
}

/** A participant-picker used when /compare is missing a valid pair. */
function comparePicker(data: DashboardData, nav: NavContext | undefined, aId?: string): string {
  const live = data.participants.filter((p) => !p.error);
  const anchor = aId && live.find((p) => p.id === aId);
  const heading = anchor
    ? `Compare <strong>${escapeHtml(anchor.displayName)}</strong> with…`
    : nav?.currentId
      ? "Pick two to compare"
      : "Pick two to compare";
  const links = live
    .filter((p) => p.id !== aId)
    .map((p) => {
      const href = anchor
        ? `/compare?a=${encodeURIComponent(anchor.id)}&b=${encodeURIComponent(p.id)}`
        : `/compare?a=${encodeURIComponent(p.id)}`;
      return `<a class="cmp-pick" href="${href}">${escapeHtml(p.displayName)} ${chip(p)}</a>`;
    })
    .join("");
  return `<section class="cmp-wrap">
    <div class="ladder-head"><div><h1 class="view-title">Compare</h1><p class="view-sub">${heading}</p></div></div>
    <div class="cmp-picker">${links || `<p class="empty">No participants to compare yet.</p>`}</div>
  </section>`;
}

/**
 * The "two cities" band — each participant's holdings rendered as its own empire skyline,
 * side by side (see `docs/LIVING-UNIVERSE.md`), so commonality and contrast read at a glance.
 * Each city is labelled with its participant's displayName; stacks on narrow screens.
 */
function compareCities(a: ParticipantSnapshot, b: ParticipantSnapshot): string {
  const city = (p: ParticipantSnapshot): string =>
    `<div class="empire-city">
        <span class="empire-city-name">${escapeHtml(p.displayName)}</span>
        <div class="empire-band">${renderEmpireSkyline(p)}</div>
      </div>`;
  return `<div class="empire-cities">${city(a)}${city(b)}</div>`;
}

/**
 * The COMPARISON view — two participants side by side with a signed delta column and a holdings
 * overlap (shared symbols marked, heavier side highlighted). Snapshot-based today; deeper
 * "which plays worked / performed poorly" insights are a history-layer feature (seam shown below).
 */
export function renderCompareBody(
  data: DashboardData,
  options: DashboardViewOptions & { aId?: string; bId?: string } = {},
): string {
  const a = options.aId
    ? data.participants.find((p) => p.id === options.aId && !p.error)
    : undefined;
  const b = options.bId
    ? data.participants.find((p) => p.id === options.bId && !p.error)
    : undefined;
  if (!a || !b) {
    return renderShell(
      options.nav,
      comparePicker(data, options.nav, a?.id ?? options.aId),
      data.generatedAt,
    );
  }
  const content = `<section class="cmp-wrap">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">${escapeHtml(a.displayName)} <span class="cmp-vs">vs</span> ${escapeHtml(b.displayName)}</h1>
        <p class="view-sub">Head-to-head — snapshot standings and where the books overlap.</p>
      </div>
    </div>
    ${compareCities(a, b)}
    <div class="cmp-grid">
      ${compareColumn(a)}
      <div class="cmp-mid">
        ${deltaRow("Equity", a.equity, b.equity, formatCurrency)}
        ${deltaRow("Unrealized", participantUnrealized(a), participantUnrealized(b), formatSigned)}
        ${deltaRow("Return", participantReturnPct(a), participantReturnPct(b), pct)}
        <div class="cmp-legend"><span class="pos">◀</span> ${escapeHtml(a.displayName)} · <span class="neg">▶</span> ${escapeHtml(b.displayName)}</div>
      </div>
      ${compareColumn(b)}
    </div>
    <h2 class="col-head cmp-holdhead">Holdings overlap</h2>
    ${holdingsCompare(a, b)}
    <div class="history-seam">
      <span class="seam-label">Which plays worked</span>
      <p class="seam-note">Per-play effectiveness — who timed the entry, whose thesis held — lights up here once we've recorded trade history.</p>
    </div>
  </section>`;
  return renderShell(options.nav, content, data.generatedAt);
}

const STYLE = `<style>
  /* Dark-only by design — nations only compare cleanly when every cityscape is lit the same (no light mode). */
  :root{ color-scheme: dark; }
  .obs { --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg); color:var(--text); font-family:var(--sans);
    min-height:100vh; padding:28px clamp(16px,4vw,48px) 64px; box-sizing:border-box; }
  .obs *{ box-sizing:border-box; }
  .obs .num{ font-family:var(--mono); font-variant-numeric:tabular-nums; }
  .obs .pos{ color:var(--pos); } .obs .neg{ color:var(--neg); } .obs .flat{ color:var(--muted); }
  .obs-bar{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; padding-bottom:18px; border-bottom:1px solid var(--border); margin-bottom:24px; }
  .brand{ display:flex; flex-direction:column; gap:4px; }
  .brand .mark{ font-weight:700; font-size:20px; letter-spacing:.14em; }
  .brand .mark b{ color:var(--accent); font-weight:700; }
  .brand .sub{ font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--muted); }
  .obs-bar .meta{ display:flex; align-items:center; gap:12px; font-size:12px; color:var(--muted); }
  .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:3px 10px; }
  .meta .ts{ font-family:var(--mono); }
  .observer-hero{ margin:0 0 26px; padding:22px 24px; border:1px solid color-mix(in srgb, var(--accent) 45%, var(--border)); border-radius:14px;
    background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface-2)), var(--surface-2)); }
  .obs-eyebrow{ font-family:var(--mono); font-size:10px; letter-spacing:.24em; color:var(--accent); margin-bottom:8px; }
  .obs-title{ font-size:19px; letter-spacing:.01em; margin-bottom:8px; }
  .obs-sub{ color:var(--muted); font-size:13.5px; max-width:64ch; margin-bottom:14px; }
  .obs-ctas{ display:flex; gap:10px; flex-wrap:wrap; }
  .obs-cta{ display:inline-block; padding:9px 16px; border-radius:9px; border:1px solid var(--border); color:var(--text);
    text-decoration:none; font-family:var(--mono); font-size:12px; letter-spacing:.06em; transition:border-color .15s ease, background .15s ease; }
  .obs-cta:hover{ border-color:var(--accent); }
  .obs-cta-primary{ background:var(--accent); border-color:var(--accent); color:#06251F; font-weight:700; }
  .obs-cta-primary:hover{ filter:brightness(1.08); }
  .summary{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:28px; }
  .tile{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
  .tile-lead{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .tile-label{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .tile-num{ font-size:22px; font-weight:600; }
  .tile-lead .tile-num{ font-size:26px; }
  .tile .unit{ font-size:12px; color:var(--muted); font-family:var(--sans); }
  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
  .card{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 18px 8px; display:flex; flex-direction:column; }
  .card-head{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .card-head h3{ margin:0; font-size:15px; font-weight:600; flex:0 1 auto; }
  .chip{ font-family:var(--mono); font-size:10px; letter-spacing:.08em; padding:3px 8px; border-radius:6px; white-space:nowrap; }
  .chip-bot{ background:color-mix(in srgb,var(--accent) 16%,transparent); color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,transparent); }
  .chip-human{ background:color-mix(in srgb,var(--muted) 16%,transparent); color:var(--muted); border:1px solid color-mix(in srgb,var(--muted) 34%,transparent); }
  .dot{ width:8px; height:8px; border-radius:50%; margin-left:auto; flex:0 0 auto; }
  .dot-live{ background:var(--pos); box-shadow:0 0 0 3px color-mix(in srgb,var(--pos) 22%,transparent); }
  .dot-error{ background:var(--neg); box-shadow:0 0 0 3px color-mix(in srgb,var(--neg) 22%,transparent); }
  .equity{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:6px 0 14px; border-bottom:1px solid var(--border); }
  .equity-label{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .equity-num{ font-size:26px; font-weight:700; }
  .metrics{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:14px 0; }
  .metrics div{ display:flex; flex-direction:column; gap:3px; }
  .metrics dt{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
  .metrics dd{ margin:0; font-size:14px; font-weight:600; }
  .positions{ width:100%; border-collapse:collapse; font-size:13px; margin-top:4px; }
  .positions th{ text-align:left; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; padding:6px 8px; border-bottom:1px solid var(--border); }
  .positions td{ padding:7px 8px; border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); }
  .positions .num{ text-align:right; }
  .positions th.num{ text-align:right; }
  .positions .sym{ font-family:var(--mono); font-weight:600; }
  .positions tbody tr:last-child td{ border-bottom:none; }
  .empty{ color:var(--muted); font-size:13px; font-style:italic; padding:10px 2px 16px; }
  .activity{ margin-top:14px; padding-top:12px; border-top:1px solid var(--border); }
  .activity-head{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; }
  .tzlabel{ font-family:var(--mono); font-size:10px; letter-spacing:.04em; color:var(--muted); }
  .acttable{ width:100%; border-collapse:collapse; font-size:12px; }
  .acttable td{ padding:5px 6px; border-bottom:1px solid color-mix(in srgb,var(--border) 40%,transparent); vertical-align:middle; }
  .acttable tr:last-child td{ border-bottom:none; }
  .act-time{ color:var(--muted); white-space:nowrap; font-size:11px; }
  .act-trade .sym{ font-family:var(--mono); font-weight:600; }
  .act-status{ text-align:right; color:var(--muted); font-family:var(--mono); font-size:11px; }
  .acttable .num{ text-align:right; }
  .card-error{ border-color:color-mix(in srgb,var(--neg) 45%,var(--border)); }
  .error-msg{ color:var(--neg); font-size:13px; margin:2px 0 12px; }
  .obs-foot{ margin-top:32px; padding-top:16px; border-top:1px solid var(--border); font-size:11px; color:var(--muted); letter-spacing:.04em; }
  /* --- shared top nav --- */
  .obs-nav{ display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin:-8px 0 24px; }
  .navviews{ display:flex; gap:6px; flex-wrap:wrap; }
  .navlink{ font-family:var(--mono); font-size:12px; letter-spacing:.06em; color:var(--muted); text-decoration:none; padding:7px 12px; border-radius:8px; border:1px solid transparent; transition:color .15s, border-color .15s, background .15s; }
  .navlink:hover{ color:var(--text); background:color-mix(in srgb,var(--surface) 70%,transparent); }
  .navlink.active{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .navlink:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .navright{ display:flex; gap:8px; align-items:center; }
  .navmuted{ color:var(--muted); }
  .navcta{ font-family:var(--mono); font-size:12px; letter-spacing:.04em; color:var(--accent); text-decoration:none; padding:7px 13px; border-radius:8px; border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); background:color-mix(in srgb,var(--accent) 10%,transparent); }
  .navcta:hover{ background:color-mix(in srgb,var(--accent) 18%,transparent); }
  .navcta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  /* --- YOU marker + clickable / self cards --- */
  .you-mark{ font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:.14em; color:var(--bg); background:var(--accent); border-radius:5px; padding:2px 6px; }
  a.card{ text-decoration:none; color:inherit; transition:border-color .15s, transform .12s, box-shadow .15s; }
  a.card:hover{ border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); transform:translateY(-2px); box-shadow:0 10px 30px -14px rgba(0,0,0,.6); }
  a.card:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .card-self{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent) inset; }
  /* --- individual view --- */
  .backlink{ display:inline-block; font-family:var(--mono); font-size:12px; color:var(--muted); text-decoration:none; margin-bottom:18px; }
  .backlink:hover{ color:var(--accent); }
  .indiv-head{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:20px; }
  .indiv-eyebrow{ display:block; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .indiv-name{ margin:0; font-size:26px; font-weight:700; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .persona{ display:flex; flex-direction:column; gap:3px; text-align:right; }
  .persona-label{ font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .persona-id{ font-family:var(--mono); font-size:14px; color:var(--accent); }
  .persona-card{ background:var(--surface); border:1px solid var(--border); border-left:2px solid var(--accent); border-radius:12px; padding:14px 18px; margin-bottom:24px; }
  .persona-eyebrow{ display:block; font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); margin-bottom:6px; }
  .persona-thesis{ margin:0; font-size:14px; color:var(--text); line-height:1.5; }
  .persona-legend{ margin:8px 0 0; font-size:13px; color:var(--muted); line-height:1.5; font-style:italic; }
  .empire-band{ margin:0 0 24px; }
  .empire-skyline{ display:block; width:100%; height:auto; max-height:150px; border:1px solid var(--border); border-radius:10px; }
  /* glanceable per-card thumbnail — the board reads as a region of cities */
  .empire-thumb{ margin:0 0 14px; }
  .empire-thumb .empire-skyline{ max-height:88px; }
  /* two cities — a labelled empire skyline per participant, side by side on /compare */
  .empire-cities{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:0 0 26px; }
  .empire-city{ display:flex; flex-direction:column; gap:8px; min-width:0; }
  .empire-city .empire-band{ margin:0; }
  .empire-city-name{ font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  @media (max-width:720px){ .empire-cities{ grid-template-columns:1fr; } }
  .indiv-hero{ display:grid; grid-template-columns:minmax(220px,1fr) 2fr; gap:16px; margin-bottom:24px; align-items:stretch; }
  .hero-equity{ background:var(--surface); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); border-radius:14px; padding:20px 22px; display:flex; flex-direction:column; gap:8px; justify-content:center; }
  .hero-num{ font-size:40px; font-weight:700; line-height:1; }
  .hero-sub{ font-size:13px; font-weight:600; }
  .indiv-tiles{ margin-bottom:0; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); }
  .indiv-cols{ display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:8px; }
  .col-head{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-weight:600; margin:0 0 10px; display:flex; justify-content:space-between; align-items:center; }
  .history-seam{ margin-top:26px; padding:18px 20px; border:1px dashed color-mix(in srgb,var(--accent) 30%,var(--border)); border-radius:12px; background:color-mix(in srgb,var(--accent) 4%,transparent); }
  .seam-label{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }
  .seam-note{ margin:6px 0 0; font-size:13px; color:var(--muted); }
  .history-panel{ margin-top:26px; padding:18px 20px; border:1px solid var(--border); border-radius:12px; background:var(--surface); }
  .history-spark{ margin:12px 0 14px; }
  .equity-spark{ display:block; width:100%; height:64px; }
  .history-metrics{ grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); }
  @media (max-width:640px){ .indiv-hero{ grid-template-columns:1fr; } }
  /* --- leaderboard --- */
  .ladder-head{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:20px; }
  .view-title{ margin:0; font-size:24px; font-weight:700; }
  .view-sub{ margin:6px 0 0; font-size:13px; color:var(--muted); }
  .metricsel{ display:flex; gap:4px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:4px; }
  .msel{ font-family:var(--mono); font-size:12px; letter-spacing:.03em; color:var(--muted); text-decoration:none; padding:7px 12px; border-radius:7px; transition:color .15s, background .15s; }
  .msel:hover{ color:var(--text); }
  .msel.active{ color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); }
  .msel:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .ladder{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .rank-row{ display:grid; grid-template-columns:34px minmax(140px,1.4fr) 3fr auto; align-items:center; gap:14px; background:var(--surface); border:1px solid var(--border); border-radius:11px; padding:12px 16px; }
  .rank-self{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent) inset; }
  .rank{ font-family:var(--mono); font-size:14px; font-weight:700; color:var(--muted); text-align:center; }
  .rank-top .rank{ color:var(--accent); }
  .rank-1 .rank{ font-size:17px; }
  .rank-name{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; color:inherit; text-decoration:none; font-weight:600; font-size:15px; }
  .rank-name:hover{ color:var(--accent); }
  .rank-name:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; border-radius:4px; }
  .rank-bar{ height:8px; background:color-mix(in srgb,var(--border) 60%,transparent); border-radius:999px; overflow:hidden; }
  .rank-bar i{ display:block; height:100%; border-radius:999px; }
  .bar-flat{ background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 40%,transparent),var(--accent)); }
  .bar-pos{ background:linear-gradient(90deg,color-mix(in srgb,var(--pos) 40%,transparent),var(--pos)); }
  .bar-neg{ background:linear-gradient(90deg,color-mix(in srgb,var(--neg) 40%,transparent),var(--neg)); }
  .rank-val{ font-size:15px; font-weight:700; text-align:right; min-width:96px; }
  @media (max-width:560px){ .rank-row{ grid-template-columns:28px 1fr auto; } .rank-bar{ display:none; } }
  /* --- push-drawer app shell --- */
  .app{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    display:flex; min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--sans); }
  .app *{ box-sizing:border-box; }
  .drawer{ flex:0 0 250px; width:250px; height:100vh; position:sticky; top:0; overflow-y:auto; overflow-x:hidden;
    background:var(--surface-2); border-right:1px solid var(--border); display:flex; flex-direction:column; gap:10px; padding:20px 14px;
    transition:flex-basis .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1), padding .28s, border-color .28s; white-space:nowrap; }
  .app[data-drawer="closed"] .drawer{ flex-basis:0; width:0; padding-left:0; padding-right:0; border-right-color:transparent; }
  .drawer-brand{ display:flex; flex-direction:column; gap:3px; padding:6px 10px 14px; margin-bottom:4px; border-bottom:1px solid var(--border); }
  .drawer-brand .mark{ font-weight:700; font-size:15px; letter-spacing:.13em; }
  .drawer-brand .mark b{ color:var(--accent); }
  .drawer-brand .sub{ font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:var(--muted); }
  .drawer-nav{ display:flex; flex-direction:column; gap:3px; }
  /* Drawer sections use the participant-card language — bordered containers with a titled header —
     so the nav reads as the same design system and new sections stack without a redesign. */
  .dcard{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:8px 7px; }
  .dcard-title{ margin:0; font-family:var(--mono); font-weight:600; font-size:9.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); padding:3px 7px 8px; }
  .dnav-link,.dnav-cta{ display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:9px; text-decoration:none; color:var(--muted); font-size:13px; font-weight:600; transition:color .15s, background .15s; }
  .dnav-link:hover{ color:var(--text); background:color-mix(in srgb,var(--surface) 80%,transparent); }
  .dnav-link.active{ color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); }
  .dnav-link:focus-visible,.dnav-cta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .dnav-muted{ color:color-mix(in srgb,var(--muted) 85%,transparent); }
  .dnav-cta{ color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,var(--border)); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .dnav-cta:hover{ background:color-mix(in srgb,var(--accent) 16%,transparent); }
  .dnav-ico{ width:18px; text-align:center; font-size:13px; flex:0 0 auto; }
  .stage{ flex:1 1 auto; min-width:0; height:100vh; overflow-y:auto; position:relative; }
  .stage-inner{ padding:60px clamp(16px,4vw,44px) 60px; }
  .stage-inner .obs{ min-height:0; padding:0; background:none; }
  .stage-meta{ display:flex; justify-content:flex-end; align-items:center; gap:12px; font-size:12px; color:var(--muted); margin-bottom:20px; }
  .stage-meta .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:3px 10px; }
  .drawer-toggle{ position:absolute; top:16px; left:16px; z-index:5; width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--muted); cursor:pointer; font-size:13px; line-height:1; display:flex; align-items:center; justify-content:center; transition:color .15s, border-color .15s; }
  .drawer-toggle:hover{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .drawer-toggle:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .drawer-toggle span{ display:inline-block; transition:transform .28s; }
  .app[data-drawer="closed"] .drawer-toggle span{ transform:rotate(180deg); }
  @media (max-width:760px){
    .drawer{ position:fixed; left:0; top:0; z-index:30; flex-basis:250px; width:250px; box-shadow:0 0 40px -8px rgba(0,0,0,.6); transition:transform .28s cubic-bezier(.4,0,.2,1); }
    .app[data-drawer="closed"] .drawer{ transform:translateX(-100%); flex-basis:0; width:250px; padding:20px 14px; border-right-color:var(--border); }
    .app[data-drawer="open"] .drawer{ transform:translateX(0); }
    .app{ display:block; } .stage{ height:auto; min-height:100vh; }
  }
  @media (prefers-reduced-motion:reduce){ .drawer,.drawer-toggle span{ transition:none; } }
  /* --- bots vs humans --- */
  .versus{ display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch; gap:16px; margin-bottom:18px; }
  .cohort{ background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:22px 22px 10px; display:flex; flex-direction:column; }
  .cohort-lead{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 20%,transparent) inset; }
  .cohort-head{ display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .cohort-count{ font-size:13px; color:var(--muted); }
  .cohort-count .unit{ font-size:11px; }
  .cohort-badge{ margin-left:auto; font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:.14em; color:var(--bg); background:var(--accent); border-radius:5px; padding:3px 7px; }
  .cohort-equity{ font-size:34px; font-weight:700; line-height:1; }
  .cohort-eqlabel{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:6px 0 18px; }
  /* the cohort as one nation — members' holdings aggregated into a single country skyline */
  .cohort-nation{ margin:0 0 18px; }
  .cohort-metrics{ display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; margin:0; }
  .cohort-metrics div{ display:flex; flex-direction:column; gap:4px; }
  .cohort-metrics dt{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .cohort-metrics dd{ margin:0; font-size:15px; font-weight:600; }
  .versus-mid{ display:flex; align-items:center; justify-content:center; }
  .vs{ font-family:var(--mono); font-size:13px; font-weight:700; letter-spacing:.1em; color:var(--muted); border:1px solid var(--border); border-radius:999px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; }
  .versus-read{ display:flex; flex-wrap:wrap; gap:10px 28px; padding:16px 20px; background:var(--surface-2); border:1px solid var(--border); border-radius:12px; font-size:14px; color:var(--muted); }
  .versus-read strong{ color:var(--text); }
  @media (max-width:720px){ .versus{ grid-template-columns:1fr; } .versus-mid{ padding:4px 0; } }
  /* --- comparison --- */
  .cmp-vs{ color:var(--muted); font-weight:500; font-size:18px; }
  .cmp-grid{ display:grid; grid-template-columns:1fr minmax(160px,auto) 1fr; gap:16px; align-items:start; margin-bottom:26px; }
  .cmp-col{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:20px; }
  .cmp-who{ display:flex; align-items:center; gap:9px; margin-bottom:12px; flex-wrap:wrap; }
  .cmp-name{ font-size:16px; font-weight:700; color:var(--text); text-decoration:none; }
  .cmp-name:hover{ color:var(--accent); }
  .cmp-equity{ font-size:28px; font-weight:700; margin-bottom:14px; }
  .cmp-metrics{ display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; margin:0; }
  .cmp-metrics div{ display:flex; flex-direction:column; gap:3px; }
  .cmp-metrics dt{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .cmp-metrics dd{ margin:0; font-size:14px; font-weight:600; }
  .cmp-mid{ display:flex; flex-direction:column; gap:10px; padding:16px 12px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px; }
  .cmp-delta{ display:flex; flex-direction:column; gap:2px; text-align:center; }
  .cmp-dlabel{ font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
  .cmp-dval{ font-size:14px; font-weight:700; }
  .cmp-legend{ margin-top:4px; font-size:10px; color:var(--muted); text-align:center; }
  .cmp-holdhead{ margin-top:6px; }
  .cmp-holdings{ width:100%; border-collapse:collapse; font-size:14px; }
  .cmp-holdings td{ padding:9px 10px; border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); }
  .cmp-holdings tr:last-child td{ border-bottom:none; }
  .cmp-sym{ text-align:center; font-family:var(--mono); font-weight:600; }
  .cmp-aval{ text-align:right; } .cmp-bval{ text-align:left; }
  .cmp-tag{ font-family:var(--mono); font-size:8px; letter-spacing:.1em; color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,transparent); border-radius:4px; padding:1px 5px; margin-left:6px; vertical-align:middle; }
  .cmp-shared{ background:color-mix(in srgb,var(--accent) 5%,transparent); }
  .aheavy .cmp-aval{ color:var(--accent); font-weight:700; } .bheavy .cmp-bval{ color:var(--accent); font-weight:700; }
  .cmp-picker{ display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
  .cmp-pick{ display:flex; align-items:center; gap:9px; padding:14px 16px; background:var(--surface); border:1px solid var(--border); border-radius:11px; text-decoration:none; color:var(--text); font-weight:600; transition:border-color .15s; }
  .cmp-pick:hover{ border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  @media (max-width:720px){ .cmp-grid{ grid-template-columns:1fr; } }
  /* --- Academy (/learn): the risk ladder + tutorial --- */
  .academy{ max-width:920px; }
  .primer{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px 24px; margin-bottom:26px; }
  .primer h2{ font-size:15px; margin-bottom:14px; letter-spacing:.02em; }
  .primer-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
  .primer-term{ font-family:var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); margin-bottom:5px; }
  .primer-def{ font-size:13px; color:var(--muted); line-height:1.55; }
  .primer-def b{ color:var(--text); }
  .ladder{ display:flex; flex-direction:column; gap:16px; }
  .lvl{ border:1px solid var(--border); border-radius:14px; background:var(--surface-2); overflow:hidden; }
  .lvl[open]{ border-color:color-mix(in srgb,var(--accent) 35%,var(--border)); }
  .lvl.locked{ opacity:.62; }
  .lvl > summary{ list-style:none; cursor:pointer; display:flex; align-items:center; gap:14px; padding:16px 20px; }
  .lvl > summary::-webkit-details-marker{ display:none; }
  .lvl-badge{ flex:0 0 auto; width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    font-family:var(--mono); font-weight:700; font-size:15px; color:var(--bg); background:var(--accent); }
  .lvl.locked .lvl-badge{ background:var(--muted); }
  .lvl-h{ flex:1; }
  .lvl-h h3{ font-size:15px; font-weight:700; }
  .lvl-h p{ font-size:12.5px; color:var(--muted); margin-top:2px; }
  .lvl-lock{ font-family:var(--mono); font-size:10px; letter-spacing:.1em; color:var(--muted); white-space:nowrap; }
  .lvl-chev{ color:var(--muted); transition:transform .2s; } .lvl[open] .lvl-chev{ transform:rotate(90deg); }
  .lessons{ padding:4px 20px 20px; display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .lesson{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; position:relative; }
  .lesson.start{ border-color:var(--accent); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent); }
  .lesson-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; }
  .lesson h4{ font-size:15px; font-weight:700; }
  .lesson-risk{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; padding:2px 7px; border-radius:999px; border:1px solid var(--border); color:var(--muted); }
  .lesson-risk.undefined{ color:var(--neg); border-color:color-mix(in srgb,var(--neg) 55%,var(--border)); }
  .lesson-risk.defined{ color:var(--pos); border-color:color-mix(in srgb,var(--pos) 45%,var(--border)); }
  .start-tag{ font-family:var(--mono); font-size:9px; letter-spacing:.14em; color:var(--accent); margin-bottom:8px; }
  .lesson-sum{ font-size:13px; color:var(--text); line-height:1.5; margin-bottom:10px; }
  .lesson dl{ margin:0; }
  .lesson dt{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-top:9px; }
  .lesson dd{ margin:2px 0 0; font-size:12.5px; color:var(--muted); line-height:1.5; }
  .lesson dd.pos{ color:color-mix(in srgb,var(--pos) 85%,var(--text)); } .lesson dd.neg{ color:color-mix(in srgb,var(--neg) 85%,var(--text)); }
  .lvl-cta{ margin:0 20px 20px; }
  .lvl-grad{ display:inline-flex; align-items:center; gap:8px; padding:10px 16px; font-family:var(--sans); font-size:13px; font-weight:700;
    color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; }
  .lvl-grad:hover{ filter:brightness(1.08); } .lvl-grad:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .lvl-done{ font-family:var(--mono); font-size:11px; letter-spacing:.08em; color:var(--pos); }
  @media (max-width:720px){ .lessons{ grid-template-columns:1fr; } }
</style>`;

/**
 * The BOARD content (summary strip + participant grid + footer) — the piece the SSE stream swaps
 * into #root on every hub update. Kept separate from the shell so live refresh never re-renders the
 * drawer or resets its open/closed state.
 */
export function renderBoardContent(
  data: DashboardData,
  options: DashboardViewOptions = {},
): string {
  const currentId = options.nav?.currentId;
  const ordered = orderParticipants([...data.participants], currentId);
  const prominence = botLandmarkProminence(data.participants);
  const cards = ordered
    .map((p) => {
      const prom = prominence.get(p.id);
      return participantCard(p, {
        isSelf: Boolean(currentId) && p.id === currentId,
        link: Boolean(options.nav),
        ...(prom !== undefined ? { prominence: prom } : {}),
      });
    })
    .join("\n    ");
  // OBSERVER MODE — the funnel's front door (stage 1 → 2): signed in but no linked account means you
  // can watch the whole league yet hold no tower. Say so, warmly, and pave the founding path.
  const observer =
    Boolean(options.nav) && !currentId
      ? `<section class="observer-hero">
    <p class="obs-eyebrow">◈ OBSERVER MODE</p>
    <h2 class="obs-title">You're watching the league — your empire awaits its founding.</h2>
    <p class="obs-sub">Every tower below belongs to a member or their bot. Connect a free Alpaca paper account to take the field: your own city on the board, your plays, your seat in the race.</p>
    <div class="obs-ctas"><a class="obs-cta obs-cta-primary" href="/welcome">Get set up — the guided path</a><a class="obs-cta" href="/add">I have my keys — found my empire</a></div>
  </section>
  `
      : "";
  return `${observer}${summaryStrip(data)}
  <section class="grid">
    ${cards}
  </section>
  <footer class="obs-foot">Read-only observatory · figures reflect the last account read · unrealized P/L is mark-to-market vs. average cost.</footer>`;
}

export function renderDashboardBody(
  data: DashboardData,
  options: DashboardViewOptions = {},
): string {
  return renderShell(options.nav, renderBoardContent(data, options), data.generatedAt);
}

export function renderDashboardDocument(data: DashboardData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory</title>
<style>*{margin:0;padding:0}body{margin:0}</style>
</head>
<body>
${renderDashboardBody(data)}
</body>
</html>`;
}
