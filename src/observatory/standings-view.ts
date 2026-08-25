import { escapeHtml } from "../ui/escape-html.js";
import type { DashboardData } from "./dashboard-data.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import {
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { chip, formatCurrency, formatSigned, pct, plClass, profileHref } from "./render-atoms.js";

/**
 * STANDINGS (`/`) — the whole race on one board, replacing the old Board + Leaderboard + Bots vs
 * Humans (folded 2026-08-25; Compare joins in the next slice). Three tiers, richest first:
 *   1. The MATCH — the two cohorts (bots vs humans) head to head, split by average equity so a
 *      larger cohort can't win on headcount alone.
 *   2. Cohort cards — the aggregate read for each side (avg equity, unrealized P/L, breadth,
 *      best performer, spread). No nation skyline here — that flourish stays on an individual's
 *      own desk; a comparison view wants density, not decoration (design brief, 2026-08-25).
 *   3. THE FIELD — every participant ranked by a selectable metric (`?by=`), a dense ladder
 *      rather than the old card grid. Per-participant detail (activity feed, positions) lives on
 *      that participant's own `/u/:id` desk, not duplicated here.
 *
 * `renderStandingsContent` is the piece the SSE stream (`/events`) swaps into `#root` on every hub
 * update — kept separate from the shell so live refresh never resets the drawer. Live pushes
 * thread the connecting request's own `?by=` back through (`dashboard-server.ts`'s `streamEvents`),
 * so a viewer who picked Return % doesn't get silently reset to Equity on the next push.
 */

/** Metrics the field can rank by — all snapshot-derived (no history needed). */
export type LeaderMetric = "equity" | "pl" | "return" | "realized";

const LEADER_METRICS: ReadonlyArray<{ key: LeaderMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
  { key: "realized", label: "Realized P/L" },
];

/** Parse the `?by=` param, defaulting to equity for anything unrecognized. */
export function parseLeaderMetric(raw: string | null | undefined): LeaderMetric {
  return raw === "pl" || raw === "return" || raw === "realized" ? raw : "equity";
}

function metricValue(snapshot: ParticipantSnapshot, metric: LeaderMetric): number {
  const pl = participantUnrealized(snapshot);
  if (metric === "pl") return pl;
  if (metric === "realized") return snapshot.realizedPl ?? 0;
  if (metric === "return") {
    const invested = participantInvested(snapshot);
    return invested > 0 ? (pl / invested) * 100 : 0;
  }
  return snapshot.equity;
}

function formatMetric(value: number, metric: LeaderMetric): string {
  if (metric === "return") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  if (metric === "pl" || metric === "realized") return formatSigned(value);
  return formatCurrency(value);
}

/** The right-aligned segmented metric picker — plain links, so it's shareable with no JS. */
function metricPicker(metric: LeaderMetric): string {
  return LEADER_METRICS.map(
    (m) =>
      `<a class="msel${m.key === metric ? " active" : ""}" href="/?by=${m.key}">${m.label}</a>`,
  ).join("");
}

