import type { DecisionRecord } from "../autonomous/decision-record.js";
import { COURSES, type Course, type Milestone, RANKS, totalPoints } from "../domain/curriculum.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { DashboardData } from "./dashboard-data.js";
import {
  type DashboardViewOptions,
  type NavContext,
  type NavView,
  renderShell,
} from "./dashboard-shell.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import { equityChange, equityDrawdown, renderEquitySparkline } from "./equity-sparkline.js";
import type { EquitySample } from "./history-store.js";
import {
  activityFeed,
  participantCard,
  participantInvested,
  participantUnrealized,
  positionsTable,
} from "./participant-card.js";
import type { ParticipantSnapshot, PositionView } from "./participant-snapshot.js";
import { personaLore } from "./persona-lore.js";
import {
  chip,
  formatCurrency,
  formatSigned,
  formatTimestamp,
  pct,
  plClass,
  profileHref,
  tile,
  tzAbbrev,
} from "./render-atoms.js";

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
  bots.forEach((p, i) => {
    out.set(p.id, 1 - (i / (bots.length - 1)) * 0.45);
  });
  return out;
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

// NavView / NavContext / DashboardViewOptions / renderShell now live in `dashboard-shell.ts`, the
// shared push-drawer app shell every view delegates to. Re-exported here so
// `dashboard-server.ts`/tests importing them from this module keep working unchanged.
export type { DashboardViewOptions, NavContext, NavView };

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
    decisions?: readonly DecisionRecord[];
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
    ${
      isSelf && snapshot.positions.length === 0 && snapshot.cash > 0
        ? `<div class="founding-cta">
      <p class="founding-cta-text">Your reserve is staged — <strong>${formatCurrency(
        snapshot.cash,
      )}</strong> of dry powder, an empire about to rise. Found your first position to break ground.</p>
      <a class="obs-cta obs-cta-primary" href="/learn">Begin the Wheel — your first play</a>
    </div>`
        : ""
    }
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
    ${decisionsPanel(snapshot, options.decisions)}
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
 * The AUTONOMOUS DECISIONS panel (Phase 2.1 of the autonomy plan) — surfaces the bot's decision audit
 * trail so you can watch WHAT it decided and WHY. Bots only; shows the most recent cycles that did
 * something (placed / observed / halted / cooldown), newest first, each with its mode and rationale.
 * Absent for humans and when no trail is wired (the honest "not recorded yet" seam).
 */
