/**
 * THE RESEARCH LAB (`/research`) — the observatory's living research surface
 * (docs/plans/research-lab.md slice 1, sharpened 2026-08-17: symbol-first pages +
 * calendar↔research links; folded with the event horizon 2026-08-25, "what's coming, and what do
 * we think about it?" as one page — the old standalone `/calendar` view is gone, absorbed here as
 * a fourth shape).
 *
 * Four pages, all pure renderers over data the server assembles (research-service.ts /
 * market-events.ts):
 *   /research               — the shelf: symbol cards, event ledgers, studies, AND the event
 *                             horizon (proximity-banded agenda + month-grid navigator)
 *   /research/symbol/:SYMBOL      — a symbol's LIVING page: its upcoming events, ledgers, studies,
 *                             and the current stance excerpted VERBATIM from the nearest ledger
 *                             (an excerpt is honest; a regenerated summary could drift)
 *   /research/<slug>        — any study or event ledger, rendered in the house shell
 *
 * Honesty invariants: every page carries the standing educational banner; estimate/confirmed
 * labels arrive inside the docs themselves and render untouched; ledgers name their
 * `Last assessed` date so staleness is visible, never hidden. The agenda is the primary register —
 * for options, days-until matters more than date position — and the month grid
 * (`calendar-widget.ts`) rides alongside as a NAVIGATOR, never a filter: `?month=` moves only the
 * widget, the agenda always renders every upcoming event.
 */
import { daysUntil, type EarningsPrint } from "../domain/earnings-calendar.js";
import { allEvents, type MarketEvent } from "../domain/market-events.js";
import type {
  EventCall,
  RenderedDoc,
  ResearchDoc,
  ResearchShelf,
  SymbolResearch,
} from "../server/research-service.js";
import { escapeHtml } from "../ui/escape-html.js";
import { MG_STYLE, monthGrid, resolveMonth } from "./calendar-widget.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";
import { AGENDA_STYLE, renderAgenda, shortDay } from "./event-agenda.js";
import { countdown, tile } from "./render-atoms.js";
import { RS_STYLE } from "./research-style.js";

export interface ResearchShelfOptions {
  readonly nav?: NavContext;
  readonly asOfIso: string;
  readonly shelf: ResearchShelf;
  /** Symbols that have a living page, with their next upcoming event (if any) for the card. */
  readonly symbols: readonly { readonly symbol: string; readonly next?: MarketEvent }[];
  /** Widget month ("YYYY-MM", the `?month=` param) — validated/clamped by `resolveMonth`. */
  readonly month?: string;
  /** Injectable tables for specs; default to the real checked-in calendar. */
  readonly events?: readonly MarketEvent[];
  readonly prints?: readonly EarningsPrint[];
  /** Event ids that have a research ledger — those rows link to /research/events/<id>. */
  readonly researchIds?: ReadonlySet<string>;
  /** Event id → the verbatim call its ledger reached, promoted onto the agenda row. */
  readonly calls?: ReadonlyMap<string, EventCall>;
}

export interface ResearchDocOptions {
  readonly nav?: NavContext;
  readonly asOfIso: string;
  readonly doc: RenderedDoc;
}

export interface SymbolResearchOptions {
  readonly nav?: NavContext;
  readonly asOfIso: string;
  readonly data: SymbolResearch;
}

/** The standing educational framing — on every research page, no exceptions (the plan's EARS). */
const BANNER = `<p class="rs-banner">Paper trading, educational research — not investment advice. Estimated dates only widen caution; date-keyed action requires a confirmed source.</p>`;

const estBadge = (e: MarketEvent): string =>
  e.status === "estimate"
    ? `<span class="rs-est" title="Estimated date — estimates only widen caution">EST</span>`
    : "";

function ledgerLine(d: ResearchDoc): string {
  const assessed = d.lastAssessed
    ? `<span class="rs-when">last assessed ${escapeHtml(d.lastAssessed)}</span>`
    : "";
  return `<li><a href="/research/${escapeHtml(d.slug)}">${escapeHtml(d.title)}</a>${assessed}</li>`;
}

