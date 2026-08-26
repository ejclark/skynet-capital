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
import { type CohortStats, cohortStats } from "./standings-cohort.js";
import {
  formatMetric,
  LEADER_METRICS,
  type LeaderMetric,
  metricLabel,
  metricValue,
} from "./standings-metric.js";

/**
 * STANDINGS (`/`) — the whole race on one board, replacing the old Board + Leaderboard + Bots vs
 * Humans + Compare (folded 2026-08-25). Four tiers, richest first:
 *   1. The MATCH — the two cohorts (bots vs humans) head to head, split by average equity so a
 *      larger cohort can't win on headcount alone.
 *   2. Cohort cards — the aggregate read for each side (avg equity, unrealized P/L, breadth,
 *      best performer, spread). No nation skyline here — that flourish stays on an individual's
 *      own desk; a comparison view wants density, not decoration (design brief, 2026-08-25).
 *   3. Head-to-head (`?a=&b=`) — an IN-PAGE section, not a separate view: tap a row's compare
 *      pill to arm `?a=<id>` (a dashed hint banner offers a plain-language cancel), tap a second
 *      row to complete the pair and render the head-to-head grid + holdings overlap. No nation
 *      skyline here either — same "density, not decoration" call as the cohort cards.
 *   4. THE FIELD — every participant ranked by a selectable metric (`?by=`), a dense ladder
 *      rather than a card grid. Per-participant detail (activity feed, positions) lives on that
 *      participant's own `/u/:id` desk, not duplicated here.
 *
 * `renderStandingsContent` renders the whole view ONCE. Live updates no longer replace it: `/events`
 * carries seq-numbered patches and the page rewrites only the keyed nodes below (`data-field-key` +
 * `data-field`), so an in-flight animation, a focused control or a canvas survives every push. The
 * same markup is re-served whole at `/board/frame` for the cases a patch honestly cannot express —
 * a row appearing, the cohort lead flipping, a head-to-head compare on screen.
 */

export interface StandingsOptions extends DashboardViewOptions {
  readonly metric?: LeaderMetric;
  /** `?a=`/`?b=` — an id must exist in `data.participants`, match by `.id`, carry no `.error`;
   *  missing/unknown/errored falls through exactly like the old standalone `/compare` did. */
  readonly aId?: string;
  readonly bId?: string;
}

/** Every Standings-internal link carries `?by=` explicitly, plus `a`/`b` when a compare is live —
 *  so switching the ranked metric never drops an in-progress or completed comparison. */
function standingsHref(metric: LeaderMetric, aId?: string, bId?: string): string {
  const params = new URLSearchParams({ by: metric });
  if (aId) params.set("a", aId);
  if (bId) params.set("b", bId);
  return `/?${params.toString()}`;
}

/** The right-aligned segmented metric picker — plain links, so it's shareable with no JS. */
function metricPicker(
  metric: LeaderMetric,
  aId: string | undefined,
  bId: string | undefined,
): string {
  return LEADER_METRICS.map(
    (m) =>
      `<a class="msel${m.key === metric ? " active" : ""}" href="${standingsHref(m.key, aId, bId)}">${m.label}</a>`,
  ).join("");
}

/**
 * One row's compare pill. Three shapes: nothing armed (or a pair already showing) → arm this row;
 * armed on this exact row (or this row is part of the showing pair) → cancel; armed on some OTHER
 * row → complete the pair with this one.
 */
function comparePill(
  rowId: string,
  metric: LeaderMetric,
  aId: string | undefined,
  bId: string | undefined,
): string {
  if (aId && (rowId === aId || rowId === bId)) {
    return `<a class="cmp-toggle cmp-armed" href="${standingsHref(metric)}" title="Cancel compare" aria-label="Cancel compare">×</a>`;
  }
  if (aId && !bId) {
    return `<a class="cmp-toggle" href="${standingsHref(metric, aId, rowId)}" title="Compare with ${escapeHtml(aId)}" aria-label="Compare with the armed pick">⇄</a>`;
  }
  return `<a class="cmp-toggle" href="${standingsHref(metric, rowId)}" title="Compare" aria-label="Compare this account">⇄</a>`;
}

