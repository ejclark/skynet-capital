import { escapeHtml } from "../ui/escape-html.js";
import type { DashboardData } from "./dashboard-data.js";
import { type DashboardViewOptions, type NavContext, renderShell } from "./dashboard-shell.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import {
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { chip, formatCurrency, formatSigned, pct, plClass, profileHref } from "./render-atoms.js";

/**
 * The COMPARISON view — two participants side by side with a signed delta column and a holdings
 * overlap (shared symbols marked, heavier side highlighted). Snapshot-based today; deeper
 * "which plays worked / performed poorly" insights are a history-layer feature (seam shown below).
 */

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
