import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { type BookDesk, type BookEvent, type BookEvents, optionName } from "./book-events";
import { addDays, type DayRange, daysOf, inRange, rangeFor } from "./horizon-range";
import { held } from "./quantity";

/**
 * THE CALENDAR OF WHAT YOU HOLD, AS LANES (#5074; #5037 round 2, the calendar's R2 — Eric picked
 * it 2026-10-10: "I love high fidelity interactive widgets for specialized tasks. Simple and
 * effective with a beautiful and delightful experience."). The pure half of the Events section's
 * picture: one lane per position plus a market-wide lane, days across, one glyph per day a lane
 * has something on — the shape carries the meaning, the key under the picture names it in words
 * (hue never alone, docs/BRAND.md → Accessibility):
 *
 *   ⧗ decide   a decision due on that position (a decision card's due day; an hourglass, since
 *              ▲ is Consider on the rows, #5083)
 *   ◆ confirmed  a dated event on what you hold — a print, an option's expiry, a named event
 *   ◇ estimated  the same, on a cadence estimate rather than a confirmed day
 *   ○ market   a headline macro print (the market-wide lane only)
 *
 * Which lane an event lands on: a decision or an expiry on the exact contract it names; an event
 * on a held name on every position in that name that is still alive that day (an earnings print
 * after a put expires is not that put's); a market-wide print on the market lane. Two events on
 * one lane and day are one mark, the decision first.
 *
 * A lane whose next date is past the range pins it at the lane's edge (`nextAfter`), and the
 * section moves the range onto it in one tap — "what's coming" leads, never a blank lane. A
 * holding with nothing in the range and nothing after it folds into one line of names, so twelve
 * holdings never become twelve empty tracks (the round-2 red pass's rule).
 */

export type LaneGlyph = "decide" | "confirmed" | "estimated" | "market";

/** The glyph a day's mark draws — the event's tier, and for a held event whether it's estimated. */
export const glyphOf = (event: BookEvent): LaneGlyph =>
  event.tier === "decide"
    ? "decide"
    : event.tier === "market"
      ? "market"
      : event.estimated
        ? "estimated"
        : "confirmed";

const RANK: Record<LaneGlyph, number> = { decide: 0, confirmed: 1, estimated: 2, market: 3 };

/** The headline prints by their plain short names — the lane is too narrow for "FOMC decision". */
function macroWord(event: BookEvent): string {
  const text = `${event.id} ${event.title}`;
  if (/fomc|\bfed\b/i.test(text)) return "Fed";
  if (/\bcpi\b/i.test(text)) return "CPI";
  if (/jobs|employment/i.test(text)) return "Jobs";
  return event.title;
}

/** The few words drawn beside a mark: what happens, never the holding (the lane names it). */
export function markWords(event: BookEvent): string {
  const estimate = event.estimated ? " · estimated" : "";
  if (event.tier === "market") return macroWord(event);
  if (event.mark) return `${event.mark}${estimate}`;
  if (/earnings/i.test(event.title)) return `Earnings${estimate}`;
  const symbol = event.touches[0]?.symbol;
  return symbol && event.title.startsWith(`${symbol} `)
    ? event.title.slice(symbol.length + 1)
    : event.title;
}

export interface LaneMark {
  readonly date: string;
  readonly glyph: LaneGlyph;
  readonly words: string;
  /** Every event on this lane that day, the one drawn first. */
  readonly events: readonly BookEvent[];
}

export interface Lane {
  readonly key: string;
  /** "NVDA", "CRWV $80 short put", "Market-wide". */
  readonly name: string;
  /** "130 shares", "29d", "2 contracts · 29d" — absent on the market lane. */
  readonly detail?: string;
  /** The days in the range this lane has something on, in date order. */
  readonly marks: readonly LaneMark[];
  /** The first day after the range — pinned at the lane's edge. */
  readonly nextAfter?: LaneMark;
}

export interface BookLanes {
  readonly holdings: readonly Lane[];
  /** Holdings with nothing in the range and nothing after it, by name — one line, never lanes. */
  readonly folded: readonly string[];
  readonly market: Lane;
}