/** THE FIELD — every live participant, ranked by the selected metric. */
function fieldLadder(
  data: DashboardData,
  metric: LeaderMetric,
  currentId: string | undefined,
  aId: string | undefined,
  bId: string | undefined,
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
      // data-field-key/data-field are the live patch's addresses; data-sort is what lets the list
      // reorder itself in place on a rank change instead of being rebuilt (see standings-patch.ts).
      return `<li class="rank-row${self}${medal}" data-field-key="${escapeHtml(p.id)}" data-empire-key="${escapeHtml(p.id)}" data-sort="${v}">
        <span class="rank" data-field="rank">${i + 1}</span>
        <a class="rank-name" href="${profileHref(p.id)}">${escapeHtml(p.displayName)} ${chip(p)}${you}</a>
        <span class="rank-bar"><i class="bar-${sign}" data-field-bar="bar" data-field-tone="bar" data-tone-prefix="bar-" style="width:${width.toFixed(1)}%"></i></span>
        <span class="rank-val num ${sign}" data-field="value" data-field-tone="value">${formatMetric(v, metric)}</span>
        ${comparePill(p.id, metric, aId, bId)}
      </li>`;
    })
    .join("\n      ");

  return `<ol class="ladder" data-sortable>
      ${rows || `<li class="empty">No participants on the board yet.</li>`}
    </ol>
  <footer class="obs-foot">Read-only observatory · ranked by ${escapeHtml(
    metricLabel(metric),
  )} · figures reflect the last account read.</footer>`;
}

