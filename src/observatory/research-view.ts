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

/** The horizon summary row: next event, this week's count, next print, and researched breadth. */
function horizonTiles(
  upcoming: readonly MarketEvent[],
  asOfIso: string,
  symbolCount: number,
): string {
  const next = upcoming[0];
  const weekCount = upcoming.filter((e) => daysUntil(asOfIso, e.date) <= 7).length;
  const nextPrint = upcoming.find((e) => e.kind === "earnings");
  const pair = (e: MarketEvent | undefined, label: (e: MarketEvent) => string): string =>
    e ? `${label(e)} <span class="unit">${shortDay(e.date)}</span>` : "—";
  return `<div class="summary">
    ${tile("Next event", next ? countdown(daysUntil(asOfIso, next.date)) : "—", { lead: true })}
    ${tile("Next 7 days", `${weekCount} <span class="unit">event${weekCount === 1 ? "" : "s"}</span>`)}
    ${tile(
      "Next print",
      pair(nextPrint, (e) => escapeHtml(e.symbols[0] ?? "")),
    )}
    ${tile("Researched symbols", String(symbolCount))}
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
  const content = `${RS_STYLE}${AGENDA_STYLE}${MG_STYLE}
  <div class="cal-layout">
  <div class="research rs-wide">
    <div class="ladder-head"><div>
      <h1 class="view-title">Research lab</h1>
      <p class="view-sub">What's coming, and what we think about it: the event horizon first, each date carrying the call its research reached — then per-symbol living pages, the assessment ledgers behind those calls, and the red-teamed studies underneath. Confirmed dates key action; estimates only widen caution.</p>
    </div></div>
    ${BANNER}
    ${horizonTiles(upcoming, asOfIso, symbols.length)}
    ${renderAgenda(upcoming, asOfIso, { researchIds, calls: options.calls })}
    <section class="rs-sec"><h2>Symbols</h2><div class="rs-cards">${cards || `<p class="rs-empty">No researched symbols yet.</p>`}</div></section>
    <section class="rs-sec"><h2>Event ledgers</h2>
      <p class="rs-sub">One living document per dated market event — initial research, then append-only reassessment rows until the event passes and is scored.</p>
      <ul class="rs-list">${shelf.ledgers.map(ledgerLine).join("\n")}</ul></section>
    <section class="rs-sec"><h2>Studies &amp; registers</h2>
      <p class="rs-sub">The red-teamed foundations: instrument studies, the forward-test register, the kill list.</p>
      <ul class="rs-list">${shelf.studies.map(ledgerLine).join("\n")}</ul></section>
  </div>
  <aside class="cal-aside">${monthGrid(month, asOfIso, upcoming)}</aside>
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

/** Research styles — kept out of dashboard-shell.ts (size budget doctrine, like desk-style.ts). */
const RS_STYLE = `<style>
  .research{ display:flex; flex-direction:column; gap:14px; max-width:var(--col-read); }
  /* The merged shelf carries the wider event horizon alongside the reading sections, so it takes
     the calendar's former width rather than the narrower reading cap the doc/symbol pages keep. */
  .research.rs-wide{ max-width:var(--col-wide); }
  .research .summary{ margin-bottom:4px; }
  .research a, .research .md-doc a{ color:var(--accent); text-decoration:none; border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent); }
  .research a:hover{ border-bottom-color:var(--accent); }
  .rs-banner{ font-size:12px; color:var(--muted); border:1px dashed var(--border); border-radius:10px; padding:8px 12px; margin:0; }
  .rs-crumb{ font-size:12.5px; margin:0; display:flex; gap:12px; align-items:baseline; }
  .rs-sec{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 20px 12px; }
  .rs-sec h2{ margin:0 0 4px; font-size:14px; }
  .rs-sub{ margin:0 0 10px; font-size:12px; color:var(--muted); max-width:74ch; }
  .rs-cards{ display:flex; flex-wrap:wrap; gap:10px; padding:6px 0 10px; }
  .rs-card{ display:flex; flex-direction:column; gap:4px; min-width:150px; padding:10px 14px; border:1px solid var(--border); border-radius:12px; text-decoration:none; }
  .rs-card:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  .rs-cardsym{ font-family:var(--mono); font-weight:700; font-size:15px; color:var(--accent); }
  .rs-cardwhen{ font-size:11.5px; color:var(--muted); }
  .rs-list{ list-style:none; margin:0; padding:0; }
  .rs-list li{ padding:7px 0; border-top:1px solid color-mix(in srgb,var(--border) 60%,transparent); font-size:13px; display:flex; gap:10px; flex-wrap:wrap; align-items:baseline; }
  .rs-list li:first-child{ border-top:0; }
  .rs-when{ font-family:var(--mono); font-size:10.5px; color:var(--muted); }
  .rs-ev .rs-count{ font-family:var(--mono); font-size:11px; color:var(--accent); min-width:70px; }
  .rs-evtitle{ font-weight:600; }
  .rs-date{ font-family:var(--mono); font-size:11px; color:var(--muted); }
  .rs-est{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; color:var(--muted); border:1px dashed var(--muted); border-radius:5px; padding:1px 6px; }
  .rs-golink{ font-size:12px; }
  .rs-none{ font-size:11.5px; color:var(--muted); font-style:italic; }
  .rs-empty{ font-size:13px; color:var(--muted); font-style:italic; margin:4px 0; }
  .rs-stance{ border-left:2px solid var(--accent); padding-left:14px; }
  /* The decision surface earns more width than the reading column: it carries the five-column call
     sheet (call · confidence · why · dated falsifier), and squeezing that into 80ch is what made
     the old header hard to scan. The prose below keeps the narrower measure. */
  .rs-glance{ background:color-mix(in srgb,var(--accent) 8%,var(--surface)); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); border-radius:14px; padding:12px 18px 6px; margin:2px 0 4px; max-width:100%; }
  /* Both classes are on the same element, so this out-specifies .md-doc's 80ch reading cap. */
  .rs-glance.md-doc{ max-width:none; }
  .rs-glance table{ table-layout:auto; width:100%; }
  .rs-glance td:nth-child(3){ font-family:var(--mono); font-size:11px; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
  .rs-glance th:last-child, .rs-glance td:last-child{ color:var(--muted); }
  .rs-glance-tag{ font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin-bottom:2px; }
  .rs-glance > p:first-of-type{ margin-top:4px; }
  .rs-glance strong{ color:var(--text); }
  .rs-glance table{ width:100%; margin:8px 0; }
  .rs-glance th{ color:var(--accent); font-family:var(--mono); }
  .rs-glance td:first-child{ font-family:var(--mono); font-size:11.5px; white-space:nowrap; color:var(--accent); font-weight:700; }
  .rs-glance ul{ margin:4px 0; }
  .md-doc{ font-size:13.5px; line-height:1.65; max-width:80ch; }
  .md-doc h1{ font-size:19px; margin:6px 0 10px; }
  .md-doc h2{ font-size:15px; margin:20px 0 6px; }
  .md-doc h3{ font-size:13.5px; margin:14px 0 4px; }
  .md-doc p{ margin:8px 0; }
  .md-doc code{ font-family:var(--mono); font-size:12px; background:color-mix(in srgb,var(--border) 40%,transparent); border-radius:4px; padding:1px 5px; }
  .md-doc pre{ overflow-x:auto; background:color-mix(in srgb,var(--border) 30%,transparent); border-radius:8px; padding:10px 12px; }
  .md-doc pre code{ background:none; padding:0; }
  .md-doc table{ border-collapse:collapse; margin:10px 0; display:block; overflow-x:auto; font-size:12.5px; }
  .md-doc th, .md-doc td{ border:1px solid var(--border); padding:6px 9px; text-align:left; vertical-align:top; }
  .md-doc th{ font-family:var(--mono); font-size:11px; letter-spacing:.04em; }
  .md-doc blockquote{ margin:8px 0; padding:2px 14px; border-left:2px solid var(--border); color:var(--muted); }
  .md-doc ul, .md-doc ol{ padding-left:22px; margin:8px 0; }

  /* Reader-side folds — the method and the receipts are one click away, never the wall you land on.
     The content is unchanged and fully present; only its default disclosure differs. */
  .rs-fold{ border:1px solid var(--border); border-radius:10px; margin:10px 0; background:color-mix(in srgb,var(--border) 12%,transparent); }
  .rs-fold > summary{ cursor:pointer; list-style:none; padding:9px 14px; display:flex; align-items:baseline;
    gap:10px; flex-wrap:wrap; border-radius:10px; }
  .rs-fold > summary::-webkit-details-marker{ display:none; }
  .rs-fold > summary::before{ content:"▸"; color:var(--accent); font-size:11px; line-height:1.4; }
  .rs-fold[open] > summary::before{ content:"▾"; }
  .rs-fold > summary:hover{ background:color-mix(in srgb,var(--accent) 7%,transparent); }
  .rs-fold > summary:focus-visible{ outline:2px solid var(--accent); outline-offset:-2px; }
  .rs-foldname{ font-size:13.5px; font-weight:700; color:var(--text); }
  .rs-foldsize{ font-family:var(--mono); font-size:10px; letter-spacing:.06em; color:var(--muted); }
  .rs-fold[open] > summary{ border-bottom:1px solid var(--border); border-radius:10px 10px 0 0; }
  .rs-fold > :not(summary){ padding:0 14px; }
  .rs-fold > :last-child{ padding-bottom:10px; }

</style>`;