interface Slot {
  readonly key: string;
  readonly deskId: string;
  readonly symbol: string;
  readonly underlying: string;
  /** An option's last day alive; absent for shares. */
  readonly expiry?: string;
  readonly name: string;
  readonly detail: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

const plural = (n: number, one: string): string =>
  `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;

function slotOf(
  deskId: string,
  position: BookDesk["desk"]["positions"][number],
  today: string,
  account: string | undefined,
): Slot {
  const { count, short } = held(position.quantity);
  const occ = parseOccSymbol(position.symbol);
  const left = occ ? daysBetween(today, occ.expiration) : 0;
  const life = left < 0 ? "expired" : left === 0 ? "expires today" : `${String(left)}d`;
  const size = occ
    ? [count === 1 ? null : plural(count, "contract"), life].filter(Boolean).join(" · ")
    : `${plural(count, "share")}${short ? " short" : ""}`;
  return {
    key: `${deskId} ${position.symbol}`,
    deskId,
    symbol: position.symbol,
    underlying: occ?.underlying ?? position.symbol,
    ...(occ ? { expiry: occ.expiration } : {}),
    name: optionName(position.symbol, position.quantity) ?? position.symbol,
    detail: account ? `${size} · ${account}` : size,
  };
}

/** The positions an event on what you hold lands on. */
function slotsFor(event: BookEvent, slots: readonly Slot[]): readonly Slot[] {
  const on = event.on;
  const exact = on ? slots.filter((s) => s.deskId === on.deskId && s.symbol === on.symbol) : [];
  if (exact.length > 0) return exact;
  return slots.filter(
    (s) =>
      event.touches.some((t) => t.deskId === s.deskId && t.symbol === s.underlying) &&
      (s.expiry === undefined || event.date <= s.expiry),
  );
}

/** One mark per day, the highest-ranked event drawn — a decision before the print it is about. */
function marksOf(events: readonly BookEvent[]): LaneMark[] {
  const byDate = new Map<string, BookEvent[]>();
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, day]) => {
      const sorted = [...day].sort((a, b) => RANK[glyphOf(a)] - RANK[glyphOf(b)]);
      const first = sorted[0] as BookEvent;
      return { date, glyph: glyphOf(first), words: markWords(first), events: sorted };
    });
}

function laneOf(
  key: string,
  name: string,
  detail: string | undefined,
  events: readonly BookEvent[],
  range: DayRange,
): Lane {
  const marks = marksOf(events);
  const nextAfter = marks.find((m) => m.date > range.end);
  return {
    key,
    name,
    ...(detail ? { detail } : {}),
    marks: marks.filter((m) => inRange(m.date, range)),
    ...(nextAfter ? { nextAfter } : {}),
  };
}

/**
 * The lanes for `range`, from the book's events at every date (`bookEventsIn` over the all
 * range): the in-range marks, and each lane's next date after it. `accounts` names each desk when
 * more than one is in view, so two books' NVDA never read as one.
 */
export function bookLanes({
  desks,
  events,
  range,
  today,
  accounts,
}: {
  readonly desks: readonly BookDesk[];
  readonly events: Pick<BookEvents, "decide" | "held" | "market">;
  readonly range: DayRange;
  readonly today: string;
  readonly accounts?: ReadonlyMap<string, string>;
}): BookLanes {
  const many = desks.length > 1;
  const slots = desks.flatMap(({ desk }) =>
    desk.positions.map((p) =>
      slotOf(desk.id, p, today, many ? (accounts?.get(desk.id) ?? desk.id) : undefined),
    ),
  );
  const perSlot = new Map<string, BookEvent[]>(slots.map((s) => [s.key, []]));
  for (const event of [...events.decide, ...events.held])
    for (const slot of slotsFor(event, slots)) perSlot.get(slot.key)?.push(event);
  const lanes = slots.map((s) => laneOf(s.key, s.name, s.detail, perSlot.get(s.key) ?? [], range));
  const shown = lanes.filter((l) => l.marks.length > 0 || l.nextAfter);
  return {
    holdings: shown,
    folded: lanes.filter((l) => !shown.includes(l)).map((l) => l.name),
    market: laneOf("market", "Market-wide", undefined, events.market, range),
  };
}

/** How many days in `range` carry something on what you hold — the count a range option shows.
 *  Market-wide prints never count: every book has those. */
export function datesOnBook(events: Pick<BookEvents, "decide" | "held">, range: DayRange): number {
  const days = new Set<string>();
  for (const event of [...events.decide, ...events.held])
    if (inRange(event.date, range)) days.add(event.date);
  return days.size;
}

/** The three ranges the Profile page offers — Day is a tap on the picture, and an unbounded range
 *  has no picture to draw. */
export type BookLens = "week" | "month" | "quarter";
export const BOOK_LENSES: readonly BookLens[] = ["week", "month", "quarter"];

/** The shared lens as this page draws it: a day reads its week (with the day picked), the all
 *  lens reads the month the arrows already page by. */
export const bookLens = (lens: string): BookLens =>
  lens === "week" || lens === "month" || lens === "quarter"
    ? lens
    : lens === "day"
      ? "week"
      : "month";

/** Each option's count around the same anchor, so a member picks a range that holds something. */
export function countsAround(
  events: Pick<BookEvents, "decide" | "held">,
  anchor: string,
): Record<BookLens, number> {
  return {
    week: datesOnBook(events, rangeFor(anchor, "week")),
    month: datesOnBook(events, rangeFor(anchor, "month")),
    quarter: datesOnBook(events, rangeFor(anchor, "quarter")),
  };
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const at = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

export interface AxisTick {
  readonly index: number;
  readonly label: string;
}

/**
 * The picture's days and their axis: every calendar day in the range, a tick and a rule where
 * the eye needs one — each day on a week ("Mon 5"), each Monday on a month ("Oct 5", "12", …),
 * each month's first day on a quarter ("Oct", "Nov", "Dec").
 */
export function axisFor(
  range: DayRange,
  lens: BookLens,
): { readonly days: readonly string[]; readonly ticks: readonly AxisTick[] } {
  const days = daysOf(range);
  const ticks: AxisTick[] = [];
  days.forEach((day, index) => {
    const d = at(day);
    if (lens === "week") ticks.push({ index, label: `${WEEKDAY.format(d)} ${d.getUTCDate()}` });
    else if (lens === "quarter" && d.getUTCDate() === 1)
      ticks.push({ index, label: MONTH.format(d) });
    else if (lens === "month" && d.getUTCDay() === 1)
      ticks.push({
        index,
        label: ticks.length === 0 ? `${MONTH.format(d)} ${d.getUTCDate()}` : String(d.getUTCDate()),
      });
  });
  return { days, ticks };
}

/**
 * Where each mark's words go: after the glyph when they fit before the next mark and the track's
 * end, before it when they fit after the previous words, else nowhere — the list under the picture
 * says every date in words, so a crowded lane draws glyphs only. Widths are estimated from the
 * character count at the label's size, which is all a 12px label needs.
 */
export function placeWords(
  marks: readonly { readonly index: number; readonly words: string }[],
  days: number,
  width: number,
  charPx = 6.4,
  pad = 9,
): readonly ("after" | "before" | null)[] {
  const step = width / Math.max(days, 1);
  const centre = (i: number): number => (i + 0.5) * step;
  let free = 0;
  return marks.map((mark, i) => {
    const x = centre(mark.index);
    const need = mark.words.length * charPx;
    const next = marks[i + 1];
    const limit = next ? centre(next.index) - pad : width;
    if (x + pad + need <= limit) {
      free = x + pad + need + pad;
      return "after";
    }
    if (x - pad - need >= free) {
      free = x + pad;
      return "before";
    }
    free = x + pad;
    return null;
  });
}

/**
 * Where each tile sits across the track, in px — the centres of one lane's marks, in date order.
 * A tile is wider than a day on a month or a quarter (22px against ~11px or ~4px at 390), so two
 * dates a day or two apart on one lane would stack and the later tile would cover the earlier
 * glyph: a decide-by the day before the print it is about went half under it on a month and
 * wholly under it on a quarter (#5098's review). Marks whose tiles would touch spread to `size`
 * apart around their days' middle, never past the track's inset or their own outermost day; a
 * mark with room stays on its day. The list under the picture still says each date in words.
 */
export function spreadTiles(
  centres: readonly number[],
  size: number,
  width: number,
): readonly number[] {
  interface Run {
    readonly count: number;
    readonly sum: number;
    readonly lo: number;
    readonly hi: number;
  }
  const startOf = (run: Run): number => {
    const span = (run.count - 1) * size;
    const lower = Math.min(size / 2, run.lo);
    const upper = Math.max(width - size / 2, run.hi) - span;
    return Math.max(Math.min(run.sum / run.count - span / 2, upper), lower);
  };
  const runs: Run[] = [];
  for (const centre of centres) {
    let run: Run = { count: 1, sum: centre, lo: centre, hi: centre };
    let prev = runs.at(-1);
    while (prev && startOf(prev) + prev.count * size > startOf(run)) {
      runs.pop();
      run = { count: prev.count + run.count, sum: prev.sum + run.sum, lo: prev.lo, hi: run.hi };
      prev = runs.at(-1);
    }
    runs.push(run);
  }
  return runs.flatMap((run) =>
    Array.from({ length: run.count }, (_, k) => startOf(run) + k * size),
  );
}

/** "today", "tomorrow", "in 29 days" — how far off a date is, in words. */
export function inDays(today: string, date: string): string {
  const n = daysBetween(today, date);
  return n <= 0 ? "today" : n === 1 ? "tomorrow" : `in ${String(n)} days`;
}

/** The day before `iso` — `nextOnBook` counts strictly after, and today is still ahead. */
export const dayBefore = (iso: string): string => addDays(iso, -1);