function cohortCard(stats: CohortStats, leads: boolean): string {
  const chipCls = stats.kind === "bot" ? "chip-bot" : "chip-human";
  // Every figure carries a `data-field` name; the live patch writes text into these nodes rather
  // than replacing the card. Absence stays absent — no best performer renders "—" and an EMPTY
  // figure, never a fabricated 0%.
  return `<article class="cohort ${leads ? "cohort-lead" : ""}" data-field-key="cohort:${stats.kind}">
      <header class="cohort-head">
        <span class="chip ${chipCls}">${stats.label.toUpperCase()}</span>
        <span class="cohort-count num"><span data-field="count">${stats.count}</span><span class="unit" data-field="countUnit"> account${stats.count === 1 ? "" : "s"}</span></span>
        ${leads ? `<span class="cohort-badge">LEADS</span>` : ""}
      </header>
      <div class="cohort-equity num" data-field="totalEquity">${formatCurrency(stats.totalEquity)}</div>
      <div class="cohort-eqlabel">total equity</div>
      <dl class="cohort-metrics">
        <div><dt>Avg equity</dt><dd class="num" data-field="avgEquity">${formatCurrency(stats.avgEquity)}</dd></div>
        <div><dt>Unrealized P/L</dt><dd class="num ${plClass(stats.totalUnrealized)}" data-field="unrealized" data-field-tone="unrealized">${formatSigned(stats.totalUnrealized)}</dd></div>
        <div><dt>Cohort return</dt><dd class="num ${plClass(stats.returnPct)}" data-field="return" data-field-tone="return">${pct(stats.returnPct)}</dd></div>
        <div><dt>In profit</dt><dd class="num" data-field="breadth">${stats.breadthPct.toFixed(0)}%</dd></div>
        <div><dt>Best</dt><dd><span data-field="bestName">${stats.best ? escapeHtml(stats.best.name) : "—"}</span> <span class="num ${plClass(stats.best?.pct ?? 0)}" data-field="bestPct" data-field-tone="bestPct">${stats.best ? pct(stats.best.pct) : ""}</span></dd></div>
        <div><dt>Spread</dt><dd class="num" data-field="spread">${stats.spread.toFixed(2)}%</dd></div>
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
  // Split across two keyed nodes so the live patch can rewrite the leader and the read separately
  // (a tie carries an EMPTY leader rather than a fabricated one).
  const leadLabel =
    leader === null
      ? `<strong data-field="readLeader"></strong><span data-field="readRest">Dead even — the match is tied</span>`
      : `<strong data-field="readLeader">${leader ? "Humans" : "Bots"}</strong><span data-field="readRest"> lead the match · ${
          leader ? humanPct : botPct
        }% of the field</span>`;
  // The bar's accessible name is deliberately percentage-FREE: the visible labels are patched live,
  // and an aria-label frozen at first render would keep announcing a number that has since moved.
  return `<section class="match" aria-label="Bots vs Humans live match standings" data-field-key="match">
      <div class="match-top"><span class="match-eyebrow">◈ THE MATCH · LIVE</span><span class="match-metric">avg equity per account</span></div>
      <div class="match-bar" role="img" aria-label="Humans versus Bots, by average equity per account">
        <div class="match-seg match-human" data-field-bar="human" style="width:${humanPct}%"><span class="match-seg-label" data-field="humanLabel">Humans ${humanPct}%</span></div>
        <div class="match-seg match-bot" data-field-bar="bot" style="width:${botPct}%"><span class="match-seg-label" data-field="botLabel">${botPct}% Bots</span></div>
        <div class="match-divider" data-field-bar="divider" data-bar-axis="left" style="left:${humanPct}%"></div>
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
    <div class="versus-read" data-field-key="versus">
      <span><strong data-field="totalLeader">${humansLeadTotal ? "Humans" : "Bots"}</strong> lead on total equity by <span class="num" data-field="totalGap">${formatCurrency(totalGap)}</span></span>
      <span><strong data-field="avgLeader">${avgLeader}</strong> lead on average equity by <span class="num" data-field="avgGap">${formatCurrency(avgGap)}</span></span>
    </div>`;
}

/** The dashed "armed" hint — one side picked, waiting on the second row tap. */
function compareHint(anchor: ParticipantSnapshot, metric: LeaderMetric): string {
  return `<div class="cmp-hint">
      <span>Comparing <strong>${escapeHtml(anchor.displayName)}</strong> — pick a second empire on any row below.</span>
      <a class="cmp-cancel" href="${standingsHref(metric)}">× cancel</a>
    </div>`;
}

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

/** The completed head-to-head — both sides resolved. No nation skyline (design brief, 2026-08-25):
 *  this is a comparison surface, not a showcase; the flourish stays on an individual's own desk. */
function headToHead(a: ParticipantSnapshot, b: ParticipantSnapshot, metric: LeaderMetric): string {
  return `<section class="cmp-wrap">
    <div class="ladder-head">
      <div>
        <h2 class="view-title">${escapeHtml(a.displayName)} <span class="cmp-vs">vs</span> ${escapeHtml(b.displayName)}</h2>
        <p class="view-sub">Head-to-head — snapshot standings and where the books overlap.</p>
      </div>
      <a class="cmp-cancel" href="${standingsHref(metric)}">× clear</a>
    </div>
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
    <h3 class="col-head cmp-holdhead">Holdings overlap</h3>
    ${holdingsCompare(a, b)}
    <div class="history-seam">
      <span class="seam-label">Which plays worked</span>
      <p class="seam-note">Per-play effectiveness — who timed the entry, whose thesis held — lights up here once we've recorded trade history.</p>
    </div>
  </section>`;
}

/**
 * The STANDINGS content — the piece the SSE stream swaps into `#root` on every hub update. Kept
 * separate from the shell so live refresh never re-renders the drawer or resets its open/closed
 * state.
 */
export function renderStandingsContent(
  data: DashboardData,
  options: StandingsOptions = {},
): string {
  const metric = options.metric ?? "equity";
  const currentId = options.nav?.currentId;
  // Exactly the old /compare route's resolution: an id must exist in data.participants, match by
  // .id, and carry no .error. Missing/unknown/errored falls through — never a crash, never a
  // partial render.
  const a = options.aId
    ? data.participants.find((p) => p.id === options.aId && !p.error)
    : undefined;
  const b = options.bId
    ? data.participants.find((p) => p.id === options.bId && !p.error)
    : undefined;
  // OBSERVER MODE — the funnel's front door (stage 1 → 2): signed in but no linked account means
  // you can watch the whole league yet hold no tower. The state is "this SIGN-IN isn't linked to
  // an account", which has TWO exits — brand new, or an account already on the board that predates
  // linking — and the copy must name both. The old "your empire awaits its founding" read as "you
  // have no account" to someone whose account was right there on the board, and walked them into
  // /add's duplicate refusal and a key regeneration that revoked their working env key
  // (2026-08-25). Vague here isn't warm, it's a trap.
  const observer =
    options.nav && !currentId
      ? `<section class="observer-hero">
    <p class="obs-eyebrow">⚠ NOT CONNECTED</p>
    <h2 class="obs-title">This sign-in isn't linked to any account — you can't trade yet.</h2>
    <p class="obs-sub">Watching works; trading and "your" views don't, until a link exists. <b>New here?</b> Connect a free Alpaca paper account to take the field — your own city on the board, your seat in the race. <b>Already see your account below?</b> It's on the board and syncing, but nothing ties it to this sign-in — don't re-add it, and don't regenerate keys to try (regenerating revokes the working pair). If you already did: click into that account below and use the Rotate link on it — it carries the account with it, so you won't have to type an id. An owner links your sign-in to the account — no keys involved.</p>
    <div class="obs-ctas"><a class="obs-cta obs-cta-primary" href="/welcome">Get set up — the guided path</a><a class="obs-cta" href="/add">I'm new — I have my keys</a></div>
  </section>
  `
      : "";
  const compareSection = a && b ? headToHead(a, b, metric) : a ? compareHint(a, metric) : "";
  return `${observer}<div class="ladder-head">
      <div>
        <h1 class="view-title">Standings</h1>
        <p class="view-sub">The whole race on one board — a friendly league, bots and humans both welcome to win.</p>
      </div>
      <div class="metricsel">${metricPicker(metric, a?.id, b?.id)}</div>
    </div>
    ${cohortSection(data)}
    ${compareSection}
    ${fieldLadder(data, metric, currentId, a?.id, b?.id)}`;
}

export function renderStandingsBody(data: DashboardData, options: StandingsOptions = {}): string {
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