/**
 * The horizon tiles that sit beside the calendar in the shelf header.
 *
 * Two tiles, not four. "Next event → today" was dropped because the grid already rings today
 * (`.mg-today`) and the agenda labels its first group `today` — three copies of one fact. The
 * researched-symbol count moved onto the `Symbols` heading it describes (Eric, 2026-08-26).
 */
function horizonTiles(upcoming: readonly MarketEvent[], asOfIso: string): string {
  const weekCount = upcoming.filter((e) => daysUntil(asOfIso, e.date) <= 7).length;
  const nextPrint = upcoming.find((e) => e.kind === "earnings");
  const printValue = nextPrint
    ? `${escapeHtml(nextPrint.symbols[0] ?? "")} <span class="unit">${shortDay(nextPrint.date)}</span>`
    : "—";
  return `<div class="summary rs-tiles">
    ${tile("Next 7 days", `${weekCount} <span class="unit">event${weekCount === 1 ? "" : "s"}</span>`, { lead: true })}
    ${tile("Next print", printValue)}
  </div>`;
}

function eventLine(e: MarketEvent, asOfIso: string, hasLedger: boolean): string {
  const days = daysUntil(asOfIso, e.date);
  const link = hasLedger
    ? `<a class="rs-golink" href="/research/events/${escapeHtml(e.id)}">research →</a>`
    : `<span class="rs-none" title="Queued — the daily event scan researches new events on cadence">research queued</span>`;
  return `<li class="rs-ev" title="${escapeHtml(e.source)}">
    <span class="rs-count">${countdown(days)}</span>
    <span class="rs-evtitle">${escapeHtml(e.title)}</span>
    <span class="rs-date">${escapeHtml(e.date)}</span>${estBadge(e)} ${link}
  </li>`;
}

