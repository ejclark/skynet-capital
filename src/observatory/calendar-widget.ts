import type { MarketEvent } from "../domain/market-events.js";

/**
 * The MONTH-GRID widget for `/calendar` — the at-a-glance visual and jump-navigator that fills the
 * desktop right column (Eric, 2026-08-16: "a nice visual as well as a possible control to navigate
 * through calendar events"). The TradeZella-style month grid docs/research/trading-desk-ux.md
 * called the most-copied piece of delight in the category; v1 deferred it, this is it.
 *
 * A NAVIGATOR, NEVER A FILTER: the agenda always renders every upcoming event, so each event-day
 * cell is a plain `#day-YYYY-MM-DD` jump link whose anchor always exists. `?month=` moves only the
 * widget. Zero client JS — links and CSS; smooth scrolling is a reduced-motion-guarded CSS rule in
 * the view. Markers are accent-weight only (docs/BRAND.md: green/red carry market meaning), and
 * every class is `mg-`/`cal-layout`-prefixed so widget markup can never collide with the agenda's
 * `cal-*` marker strings that specs count.
 *
 * Weeks start MONDAY: this is a trading calendar — the five trading days stay contiguous and the
 * (event-empty) weekend sits at the right edge. All math is UTC date-only, as-of always injected.
 */

/** "YYYY-MM" of an ISO timestamp or date. */
export const monthOf = (iso: string): string => iso.slice(0, 7);

/** Strict "YYYY-MM" or undefined — the widget's only untrusted input (the query param). */
export function parseMonth(raw: string | null | undefined): string | undefined {
  return raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : undefined;
}

/** Month arithmetic without Date: "2026-12" + 1 → "2027-01". */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const total = y * 12 + (m - 1) + delta;
  const year = Math.floor(total / 12);
  const mm = String((total % 12) + 1).padStart(2, "0");
  return `${year}-${mm}`;
}

/** The navigable range: from the as-of month to the last upcoming event's month. */
function navBounds(asOfIso: string, events: readonly MarketEvent[]): [string, string] {
  const first = monthOf(asOfIso);
  const last = events.reduce((max, e) => (monthOf(e.date) > max ? monthOf(e.date) : max), first);
  return [first, last];
}

/**
 * The single seam the view calls: parse the raw param, fall back to the as-of month, clamp into
 * the navigable range. YYYY-MM compares correctly as a string.
 */
export function resolveMonth(
  raw: string | null | undefined,
  asOfIso: string,
  events: readonly MarketEvent[],
): string {
  const [first, last] = navBounds(asOfIso, events);
  const wanted = parseMonth(raw) ?? first;
  if (wanted < first) return first;
  if (wanted > last) return last;
  return wanted;
}

/** "August 2026" — the widget's own formatter (distinct from the agenda's day formatters). */
function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function navLink(target: string, label: string, enabled: boolean): string {
  return enabled
    ? `<a class="mg-nav" href="/calendar?month=${target}" aria-label="${label}">${label === "Previous month" ? "‹" : "›"}</a>`
    : `<span class="mg-nav mg-off" aria-hidden="true">${label === "Previous month" ? "‹" : "›"}</span>`;
}

/** One day cell: inert `<span>` without events, jump-link `<a>` with them. */
function dayCell(
  date: string,
  dayNum: number,
  today: string,
  dayEvents: readonly MarketEvent[],
): string {
  const classes = ["mg-cell"];
  if (date === today) classes.push("mg-today");
  if (date < today) classes.push("mg-past");
  if (dayEvents.length === 0) {
    return `<span class="${classes.join(" ")}">${dayNum}</span>`;
  }
  classes.push("mg-evt");
  // Only the top tier changes the marker — a day is "critical" if any event on it is.
  if (dayEvents.some((e) => e.impact === "critical")) {
    classes.push("mg-crit");
  }
  const count = dayEvents.length > 1 ? `<i class="mg-count">${dayEvents.length}</i>` : "";
  const label = `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`;
  return `<a class="${classes.join(" ")}" href="#day-${date}" title="${label}">${dayNum}${count}</a>`;
}

