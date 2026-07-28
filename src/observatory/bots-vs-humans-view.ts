import { escapeHtml } from "../ui/escape-html.js";
import type { DashboardData } from "./dashboard-data.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import {
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "./participant-card.js";
import type { ParticipantSnapshot, PositionView } from "./participant-snapshot.js";
import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";

/**
 * The BOTS vs HUMANS view — aggregates each cohort and compares the two. Surfaces aggregate-only
 * reads an individual can't show (cohort average, breadth in profit, dispersion) alongside the
 * head-to-head on total & average equity. Friendly league framing: it's a friendly rivalry, and
 * everyone doing well is the ideal. All snapshot-derived.
 */

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
 * The MATCH scoreboard — a live tug-of-war bar the two cohorts contest. Split is by AVERAGE equity
 * per account (not total), so a larger cohort can't win the bar on headcount alone — it moves only as
 * one side's per-account performance pulls ahead. Both cohorts start near parity (equal paper stakes),
 * so the divider drifts off-center exactly as the race is won. Pure/snapshot-derived.
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
    ${matchBar(humans, bots)}
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