/** THE FIELD — every live participant, ranked by the selected metric. */
function fieldLadder(
  data: DashboardData,
  metric: LeaderMetric,
  currentId: string | undefined,
): string {
  const live = data.participants.filter((p) => !p.error);
  const ranked = [...live].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  const maxAbs = ranked.reduce((m, p) => Math.max(m, Math.abs(metricValue(p, metric))), 0) || 1;

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

  return `<ol class="ladder">
      ${rows || `<li class="empty">No participants on the board yet.</li>`}
    </ol>
  <footer class="obs-foot">Read-only observatory · ranked by ${escapeHtml(
    LEADER_METRICS.find((m) => m.key === metric)?.label ?? "equity",
  )} · figures reflect the last account read.</footer>`;
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

function cohortCard(stats: CohortStats, leads: boolean): string {
  const chipCls = stats.kind === "bot" ? "chip-bot" : "chip-human";
  return `<article class="cohort ${leads ? "cohort-lead" : ""}">
      <header class="cohort-head">
        <span class="chip ${chipCls}">${stats.label.toUpperCase()}</span>
        <span class="cohort-count num">${stats.count}<span class="unit"> account${stats.count === 1 ? "" : "s"}</span></span>
        ${leads ? `<span class="cohort-badge">LEADS</span>` : ""}
      </header>
      <div class="cohort-equity num">${formatCurrency(stats.totalEquity)}</div>
      <div class="cohort-eqlabel">total equity</div>
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
 * THE MATCH scoreboard — a live tug-of-war bar the two cohorts contest. Split is by AVERAGE equity
 * per account (not total), so a larger cohort can't win the bar on headcount alone — it moves only
 * as one side's per-account performance pulls ahead. Pure/snapshot-derived.
 */
function matchBar(humans: CohortStats, bots: CohortStats): string {
  const sum = humans.avgEquity + bots.avgEquity;
  const humanShare = sum > 0 ? humans.avgEquity / sum : 0.5;
  const humanPct = Math.round(humanShare * 100);
  const botPct = 100 - humanPct;
  const leader = humans.avgEquity === bots.avgEquity ? null : humans.avgEquity > bots.avgEquity;
  const leadLabel =
    leader === null
      ? "Dead even — the match is tied"
      : `<strong>${leader ? "Humans" : "Bots"}</strong> lead the match · ${
          leader ? humanPct : botPct
        }% of the field`;
  return `<section class="match" aria-label="Bots vs Humans live match standings">
      <div class="match-top"><span class="match-eyebrow">◈ THE MATCH · LIVE</span><span class="match-metric">avg equity per account</span></div>
      <div class="match-bar" role="img" aria-label="Humans ${humanPct}% versus Bots ${botPct}%">
        <div class="match-seg match-human" style="width:${humanPct}%"><span class="match-seg-label">Humans ${humanPct}%</span></div>
        <div class="match-seg match-bot" style="width:${botPct}%"><span class="match-seg-label">${botPct}% Bots</span></div>
        <div class="match-divider" style="left:${humanPct}%"></div>
      </div>
      <p class="match-read">${leadLabel}</p>
    </section>`;
}

/** The two cohort cards side by side with the centered head-to-head read line beneath. */
function cohortSection(data: DashboardData): string {
  const humans = cohortStats(data.participants, "human", "Humans");
  const bots = cohortStats(data.participants, "bot", "Bots");
  const humansLeadTotal = humans.totalEquity >= bots.totalEquity;
  const avgLeader = humans.avgEquity >= bots.avgEquity ? "Humans" : "Bots";
  const avgGap = Math.abs(humans.avgEquity - bots.avgEquity);
  const totalGap = Math.abs(humans.totalEquity - bots.totalEquity);
  return `${matchBar(humans, bots)}
    <div class="versus">
      ${cohortCard(humans, humansLeadTotal)}
      <div class="versus-mid"><span class="vs">VS</span></div>
      ${cohortCard(bots, !humansLeadTotal)}
    </div>
    <div class="versus-read">
      <span><strong>${humansLeadTotal ? "Humans" : "Bots"}</strong> lead on total equity by <span class="num">${formatCurrency(totalGap)}</span></span>
      <span><strong>${avgLeader}</strong> lead on average equity by <span class="num">${formatCurrency(avgGap)}</span></span>
    </div>`;
}

/**
 * The STANDINGS content — the piece the SSE stream swaps into `#root` on every hub update. Kept
 * separate from the shell so live refresh never re-renders the drawer or resets its open/closed
 * state.
 */
export function renderStandingsContent(
  data: DashboardData,
  options: DashboardViewOptions & { metric?: LeaderMetric } = {},
): string {
  const metric = options.metric ?? "equity";
  const currentId = options.nav?.currentId;
  // OBSERVER MODE — the funnel's front door (stage 1 → 2): signed in but no linked account means
  // you can watch the whole league yet hold no tower. Say so, warmly, and pave the founding path.
  const observer =
    options.nav && !currentId
      ? `<section class="observer-hero">
    <p class="obs-eyebrow">◈ OBSERVER MODE</p>
    <h2 class="obs-title">You're watching the league — your empire awaits its founding.</h2>
    <p class="obs-sub">Every account below belongs to a member or their bot. Connect a free Alpaca paper account to take the field: your own city on the board, your plays, your seat in the race.</p>
    <div class="obs-ctas"><a class="obs-cta obs-cta-primary" href="/welcome">Get set up — the guided path</a><a class="obs-cta" href="/add">I have my keys — found my empire</a></div>
  </section>
  `
      : "";
  return `${observer}<div class="ladder-head">
      <div>
        <h1 class="view-title">Standings</h1>
        <p class="view-sub">The whole race on one board — a friendly league, bots and humans both welcome to win.</p>
      </div>
      <div class="metricsel">${metricPicker(metric)}</div>
    </div>
    ${cohortSection(data)}
    ${fieldLadder(data, metric, currentId)}`;
}

export function renderStandingsBody(
  data: DashboardData,
  options: DashboardViewOptions & { metric?: LeaderMetric } = {},
): string {
  return renderShell(options.nav, renderStandingsContent(data, options), data.generatedAt);
}

export function renderStandingsDocument(data: DashboardData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory</title>
<style>*{margin:0;padding:0}body{margin:0}</style>
</head>
<body>
${renderStandingsBody(data)}
</body>
</html>`;
}