/**
 * One month as a 7-column grid card. `events` is the already-filtered upcoming list the agenda
 * renders, so widget and agenda agree by construction.
 */
export function monthGrid(month: string, asOfIso: string, events: readonly MarketEvent[]): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leadingBlanks = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday-indexed
  const today = asOfIso.slice(0, 10);
  const [first, last] = navBounds(asOfIso, events);

  const byDate = new Map<string, MarketEvent[]>();
  for (const e of events) {
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }

  const cells: string[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(`<span class="mg-cell mg-blank"></span>`);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    cells.push(dayCell(date, d, today, byDate.get(date) ?? []));
  }

  const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    .map((w) => `<span class="mg-wd">${w}</span>`)
    .join("");
  return `<div class="mg">
    <header class="mg-head">
      ${navLink(addMonths(month, -1), "Previous month", month > first)}
      <span class="mg-title">${monthTitle(month)}</span>
      ${navLink(addMonths(month, 1), "Next month", month < last)}
    </header>
    <div class="mg-grid">${weekdays}${cells.join("")}</div>
    <p class="mg-legend">● event day · brighter = critical · click a day to jump</p>
  </div>`;
}

/**
 * Widget + two-column layout styles. Sticky works because the observatory's scrollport is `.stage`
 * (dashboard-shell.ts), not the window. Below 1120px (≈ drawer + agenda width) the aside hides —
 * on small screens the agenda IS the navigation.
 */
export const MG_STYLE = `<style>
  .cal-layout{ display:grid; grid-template-columns:minmax(0,980px) 300px; gap:24px; align-items:start; }
  .cal-aside{ position:sticky; top:16px; }
  .mg{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 16px 12px; }
  .mg-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
  .mg-title{ font-family:var(--mono); font-size:12px; font-weight:700; letter-spacing:.08em; }
  .mg-nav{ font-family:var(--mono); font-size:14px; line-height:1; color:var(--muted); text-decoration:none;
    width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); border-radius:7px;
    transition:color .15s, border-color .15s; }
  a.mg-nav:hover{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  a.mg-nav:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .mg-off{ opacity:.35; }
  .mg-grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .mg-wd{ font-family:var(--mono); font-size:9px; letter-spacing:.08em; color:var(--muted); text-align:center; padding:4px 0 6px; }
  .mg-cell{ position:relative; aspect-ratio:1; display:flex; align-items:center; justify-content:center;
    font-family:var(--mono); font-size:11px; color:var(--text); border:1px solid transparent; border-radius:7px; text-decoration:none; }
  .mg-blank{ visibility:hidden; }
  .mg-past{ color:color-mix(in srgb,var(--muted) 45%,transparent); }
  .mg-today{ border-color:var(--accent); }
  .mg-evt{ background:color-mix(in srgb,var(--accent) 7%,transparent); }
  .mg-evt::after{ content:""; position:absolute; bottom:3px; left:50%; transform:translateX(-50%);
    width:4px; height:4px; border-radius:50%; background:color-mix(in srgb,var(--accent) 55%,transparent); }
  .mg-crit{ background:color-mix(in srgb,var(--accent) 14%,transparent); }
  .mg-crit::after{ background:var(--accent); box-shadow:0 0 5px color-mix(in srgb,var(--accent) 60%,transparent); }
  a.mg-evt:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  a.mg-evt:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
  .mg-count{ position:absolute; top:2px; right:3px; font-style:normal; font-size:8px; font-weight:700; color:var(--accent); }
  .mg-legend{ margin:10px 0 0; font-family:var(--mono); font-size:9.5px; letter-spacing:.03em; color:var(--muted); }
  @media (max-width:1120px){ .cal-layout{ grid-template-columns:1fr; } .cal-aside{ display:none; } }
</style>`;
