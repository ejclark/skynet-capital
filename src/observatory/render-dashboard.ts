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

function participantCard(snapshot: ParticipantSnapshot): string {
  if (snapshot.error) {
    return `<article class="card card-error">
      <header class="card-head">
        <h3>${escapeHtml(snapshot.displayName)}</h3>
        ${chip(snapshot)}
        <span class="dot dot-error" title="account unreachable"></span>
      </header>
      <p class="error-msg">Account unreachable — check this participant's API keys.</p>
    </article>`;
  }

  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  return `<article class="card">
      <header class="card-head">
        <h3>${escapeHtml(snapshot.displayName)}</h3>
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
    </article>`;
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
</style>`;

export function renderDashboardBody(data: DashboardData): string {
  return `${STYLE}
<div class="obs">
  <header class="obs-bar">
    <div class="brand">
      <span class="mark">SKYNET<b>·</b>CAPITAL</span>
      <span class="sub">Observatory</span>
    </div>
    <div class="meta">
      <span class="tag">PAPER · SANDBOX</span>
      <span class="ts">${escapeHtml(formatTimestamp(data.generatedAt))}</span>
    </div>
  </header>
  ${summaryStrip(data)}
  <section class="grid">
    ${data.participants.map(participantCard).join("\n    ")}
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