function decisionsPanel(
  snapshot: ParticipantSnapshot,
  decisions?: readonly DecisionRecord[],
): string {
  if (snapshot.kind !== "bot") return "";
  if (!decisions) {
    return `<div class="history-seam">
      <span class="seam-label">Autonomous decisions</span>
      <p class="seam-note">Once this bot is running, every cycle it decides — observed or placed — shows here with its reasoning.</p>
    </div>`;
  }
  const active = decisions
    .filter((d) => d.halted || d.outcomes.length > 0)
    .slice(-12)
    .reverse();
  if (active.length === 0) {
    return `<section class="decisions-panel">
      <h2 class="col-head">Autonomous decisions</h2>
      <p class="empty">No decisions yet — the desk has been quiet.</p>
    </section>`;
  }
  const rows = active
    .map((d) => {
      const time = escapeHtml(formatTimestamp(new Date(d.at).toISOString()));
      if (d.halted) {
        return `<li class="dcn dcn-halt"><span class="dcn-t">${time}</span><span class="dcn-mode halt">HALTED</span><span class="dcn-body">circuit breaker: ${escapeHtml(d.halted)} — did not trade</span></li>`;
      }
      const modeCls = d.mode === "live" ? "live" : "observe";
      const items = d.outcomes
        .map((o) => {
          const verb =
            o.action === "placed"
              ? "placed"
              : o.action === "rejected"
                ? "rejected"
                : o.action === "cooldown-skipped"
                  ? "held (cooldown)"
                  : "would place";
          return `${escapeHtml(verb)} ${escapeHtml(o.intent.side)} ${o.intent.quantity} ${escapeHtml(o.intent.symbol)} — ${escapeHtml(o.intent.reason)}`;
        })
        .join("; ");
      return `<li class="dcn"><span class="dcn-t">${time}</span><span class="dcn-mode ${modeCls}">${d.mode.toUpperCase()}</span><span class="dcn-body">${items}</span></li>`;
    })
    .join("\n      ");
  return `<section class="decisions-panel">
      <h2 class="col-head">Autonomous decisions</h2>
      <ul class="dcn-list">
      ${rows}
      </ul>
    </section>`;
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
  const dd = equityDrawdown(history ?? []);
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
        ${dd ? `<div><dt>Peak equity</dt><dd class="num">${formatCurrency(dd.peak)}</dd></div>` : ""}
        ${
          dd
            ? `<div><dt>Max drawdown</dt><dd class="num ${dd.ddPct > 0 ? "neg" : ""}">${
                dd.ddPct > 0 ? `-${dd.ddPct.toFixed(2)}% · -${formatCurrency(dd.ddAbs)}` : "0.00%"
              }</dd></div>`
            : ""
        }
      </dl>
      <p class="seam-note">Per-play win rate lights up as more history accrues.</p>
    </section>`;
}

/** Metrics the leaderboard can rank by — all snapshot-derived (no history needed). */
export type LeaderMetric = "equity" | "pl" | "return" | "realized";

const LEADER_METRICS: ReadonlyArray<{ key: LeaderMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
  { key: "realized", label: "Realized P/L" },
];

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

/** One milestone row — a self-marked achievement worth points. */
function milestoneRow(m: Milestone): string {
  return `<label class="ms" data-ms="${m.id}">
        <input type="checkbox" class="ms-check" data-ms-check="${m.id}">
        <span class="ms-mark" aria-hidden="true">✓</span>
        <span class="ms-body"><span class="ms-title">${escapeHtml(m.title)}</span><span class="ms-detail">${escapeHtml(m.detail)}</span></span>
        <span class="ms-pts">+${m.points}</span>
      </label>`;
}

/** One course card — a chapter of milestones with a progress bar; higher levels lock. */
function courseCard(course: Course, locked: boolean): string {
  return `<details class="course${locked ? " locked" : ""}" data-course="${course.level}"${locked ? "" : " open"}>
      <summary>
        <span class="course-badge">${course.level}</span>
        <span class="course-h">
          <span class="course-title">${escapeHtml(course.title)}</span>
          <span class="course-sub">${escapeHtml(course.subtitle)}</span>
          <span class="course-prog"><span class="course-bar"><i data-bar="${course.level}"></i></span><span class="course-count" data-count="${course.level}">0 / ${course.milestones.length}</span></span>
        </span>
        <span class="course-lock" data-lock>${locked ? "🔒 Finish the level below" : ""}</span>
        <span class="lvl-chev" aria-hidden="true">›</span>
      </summary>
      <div class="ms-list">
        ${course.milestones.map(milestoneRow).join("\n        ")}
      </div>
    </details>`;
}

/**
 * The ACADEMY (`/learn`) — a GAMIFIED trading journey, not a textbook. It opens with a points/rank
 * HUD and the Wheel (buy stock → cash-covered put → covered call → repeat), then a stack of courses
 * whose milestones are self-marked achievements worth points. Level 100 (the Wheel) is open from the
 * start; level 200 (directional long options) unlocks only when 100 is complete — and everything
 * riskier is intentionally not shown yet. The `src/domain/curriculum.ts` model is the single source
 * of truth; a future engine can auto-complete milestones from real Alpaca activity.
 */
export function renderAcademyBody(options: DashboardViewOptions = {}): string {
  const cards = COURSES.map((c, i) => courseCard(c, i > 0)).join("\n    ");
  const content = `<section class="academy">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Your trading journey</h1>
        <p class="view-sub">It's all paper money — the only thing at stake is bragging rights. Complete milestones, earn points, climb the ranks, and unlock the next play.</p>
      </div>
    </div>
    <div class="hud">
      <div class="hud-stat"><span class="hud-k">Rank</span><span class="hud-v" data-rank>Observer</span></div>
      <div class="hud-stat"><span class="hud-k">Points</span><span class="hud-v" data-points>0</span><span class="hud-of" data-total>/ ${totalPoints()}</span></div>
      <div class="hud-bar"><i data-hudbar></i></div>
    </div>
    <div class="wheel">
      <h2>The Wheel — your first playbook</h2>
      <p class="wheel-lede">The safest way to learn options income. Turn the wheel: own a stock you'd want anyway, get paid to buy it lower, get paid to cap your upside — then repeat.</p>
      <ol class="wheel-steps">
        <li><span class="wheel-n">1</span><span class="wheel-t">Buy the stock</span><span class="wheel-d">Own 100 shares of a company you'd be glad to hold.</span></li>
        <li><span class="wheel-n">2</span><span class="wheel-t">Sell a cash-covered put</span><span class="wheel-d">Get paid to set a price you'd happily buy more at.</span></li>
        <li><span class="wheel-n">3</span><span class="wheel-t">Sell a covered call</span><span class="wheel-d">Get paid to cap your upside while you hold.</span></li>
        <li><span class="wheel-n">↻</span><span class="wheel-t">Repeat</span><span class="wheel-d">Collect premium turn after turn — that's the Wheel.</span></li>
      </ol>
    </div>
    <div class="courses">
    ${cards}
    </div>
    <p class="more-soon">◆ More strategies — spreads, condors, and advanced plays — unlock as you climb. We keep the risky ones out of reach until you're ready.</p>
  </section>
  <footer class="obs-foot">Educational · paper trading only · nothing here is financial advice. Mark a milestone once you've done it in your account — progress saves on this device.</footer>
  ${ACADEMY_SCRIPT}`;
  return renderShell(options.nav, content, new Date().toISOString());
}

/**
 * Gamified progression, client-side. localStorage holds the set of completed milestone ids; checking
 * one awards points, advances the rank HUD + per-course bars, and unlocks the next course once the
 * current one is fully done. No-JS still gets a fully readable page (level 100 open).
 */
const ACADEMY_SCRIPT = `<script>
(function(){
  var KEY="skynet.academy.done";
  var RANKS=${JSON.stringify(RANKS)};
  var TOTAL=${totalPoints()};
  var COURSES=${JSON.stringify(
    COURSES.map((c) => ({
      level: c.level,
      ms: c.milestones.map((m) => ({ id: m.id, points: m.points })),
    })),
  )};
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(e){ return []; } }
  function save(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  var done={}; load().forEach(function(id){ done[id]=true; });
  function points(){ var p=0; COURSES.forEach(function(c){ c.ms.forEach(function(m){ if(done[m.id]) p+=m.points; }); }); return p; }
  function rankFor(p){ var r=RANKS[0]; RANKS.forEach(function(x){ if(p>=x.atPoints) r=x; }); return r; }
  function courseDone(c){ return c.ms.every(function(m){ return done[m.id]; }); }
  function unlocked(level){ for(var i=0;i<COURSES.length;i++){ if(COURSES[i].level===level){ return i===0 || courseDone(COURSES[i-1]); } } return false; }
  function set(el,v){ if(el) el.textContent=v; }
  function sync(){
    var p=points();
    set(document.querySelector("[data-points]"), String(p));
    set(document.querySelector("[data-rank]"), rankFor(p).title);
    var hb=document.querySelector("[data-hudbar]"); if(hb) hb.style.width=(TOTAL?Math.round(p/TOTAL*100):0)+"%";
    document.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.checked=!!done[cb.getAttribute("data-ms-check")]; });
    COURSES.forEach(function(c){
      var n=0; c.ms.forEach(function(m){ if(done[m.id]) n++; });
      var bar=document.querySelector('[data-bar="'+c.level+'"]'); if(bar) bar.style.width=Math.round(n/c.ms.length*100)+"%";
      set(document.querySelector('[data-count="'+c.level+'"]'), n+" / "+c.ms.length);
      var el=document.querySelector('.course[data-course="'+c.level+'"]'); if(!el) return;
      var lock=!unlocked(c.level); el.classList.toggle("locked", lock);
      var ll=el.querySelector("[data-lock]"); if(ll) ll.textContent=lock?"🔒 Finish the level below":"";
      if(lock){ el.open=false; el.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.disabled=true; }); }
      else el.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.disabled=false; });
    });
  }
  document.querySelectorAll("[data-ms-check]").forEach(function(cb){
    cb.addEventListener("change", function(){ var id=cb.getAttribute("data-ms-check");
      if(cb.checked) done[id]=true; else delete done[id];
      save(Object.keys(done)); sync();
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
  if (!(a && b)) {
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
    options.nav && !currentId
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
