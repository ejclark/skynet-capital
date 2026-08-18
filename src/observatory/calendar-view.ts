import { daysUntil, type EarningsPrint } from "../domain/earnings-calendar.js";
import { allEvents, type MarketEvent } from "../domain/market-events.js";
import { escapeHtml } from "../ui/escape-html.js";
import { MG_STYLE, monthGrid, resolveMonth } from "./calendar-widget.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";
import { countdown, tile } from "./render-atoms.js";

/**
 * The EVENT HORIZON (`/calendar`) — the observatory rendering of the checked-in market-event
 * calendar (src/domain/market-events.ts): every dated thing that can move the names we trade,
 * grouped by date and banded by proximity, so "what deserves attention next" reads at a glance.
 *
 * Slice 2 of docs/plans/market-event-calendar.md — a pure presentation layer over the domain
 * feed. No network, no new data source: the same date policy applies here, so `estimate` events
 * carry a visible EST badge (they may only widen caution) and every row's `title` attribute
 * carries the source audit trail. The agenda list is the primary register — for options,
 * days-until matters more than date position — and the desktop month grid (calendar-widget.ts)
 * rides alongside as a NAVIGATOR, never a filter: `?month=` moves only the widget, the agenda
 * always renders every upcoming event, so day-cell jump links always have an anchor to land on.
 *
 * The as-of moment is always injected — never derived from the clock here — so specs pin the
 * horizon and the server decides "now" exactly once per request.
 */

export interface CalendarViewOptions {
  readonly nav?: NavContext;
  /** The render moment (ISO). Everything — countdowns, bands, tiles — is keyed off this. */
  readonly asOfIso: string;
  /** Widget month ("YYYY-MM", the `?month=` param) — validated/clamped by `resolveMonth`. */
  readonly month?: string;
  /** Injectable tables for specs; default to the real checked-in calendar. */
  readonly events?: readonly MarketEvent[];
  readonly prints?: readonly EarningsPrint[];
  /** Event ids that have a research ledger — those rows link to /research/events/<id>. */
  readonly researchIds?: ReadonlySet<string>;
}

