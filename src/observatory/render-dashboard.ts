import type { DashboardData } from "./dashboard-data.js";
import type { ActivityView, ParticipantSnapshot, PositionView } from "./participant-snapshot.js";

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
export type NavView = "board" | "leaderboard" | "bots" | "you" | "add";

export interface NavContext {
  readonly active: NavView;
  /** The signed-in viewer's participant id, if resolved — powers the "You" tab + self marker. */
  readonly currentId?: string;
  readonly canAdd: boolean;
  readonly authed: boolean;
  /** Views ship incrementally; only link the ones that exist so merged states have no dead links. */
  readonly hasLeaderboard?: boolean;
  readonly hasBots?: boolean;
}

export interface DashboardViewOptions {
  /** Render the shared top nav (logged-in shell). Omit for the bare embeddable body. */
  readonly nav?: NavContext;
}

function navLink(href: string, label: string, active: boolean): string {
  return `<a class="navlink${active ? " active" : ""}" href="${href}"${
    active ? ' aria-current="page"' : ""
  }>${label}</a>`;
}

/** The shared top navigation — one row of view links, an Add/Sign-out cluster on the right. */
function renderNav(nav: NavContext): string {
  const you = nav.currentId ? navLink(profileHref(nav.currentId), "You", nav.active === "you") : "";
  const right: string[] = [];
  if (nav.canAdd) {
    right.push(
      `<a class="navcta" href="/add">${nav.currentId ? "+ Add account" : "+ Connect your account"}</a>`,
    );
  }
  if (nav.authed) {
    right.push(`<a class="navlink navmuted" href="/logout">Sign out</a>`);
  }
  const leaderboard = nav.hasLeaderboard
    ? navLink("/leaderboard", "Leaderboard", nav.active === "leaderboard")
    : "";
  const bots = nav.hasBots
    ? navLink("/bots-vs-humans", "Bots vs Humans", nav.active === "bots")
    : "";
  return `<nav class="obs-nav" aria-label="Views">
      <div class="navviews">
        ${navLink("/", "Board", nav.active === "board")}
        ${leaderboard}
        ${bots}
        ${you}
      </div>
      <div class="navright">${right.join("")}</div>
    </nav>`;
}

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

/** Header block: brand mark + optional nav + PAPER·SANDBOX tag + timestamp. */
function obsHeader(generatedAt: string, nav?: NavContext): string {
  return `<header class="obs-bar">
    <div class="brand">
      <span class="mark">SKYNET<b>·</b>CAPITAL</span>
      <span class="sub">Observatory</span>
    </div>
    <div class="meta">
      <span class="tag">PAPER · SANDBOX</span>
      <span class="ts">${escapeHtml(formatTimestamp(generatedAt))}</span>
    </div>
  </header>
  ${nav ? renderNav(nav) : ""}`;
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
  options: DashboardViewOptions & { isSelf?: boolean; generatedAt?: string } = {},
): string {
  const isSelf = Boolean(options.isSelf);
  const asOf = options.generatedAt ?? new Date().toISOString();
  const who = isSelf ? "Your desk" : `${escapeHtml(snapshot.displayName)}'s desk`;
  const persona =
    snapshot.kind === "bot" && snapshot.personaId
      ? `<div class="persona"><span class="persona-label">Strategy</span><span class="persona-id">${escapeHtml(
          snapshot.personaId,
        )}</span></div>`
      : "";

  if (snapshot.error) {
    return `${STYLE}
<div class="obs">
  ${obsHeader(asOf, options.nav)}
  <a class="backlink" href="/">← Board</a>
  <section class="indiv indiv-error">
    <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}</h1>
    <p class="error-msg">Account unreachable — check this participant's API keys.</p>
  </section>
</div>`;
  }

  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  const buyingPower = snapshot.cash;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  return `${STYLE}
<div class="obs">
  ${obsHeader(asOf, options.nav)}
  <a class="backlink" href="/">← Board</a>
  <section class="indiv">
    <header class="indiv-head">
      <div class="indiv-title">
        <span class="indiv-eyebrow">${who}</span>
        <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}${
          isSelf ? `<span class="you-mark">YOU</span>` : ""
        }</h1>
      </div>
      ${persona}
    </header>
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
    <div class="history-seam">
      <span class="seam-label">Performance history</span>
      <p class="seam-note">Equity over time, realized P/L, and per-play win rate light up here once we've recorded your history.</p>
    </div>
  </section>
</div>`;
}

const STYLE = `<style>
  .obs { --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg); color:var(--text); font-family:var(--sans);
    min-height:100vh; padding:28px clamp(16px,4vw,48px) 64px; box-sizing:border-box; }
  @media (prefers-color-scheme:light){ .obs{ --bg:#F7F9FB; --surface:#FFFFFF; --surface-2:#F0F4F8; --border:#DCE3EA; --text:#0B0F14; --muted:#5A6B7B; --accent:#0E9F8C; --pos:#1A7F37; --neg:#CF222E; } }
  :root[data-theme="dark"] .obs{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149; }
  :root[data-theme="light"] .obs{ --bg:#F7F9FB; --surface:#FFFFFF; --surface-2:#F0F4F8; --border:#DCE3EA; --text:#0B0F14; --muted:#5A6B7B; --accent:#0E9F8C; --pos:#1A7F37; --neg:#CF222E; }
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
  @media (max-width:640px){ .indiv-hero{ grid-template-columns:1fr; } }
</style>`;

export function renderDashboardBody(
  data: DashboardData,
  options: DashboardViewOptions = {},
): string {
  const currentId = options.nav?.currentId;
  const ordered = orderParticipants([...data.participants], currentId);
  const cards = ordered
    .map((p) =>
      participantCard(p, {
        isSelf: Boolean(currentId) && p.id === currentId,
        link: Boolean(options.nav),
      }),
    )
    .join("\n    ");
  return `${STYLE}
<div class="obs">
  ${obsHeader(data.generatedAt, options.nav)}
  ${summaryStrip(data)}
  <section class="grid">
    ${cards}
  </section>
  <footer class="obs-foot">Read-only observatory · figures reflect the last account read · unrealized P/L is mark-to-market vs. average cost.</footer>
</div>`;
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