export function renderResearchShelfBody(options: ResearchShelfOptions): string {
  const { shelf, symbols, asOfIso } = options;
  const upcoming = allEvents(asOfIso, options.events, options.prints);
  const researchIds = options.researchIds ?? new Set<string>();
  const month = resolveMonth(options.month, asOfIso, upcoming);
  const cards = symbols
    .map(({ symbol, next }) => {
      const when = next
        ? `<span class="rs-cardwhen">${escapeHtml(next.title)} ${countdown(daysUntil(asOfIso, next.date))}${next.status === "estimate" ? " (est)" : ""}</span>`
        : `<span class="rs-cardwhen">no dated event ahead</span>`;
      return `<a class="rs-card" href="/research/symbol/${escapeHtml(symbol)}"><span class="rs-cardsym">${escapeHtml(symbol)}</span>${when}</a>`;
    })
    .join("\n");
  // ORDER IS THE POINT (Eric, 2026-08-25): the agenda is the actionable register, so it leads —
  // what to do this week, each row carrying the call its research reached. The document lists are
  // an archive you go looking for, so they follow.
  const symbolCount = symbols.length ? ` <span class="rs-headcount">${symbols.length}</span>` : "";
  const content = `${RS_STYLE}${AGENDA_STYLE}${MG_STYLE}
  <div class="research rs-wide">
    <div class="ladder-head"><div>
      <h1 class="view-title">Research lab</h1>
      <p class="view-sub">What's coming, and what we think about it: the event horizon first, each date carrying the call its research reached — then per-symbol living pages, the assessment ledgers behind those calls, and the red-teamed studies underneath. Confirmed dates key action; estimates only widen caution.</p>
    </div></div>
    ${BANNER}
    <div class="rs-head">
      ${monthGrid(month, asOfIso, upcoming)}
      ${horizonTiles(upcoming, asOfIso)}
    </div>
    ${renderAgenda(upcoming, asOfIso, { researchIds, calls: options.calls })}
    <section class="rs-sec"><h2>Symbols${symbolCount}</h2><div class="rs-cards">${cards || `<p class="rs-empty">No researched symbols yet.</p>`}</div></section>
    <section class="rs-sec"><h2>Event ledgers</h2>
      <p class="rs-sub">One living document per dated market event — initial research, then append-only reassessment rows until the event passes and is scored.</p>
      <ul class="rs-list">${shelf.ledgers.map(ledgerLine).join("\n")}</ul></section>
    <section class="rs-sec"><h2>Studies &amp; registers</h2>
      <p class="rs-sub">The red-teamed foundations: instrument studies, the forward-test register, the kill list.</p>
      <ul class="rs-list">${shelf.studies.map(ledgerLine).join("\n")}</ul></section>
  </div>
  <footer class="obs-foot">Git is the CMS — every page here is a reviewed, versioned document. Dates hand-verified against primary sources (BLS, the Fed, company IR) and reviewed in diffs — hover any event for its audit trail. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}

export function renderResearchDocBody(options: ResearchDocOptions): string {
  const { doc, asOfIso } = options;
  const assessed = doc.lastAssessed
    ? `<span class="rs-when">last assessed ${escapeHtml(doc.lastAssessed)}</span>`
    : "";
  // The decision header — TL;DR + horizon table + signal conditions — surfaced above the full
  // document when the ledger authors an `## At a glance` section (research-service extracts it).
  const glance = doc.glanceHtml
    ? `<section class="rs-glance md-doc" aria-label="At a glance">
        <div class="rs-glance-tag">At a glance</div>
        ${doc.glanceHtml}
      </section>`
    : "";
  const content = `${RS_STYLE}
  <div class="research">
    <p class="rs-crumb"><a href="/research">← research lab</a>${assessed}</p>
    ${BANNER}
    ${glance}
    <article class="md-doc">${doc.html}</article>
  </div>
  <footer class="obs-foot">A reviewed, versioned document — history lives in git. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}

export function renderSymbolResearchBody(options: SymbolResearchOptions): string {
  const { data, asOfIso } = options;
  const ledgerSlugs = new Set(data.ledgers.map((d) => d.slug));
  const next = data.events[0];
  const stance = data.stance
    ? `<section class="rs-sec"><h2>Current stance</h2>
        <p class="rs-sub">Verbatim from <a href="/research/${escapeHtml(data.stance.from.slug)}">${escapeHtml(data.stance.from.title)}</a>${data.stance.from.lastAssessed ? ` — last assessed ${escapeHtml(data.stance.from.lastAssessed)}` : ""}. An excerpt, never a summary.</p>
        <div class="md-doc rs-stance">${data.stance.html}</div></section>`
    : "";
  const content = `${RS_STYLE}
  <div class="research">
    <p class="rs-crumb"><a href="/research">← research lab</a></p>
    <div class="ladder-head"><div>
      <h1 class="view-title">${escapeHtml(data.symbol)} — living research</h1>
      <p class="view-sub">Everything the house holds on ${escapeHtml(data.symbol)}, assembled live: dated events, assessment ledgers, and the studies underneath. This page updates as the research does.</p>
    </div></div>
    ${BANNER}
    <div class="summary">
      ${tile("Next event", next ? `${countdown(daysUntil(asOfIso, next.date))}${next.status === "estimate" ? ` <span class="unit">est</span>` : ""}` : "—", { lead: true })}
      ${tile("Ledgers", String(data.ledgers.length))}
      ${tile("Studies", String(data.studies.length))}
    </div>
    ${stance}
    <section class="rs-sec"><h2>Dated events</h2>
      <ul class="rs-list">${data.events.map((e) => eventLine(e, asOfIso, ledgerSlugs.has(`events/${e.id}`))).join("\n") || `<p class="rs-empty">No upcoming dated events.</p>`}</ul></section>
    <section class="rs-sec"><h2>Event ledgers</h2>
      <ul class="rs-list">${data.ledgers.map(ledgerLine).join("\n") || `<p class="rs-empty">None yet.</p>`}</ul></section>
    <section class="rs-sec"><h2>Studies mentioning ${escapeHtml(data.symbol)}</h2>
      <ul class="rs-list">${data.studies.map(ledgerLine).join("\n") || `<p class="rs-empty">None yet.</p>`}</ul></section>
  </div>
  <footer class="obs-foot">Assembled from the reviewed research shelf — no generated summaries. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}
