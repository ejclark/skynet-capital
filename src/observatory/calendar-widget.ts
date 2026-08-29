import type { MarketEvent } from "../domain/market-events.js";

/**
 * The MONTH-GRID widget for `/research`'s event horizon — the at-a-glance visual and jump-navigator
 * that fills the desktop right column (Eric, 2026-08-16: "a nice visual as well as a possible
 * control to navigate through calendar events"). The TradeZella-style month grid
 * docs/research/trading-desk-ux.md called the most-copied piece of delight in the category; v1
 * deferred it, this is it. (Originally `/calendar`'s widget; folded into the research shelf
 * 2026-08-25 — this module is reused as-is, only its own nav href moved.)
 *
 * A NAVIGATOR, NEVER A FILTER: the agenda always renders every upcoming event, so each event-day
 * cell is a plain `#day-YYYY-MM-DD` jump link whose anchor always exists. `?month=` moves only the
 * widget. Zero client JS — links and CSS; smooth scrolling is a reduced-motion-guarded CSS rule in
 * the view. Markers are accent-weight only (docs/BRAND.md: green/red carry market meaning), and
 * every class is `mg-`-prefixed so widget markup can never collide with the agenda's
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
    ? `<a class="mg-nav" href="/research?month=${target}" aria-label="${label}">${label === "Previous month" ? "‹" : "›"}</a>`
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
  </div>${selectedDayRules([...byDate.keys()].filter((d) => d.startsWith(month)))}`;
}

/**
 * The CALENDAR half of the day-selection correlation (Eric, 2026-08-25: "when clicking on the
 * calendar, more visual indication should be presented to correlate the date-related events with
 * the date(s) selected"). The agenda half is `.cal-day:target` in event-agenda.ts.
 *
 * CSS cannot walk from a `:target` back to the link that points at it, so the server — which
 * already knows the month's event dates — emits one `:has()` rule per event day. `.research` wraps
 * both the grid and the agenda's `#day-*` anchors (research-view.ts), so the relationship resolves
 * there. Bounded by construction: at most one rule per event day in the visible month.
 *
 * Still a navigator, never a filter — this only paints the cell; nothing is hidden or reordered.
 */
function selectedDayRules(dates: readonly string[]): string {
  if (dates.length === 0) return "";
  const rules = dates
    .map(
      (d) =>
        `.research:has(#day-${d}:target) a.mg-cell[href="#day-${d}"]{ background:var(--accent); color:var(--bg); border-color:var(--accent); font-weight:700; }
      .research:has(#day-${d}:target) a.mg-cell[href="#day-${d}"]::after{ background:var(--bg); }
      .research:has(#day-${d}:target) a.mg-cell[href="#day-${d}"] .mg-count{ color:var(--bg); }`,
    )
    .join("\n      ");
  return `<style>${rules}</style>`;
}
