import { escapeHtml } from "../ui/escape-html.js";
import type { DashboardData } from "./dashboard-data.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import { participantInvested, participantUnrealized } from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { chip, formatCurrency, formatSigned, plClass, profileHref } from "./render-atoms.js";

/**
 * The LEADERBOARD view — comparison at scale. Ranks everyone by a selectable metric (equity,
 * unrealized P/L, or return %), humans and bots interleaved. Friendly/celebratory framing: this
 * is a friends-and-family league, so it's bragging rights, not a zero-sum war. The metric picker
 * is plain links (?by=…) so it stays shareable and back/forward-friendly with no JS.
 */

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
