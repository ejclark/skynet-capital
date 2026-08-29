/**
 * THE EVENT AGENDA — the proximity-banded register of what is coming, and what we think about it.
 *
 * Split out of research-view.ts (2026-08-25) when the shelf was reordered to LEAD with the agenda
 * rather than bury it under the document lists (Eric: "the calendar information is information we
 * need to make decisions — that is the primary/actionable information that should be presented
 * first"). The move is the size-budget doctrine at work, the same reason calendar-widget.ts,
 * fluid-layout.ts and shell-style.ts exist as their own modules.
 *
 * The agenda is the PRIMARY register: for options, days-until matters more than date position, so
 * events group by day inside proximity bands and the month grid rides alongside as a navigator.
 *
 * Each row can carry the CALL its research reached — extracted verbatim from the ledger's decision
 * header by research-service.ts, never inferred here. A row with no ledger, or a ledger with no
 * decision header, degrades to the plain research link; it never guesses. Calls render in accent
 * teal only: docs/BRAND.md reserves --pos/--neg for market meaning, so a call must never be
 * colored as if it were a P/L direction.
 *
 * Class prefix is `cal-` throughout. calendar-widget.ts owns `mg-` and never emits these strings —
 * tests/observatory/research-view.spec.ts asserts that isolation, because other specs count them.
 */
import { daysUntil } from "../domain/earnings-calendar.js";
import type { MarketEvent } from "../domain/market-events.js";
import type { EventCall } from "../server/research-service.js";
import { escapeHtml } from "../ui/escape-html.js";
import { countdown } from "./render-atoms.js";

const KIND_LABEL: Record<MarketEvent["kind"], string> = {
  earnings: "EARNINGS",
  "macro-print": "MACRO",
  "product-launch": "LAUNCH",
  sector: "SECTOR",
  rates: "TREASURY",
  opex: "OPEX",
  geopolitical: "GEO",
};

/** Proximity bands — the same caution-window framing the playbooks use, made visual. */
const BANDS = [
  {
    title: "Next 7 days",
    sub: "Inside the caution window — holding through these dates is a deliberate choice, not a default.",
    min: 0,
    max: 7,
  },
  { title: "Next 30 days", sub: "Close enough to plan around.", min: 8, max: 30 },
  {
    title: "Beyond 30 days",
    sub: "On the horizon — estimated dates out here can still move.",
    min: 31,
    max: Number.POSITIVE_INFINITY,
  },
] as const;

/** "Wed, Oct 28" — UTC date-only, matching the calendar-day math of the domain model. */
function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "Oct 28" — the compact form for tiles. */
export function shortDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** What the agenda needs to render a row beyond the event itself. */
export interface AgendaContext {
  /** Event ids that have a research ledger — those rows link to /research/events/<id>. */
  readonly researchIds: ReadonlySet<string>;
  /** Event id → the verbatim call its ledger reached, when it states one. */
  readonly calls?: ReadonlyMap<string, EventCall>;
}

/**
 * The call chip — the decision the research reached, promoted onto the row that triggers it.
 * Verbatim from the ledger (an excerpt is honest; a regenerated summary could drift), and it
 * links to the document that justifies it so the claim is never separated from its receipt.
 */
function callChip(event: MarketEvent, ctx: AgendaContext): string {
  const found = ctx.calls?.get(event.id);
  if (!found) return "";
  const conf = found.confidence
    ? `<span class="cal-conf">${escapeHtml(found.confidence)}</span>`
    : "";
  const why = `${found.horizon}: the call from this event's research ledger${found.confidence ? ` (confidence: ${found.confidence})` : ""} — click for the reasoning behind it`;
  return `<div class="cal-callrow"><a class="cal-call" href="/research/events/${escapeHtml(event.id)}" title="${escapeHtml(why)}">
      <span class="cal-calltext">${escapeHtml(found.call)}</span>${conf}</a></div>`;
}

function agendaRow(event: MarketEvent, ctx: AgendaContext): string {
  // Symbol chips deep-link to the symbol's living research page (/research/symbol/:SYMBOL).
  const syms = event.symbols.length
    ? event.symbols
        .map(
          (s) =>
            `<a class="cal-sym" href="/research/symbol/${escapeHtml(s)}" title="${escapeHtml(s)} — living research">${escapeHtml(s)}</a>`,
        )
        .join("")
    : `<span class="cal-wide">MARKET-WIDE</span>`;
  const est =
    event.status === "estimate"
      ? `<span class="cal-est" title="Estimated date — estimates only widen caution; date-keyed action requires confirmed">EST</span>`
      : "";
  const research = ctx.researchIds.has(event.id)
    ? `<a class="cal-research" href="/research/events/${escapeHtml(event.id)}" title="Assessment ledger — initial research + reassessment rows">research →</a>`
    : "";
  const notes = event.notes ? `<div class="cal-notes">${escapeHtml(event.notes)}</div>` : "";
  return `<li class="cal-ev imp-${event.impact}" title="${escapeHtml(event.source)}">
        <span class="cal-kind">${KIND_LABEL[event.kind]}</span>
        <span class="cal-title">${escapeHtml(event.title)}</span>
        ${syms}${est}${research}
        ${callChip(event, ctx)}${notes}
      </li>`;
}

function agendaDayGroup(
  date: string,
  events: readonly MarketEvent[],
  asOfIso: string,
  ctx: AgendaContext,
): string {
  const days = daysUntil(asOfIso, date);
  const stacked =
    events.length > 1
      ? `<span class="cal-stack" title="Multiple events land on this date — compound-risk day">×${events.length} same day</span>`
      : "";
  return `<section class="cal-day${days <= 7 ? " cal-near" : ""}" id="day-${date}">
      <header class="cal-dayhead">
        <span class="cal-date">${escapeHtml(formatDay(date))}</span>
        <span class="cal-in">${countdown(days)}</span>
        ${stacked}
      </header>
      <ul class="cal-list">${events.map((e) => agendaRow(e, ctx)).join("\n")}</ul>
    </section>`;
}

/** Date-grouped rows for one proximity band; multi-event dates stay visibly stacked. */
function agendaBandPanel(
  band: (typeof BANDS)[number],
  upcoming: readonly MarketEvent[],
  asOfIso: string,
  ctx: AgendaContext,
): string {
  const inBand = upcoming.filter((e) => {
    const days = daysUntil(asOfIso, e.date);
    return days >= band.min && days <= band.max;
  });
  // Only the near band earns an honest empty state — silence about a quiet far horizon is noise.
  if (inBand.length === 0 && band.min > 0) return "";
  const byDate = new Map<string, MarketEvent[]>();
  for (const e of inBand) {
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }
  const body =
    inBand.length === 0
      ? `<p class="cal-empty">Nothing inside a week — clear runway.</p>`
      : [...byDate.entries()]
          .map(([date, evs]) => agendaDayGroup(date, evs, asOfIso, ctx))
          .join("\n");
  return `<section class="cal-band">
    <h2 class="cal-band-title">${band.title}</h2>
    <p class="cal-band-sub">${band.sub}</p>
    ${body}
  </section>`;
}

/** Every proximity band, in order — the shelf's primary register. */
export function renderAgenda(
  upcoming: readonly MarketEvent[],
  asOfIso: string,
  ctx: AgendaContext,
): string {
  return BANDS.map((band) => agendaBandPanel(band, upcoming, asOfIso, ctx)).join("\n");
}