const KIND_LABEL: Record<MarketEvent["kind"], string> = {
  earnings: "EARNINGS",
  "macro-print": "MACRO",
  "product-launch": "LAUNCH",
  sector: "SECTOR",
  rates: "TREASURY",
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
function shortDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function eventRow(event: MarketEvent, researchIds: ReadonlySet<string>): string {
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
  const research = researchIds.has(event.id)
    ? `<a class="cal-research" href="/research/events/${escapeHtml(event.id)}" title="Assessment ledger — initial research + reassessment rows">research →</a>`
    : "";
  const notes = event.notes ? `<div class="cal-notes">${escapeHtml(event.notes)}</div>` : "";
  return `<li class="cal-ev imp-${event.impact}" title="${escapeHtml(event.source)}">
        <span class="cal-kind">${KIND_LABEL[event.kind]}</span>
        <span class="cal-title">${escapeHtml(event.title)}</span>
        ${syms}${est}${research}${notes}
      </li>`;
}

function dayGroup(
  date: string,
  events: readonly MarketEvent[],
  asOfIso: string,
  researchIds: ReadonlySet<string>,
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
      <ul class="cal-list">${events.map((e) => eventRow(e, researchIds)).join("\n")}</ul>
    </section>`;
}

/** Date-grouped rows for one proximity band; multi-event dates stay visibly stacked. */
function bandPanel(
  band: (typeof BANDS)[number],
  upcoming: readonly MarketEvent[],
  asOfIso: string,
  researchIds: ReadonlySet<string>,
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
          .map(([date, evs]) => dayGroup(date, evs, asOfIso, researchIds))
          .join("\n");
  return `<section class="cal-band">
    <h2 class="cal-band-title">${band.title}</h2>
    <p class="cal-band-sub">${band.sub}</p>
    ${body}
  </section>`;
}

function summaryTiles(upcoming: readonly MarketEvent[], asOfIso: string): string {
  const next = upcoming[0];
  const weekCount = upcoming.filter((e) => daysUntil(asOfIso, e.date) <= 7).length;
  const nextPrint = upcoming.find((e) => e.kind === "earnings");
  const nextMacro = upcoming.find((e) => e.kind === "macro-print");
  const pair = (e: MarketEvent | undefined, label: (e: MarketEvent) => string): string =>
    e ? `${label(e)} <span class="unit">${shortDay(e.date)}</span>` : "—";
  return `<div class="summary">
    ${tile("Next event", next ? countdown(daysUntil(asOfIso, next.date)) : "—", { lead: true })}
    ${tile("Next 7 days", `${weekCount} <span class="unit">event${weekCount === 1 ? "" : "s"}</span>`)}
    ${tile(
      "Next print",
      pair(nextPrint, (e) => escapeHtml(e.symbols[0] ?? "")),
    )}
    ${tile(
      "Next macro",
      pair(nextMacro, (e) => escapeHtml(e.title.split(" ")[0] ?? "")),
    )}
  </div>`;
}

export function renderCalendarBody(options: CalendarViewOptions): string {
  const { asOfIso } = options;
  const upcoming = allEvents(asOfIso, options.events, options.prints);
  const researchIds = options.researchIds ?? new Set<string>();
  const month = resolveMonth(options.month, asOfIso, upcoming);
  const content = `${CAL_STYLE}${MG_STYLE}
  <div class="cal-layout">
  <div class="calendar">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Event horizon</h1>
        <p class="view-sub">Every dated thing that can move the names we trade — earnings prints, macro releases, sector checkpoints. Confirmed dates key action; estimates only widen caution.</p>
      </div>
    </div>
    ${summaryTiles(upcoming, asOfIso)}
    ${BANDS.map((band) => bandPanel(band, upcoming, asOfIso, researchIds)).join("\n")}
  </div>
  <aside class="cal-aside">${monthGrid(month, asOfIso, upcoming)}</aside>
  </div>
  <footer class="obs-foot">Dates hand-verified against primary sources (BLS, the Fed, company IR) and reviewed in diffs — hover any event for its audit trail. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}

/**
 * Calendar-only styles, kept out of dashboard-shell.ts (at its size budget; same doctrine as
 * desk-style.ts). Impact is encoded with accent weight — never green/red, which carry market
 * meaning only (docs/BRAND.md).
 */
const CAL_STYLE = `<style>
  .calendar{ display:flex; flex-direction:column; gap:16px; max-width:980px; }
  .calendar .summary{ margin-bottom:4px; }
  .cal-band{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 20px 12px; }
  .cal-band-title{ margin:0 0 4px; font-size:14px; font-weight:700; }
  .cal-band-sub{ margin:0 0 10px; font-size:12px; color:var(--muted); max-width:74ch; }
  .cal-empty{ font-size:13px; color:var(--muted); font-style:italic; padding:4px 0 8px; margin:0; }
  .cal-day{ padding:12px 0 6px; border-top:1px solid color-mix(in srgb,var(--border) 70%,transparent); scroll-margin-top:16px; }
  /* Widget jump links scroll the stage (the observatory's scrollport), smoothly unless motion is reduced. */
  @media (prefers-reduced-motion: no-preference){ .stage{ scroll-behavior:smooth; } }
  .cal-day:first-of-type{ border-top:0; padding-top:4px; }
  .cal-dayhead{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:2px; }
  .cal-date{ font-family:var(--mono); font-size:12.5px; font-weight:700; letter-spacing:.04em; }
  .cal-in{ font-family:var(--mono); font-size:10.5px; color:var(--muted); border:1px solid var(--border); border-radius:999px; padding:2px 8px; }
  .cal-near .cal-in{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  .cal-stack{ font-family:var(--mono); font-size:10px; letter-spacing:.08em; color:var(--accent); border:1px dashed color-mix(in srgb,var(--accent) 45%,var(--border)); border-radius:6px; padding:2px 7px; }
  .cal-list{ list-style:none; margin:0; padding:0; }
  .cal-ev{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; padding:8px 0 8px 10px; border-left:2px solid transparent; font-size:13px; }
  .cal-ev.imp-critical{ border-left-color:var(--accent); }
  .cal-ev.imp-high{ border-left-color:color-mix(in srgb,var(--accent) 45%,transparent); }
  .cal-kind{ font-family:var(--mono); font-size:9px; letter-spacing:.12em; padding:2px 7px; border-radius:999px; border:1px solid var(--border); color:var(--muted); white-space:nowrap; }
  .cal-ev.imp-critical .cal-kind{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  .cal-title{ color:var(--text); font-weight:600; }
  .cal-sym{ font-family:var(--mono); font-size:10.5px; font-weight:700; color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 35%,transparent); border-radius:5px; padding:1px 6px; text-decoration:none; }
  a.cal-sym:hover{ border-color:var(--accent); }
  .cal-research{ font-size:11.5px; white-space:nowrap; color:var(--accent); text-decoration:none; border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent); }
  .cal-research:hover{ border-bottom-color:var(--accent); }
  .cal-wide{ font-family:var(--mono); font-size:9.5px; letter-spacing:.1em; color:var(--muted); }
  .cal-est{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; color:var(--muted); border:1px dashed var(--muted); border-radius:5px; padding:1px 6px; }
  .cal-notes{ flex-basis:100%; font-size:12px; color:var(--muted); line-height:1.5; margin:0; }
</style>`;
