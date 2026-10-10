import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import type { Decision, DeskPosition } from "./desk";
import { type DayRange, inRange } from "./horizon-range";
import { held } from "./quantity";
import {
  callForLens,
  type HorizonRow,
  type Lens,
  type ResearchCall,
  type ResearchEvent,
} from "./research";

/**
 * EVENTS ON YOUR BOOK (#3807 slice 2c, the co-location — `docs/IA.md` §8): the market calendar's
 * events joined to what a book holds, for the Profile page's Events section (and, with no corpus,
 * the Overview's next-date line, `held-events-line.tsx`). It reads the research corpus itself
 * (`/api/research/calendar` — every dated event, earnings prints included), so a month with two
 * events on one name shows both, in two tiers:
 *
 *   held    an event naming a ticker the book holds (an option counts as its underlying)
 *   market  the headline macro prints every position feels — the Fed decision, CPI, the jobs
 *           report — the same three `src/observatory/position-event.ts` names, by the same ids
 *
 * Nothing else on the calendar enters (auctions, PMIs, a sector event with no held name): this is
 * the book's calendar, and R&D is the full board. THIN, AND SAID SO: 31 of 1184 event records
 * carry a symbol and ten prints are dated, so most books read one or two held days a month — the
 * section counts what it has and links out rather than padding.
 *
 * THE BOOK'S OWN DAYS (#3977 slice 4): two per-member dates the desk payload carries, joined here
 * on the client — never on the shared `/api/research/calendar` (#4204), which every member reads:
 *
 *   decide  a "Needs a decision" card's `due` day — the stock's own event while it can still move
 *           the position, else the option's expiry. A third tier, so the grid can mark it apart.
 *   print   a held name's `nextPrint`, whenever it lands — a held-tier row when the corpus has no
 *           print for that name on that day. An estimated date says so in words ("estimated
 *           date"); an `unknown` print has no day and gets no row.
 *   expiry  an option's own expiration (#5074) — a held-tier row unless a decision is already due
 *           that day on that contract, so the calendar of what you hold never skips the one date
 *           every option carries.
 *
 * NO FAKE DATES. A playbook store card's window ("D-20 to D-6") is relative to a print, not a day
 * (`playbook-store.ts`), so ideas carry no `due` and are never placed on a day here.
 *
 * A position's own `nextEvent` backs the corpus up: when the research payload is missing (the
 * endpoint unreachable, an older server), each position's server-joined event still lands on its
 * day, so the section degrades to exactly what the Overview's line already shows.
 */

/** The headline macro prints by the calendar's stable id prefixes (`position-event.ts`). */
const HEADLINE_MACRO = ["fomc-2", "cpi-2", "jobs-2"] as const;

export const isHeadlineMacro = (event: Pick<ResearchEvent, "id" | "symbols">): boolean =>
  event.symbols.length === 0 && HEADLINE_MACRO.some((prefix) => event.id.startsWith(prefix));

/** What the join needs of a desk payload — `DeskSnapshot` fits. */
export interface BookDesk {
  readonly desk: {
    readonly id: string;
    readonly positions: readonly Pick<
      DeskPosition,
      "symbol" | "isOption" | "quantity" | "nextEvent" | "nextPrint"
    >[];
    readonly decisions?: readonly Pick<Decision, "id" | "symbol" | "display" | "title" | "due">[];
  };
}

/** One held name on one account, summarised for an agenda row: symbol · qty · next expiry. */
export interface TouchedPosition {
  readonly deskId: string;
  /** The ticker (an option's underlying). */
  readonly symbol: string;
  /** The blotter row to land on — `#pos-<rowSymbol>` on the Overview. */
  readonly rowSymbol: string;
  /** Shares held on this name (0 when only options). */
  readonly shares: number;
  /** Option contracts held on this name. */
  readonly contracts: number;
  /** The soonest option expiry on this name, `YYYY-MM-DD`; absent for shares only. */
  readonly expiry?: string;
}

export interface BookEvent {
  readonly id: string;
  readonly title: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly tier: "held" | "market" | "decide";
  /** A cadence estimate, not a confirmed day — drawn hollow (◇) and said in words. */
  readonly estimated?: true;
  /** The few words a lane draws beside its glyph ("Expires", "Earnings"); the holding is the
   *  lane's own name. */
  readonly mark?: string;
  /** The event in one short phrase, for a line that names it alone ("CRWV $80 short put
   *  expires"); the title when absent. */
  readonly what?: string;
  /** The one position it is about — a decision's contract, an option's expiry. */
  readonly on?: { readonly deskId: string; readonly symbol: string };
  /** The held names it lands on — for a market-wide print, the ones it is the next event for
   *  (it moves all of them; these are the ones with nothing sooner of their own). */
  readonly touches: readonly TouchedPosition[];
  /** The ledger's call under the lens in force, when the event is researched and states one. */
  readonly call?: HorizonRow & { readonly href: string };
}

export interface BookEvents {
  /** Decision cards due in range — their own tier, so the grid marks the day apart (▲). */
  readonly decide: readonly BookEvent[];
  readonly held: readonly BookEvent[];
  readonly market: readonly BookEvent[];
  /** Open positions across the desks read — zero is its own honest state. */
  readonly positions: number;
}

/** The ticker an event belongs to: an option's underlying, else the symbol itself. */
export const underlyingOf = (symbol: string): string =>
  parseOccSymbol(symbol)?.underlying ?? symbol;

/** "CRWV $80 short put" — an option position in plain words, its side from the quantity's sign;
 *  undefined for shares. */
export function optionName(symbol: string, quantity: string): string | undefined {
  const occ = parseOccSymbol(symbol);
  if (!occ) return undefined;
  const side = held(quantity).short ? "short" : "long";
  return `${occ.underlying} ${occStrikeLabel(occ.strike)} ${side} ${occ.type}`;
}

/** Every held name per account, in blotter order: shares, contracts, the soonest expiry. */
export function touchedPositions(desks: readonly BookDesk[]): TouchedPosition[] {
  const byKey = new Map<string, TouchedPosition>();
  for (const { desk } of desks) {
    for (const position of desk.positions) {
      const symbol = underlyingOf(position.symbol);
      const key = `${desk.id} ${symbol}`;
      const seen = byKey.get(key) ?? {
        deskId: desk.id,
        symbol,
        rowSymbol: position.symbol,
        shares: 0,
        contracts: 0,
      };
      const expiry = position.isOption ? parseOccSymbol(position.symbol)?.expiration : undefined;
      const qty = held(position.quantity).count;
      byKey.set(key, {
        ...seen,
        shares: seen.shares + (position.isOption ? 0 : qty),
        contracts: seen.contracts + (position.isOption ? qty : 0),
        ...(expiry && !(seen.expiry && seen.expiry <= expiry) ? { expiry } : {}),
      });
    }
  }
  return [...byKey.values()];
}

const byDay = (a: BookEvent, b: BookEvent): number =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : a.title.localeCompare(b.title);

/**
 * The held names whose NEXT dated event (the server's join) is the market-wide print on `date` —
 * a macro print moves every position, but these are the ones it is the next thing for, so the
 * agenda row can land on one of them instead of on a list of everything.
 */
function nextFor(
  desks: readonly BookDesk[],
  touched: readonly TouchedPosition[],
  date: string,
): TouchedPosition[] {
  return touched.filter((t) =>
    desks.some(
      ({ desk }) =>
        desk.id === t.deskId &&
        desk.positions.some(
          (p) =>
            underlyingOf(p.symbol) === t.symbol &&
            p.nextEvent?.scope === "market" &&
            p.nextEvent.at === date,
        ),
    ),
  );
}

/** "Earnings Oct 28" → "Earnings": the server's label without its trailing date. */
const undated = (label: string): string => label.replace(/\s+[A-Z][a-z]{2} \d{1,2}$/, "");

/** The backstop: a position's server-joined event the corpus did not deliver, added in place. */
function backstop(
  desks: readonly BookDesk[],
  range: DayRange,
  touched: readonly TouchedPosition[],
  held: BookEvent[],
  market: BookEvent[],
): void {
  for (const { desk } of desks) {
    for (const position of desk.positions) {
      const next = position.nextEvent;
      if (!(next && inRange(next.at, range))) continue;
      const symbol = underlyingOf(position.symbol);
      const known =
        next.scope === "stock"
          ? held.some((e) => e.date === next.at && e.touches.some((t) => t.symbol === symbol))
          : market.some((e) => e.date === next.at);
      if (known) continue;
      if (next.scope === "stock")
        held.push({
          id: `next ${symbol} ${next.at}`,
          title: `${symbol} ${undated(next.label).toLowerCase()}`,
          date: next.at,
          tier: "held",
          mark: undated(next.label),
          touches: touched.filter((t) => t.symbol === symbol),
        });
      else
        market.push({
          id: `next market ${next.at}`,
          title: undated(next.label),
          date: next.at,
          tier: "market",
          touches: nextFor(desks, touched, next.at),
        });
    }
  }
}

/** " (estimated date)" when the day is a cadence estimate — said in words, never styled alone. */
const estimateNote = (estimated: boolean): string => (estimated ? " (estimated date)" : "");

/**
 * Each held name's next earnings print (`nextPrint`) the corpus did not already put on that day.
 * Runs before the `nextEvent` backstop, so a print both carry lands once, with its estimate flag.
 */
function prints(
  desks: readonly BookDesk[],
  range: DayRange,
  touched: readonly TouchedPosition[],
  held: BookEvent[],
): void {
  for (const { desk } of desks) {
    for (const position of desk.positions) {
      const print = position.nextPrint;
      if (!print || print.status === "unknown" || !inRange(print.at, range)) continue;
      const symbol = underlyingOf(position.symbol);
      if (held.some((e) => e.date === print.at && e.touches.some((t) => t.symbol === symbol)))
        continue;
      held.push({
        id: `print ${symbol} ${print.at}`,
        title: `${symbol} earnings${estimateNote(print.status === "estimate")}`,
        date: print.at,
        tier: "held",
        ...(print.status === "estimate" ? { estimated: true as const } : {}),
        mark: "Earnings",
        what: `${symbol} earnings`,
        touches: touched.filter((t) => t.symbol === symbol),
      });
    }
  }
}

type BookDecision = NonNullable<BookDesk["desk"]["decisions"]>[number];

/** One decision's due day as a `decide` event: its card's words for the list, a short phrase for a
 *  line, and the few words a lane draws. */
function decideEvent(
  desk: BookDesk["desk"],
  decision: BookDecision,
  due: NonNullable<BookDecision["due"]>,
  touched: readonly TouchedPosition[],
): BookEvent {
  const symbol = underlyingOf(decision.symbol);
  const held = desk.positions.find((p) => p.symbol === decision.symbol);
  const name = (held && optionName(held.symbol, held.quantity)) ?? decision.display;
  const expiry = due.reason === "expiry";
  return {
    id: `decide ${desk.id} ${decision.id}`,
    title: `${decision.display} — ${decision.title} (${due.label}${due.estimated ? ", estimated date" : ""})`,
    date: due.at,
    tier: "decide",
    ...(due.estimated ? { estimated: true as const } : {}),
    mark: expiry ? "Expires" : undated(due.label),
    what: expiry ? `${name} expires` : `${symbol} ${undated(due.label).toLowerCase()}`,
    on: { deskId: desk.id, symbol: decision.symbol },
    touches: touched.filter((t) => t.deskId === desk.id && t.symbol === symbol),
  };
}

/** Every "Needs a decision" card with a `due` day in range, landing on its held name. */
function dueDecisions(
  desks: readonly BookDesk[],
  range: DayRange,
  touched: readonly TouchedPosition[],
): BookEvent[] {
  const out: BookEvent[] = [];
  for (const { desk } of desks)
    for (const decision of desk.decisions ?? [])
      if (decision.due && inRange(decision.due.at, range))
        out.push(decideEvent(desk, decision, decision.due, touched));
  return out;
}

/** Each option's expiration in range — unless a decision is already due on that contract that
 *  day, which names the same date with what to do about it. */
function expiries(
  desks: readonly BookDesk[],
  range: DayRange,
  touched: readonly TouchedPosition[],
  decide: readonly BookEvent[],
): BookEvent[] {
  const out: BookEvent[] = [];
  for (const { desk } of desks) {
    for (const position of desk.positions) {
      const occ = parseOccSymbol(position.symbol);
      if (!(occ && inRange(occ.expiration, range))) continue;
      const covered = decide.some(
        (e) =>
          e.date === occ.expiration && e.on?.deskId === desk.id && e.on.symbol === position.symbol,
      );
      if (covered) continue;
      const name = optionName(position.symbol, position.quantity) ?? position.symbol;
      out.push({
        id: `expiry ${desk.id} ${position.symbol}`,
        title: `${name} expires`,
        date: occ.expiration,
        tier: "held",
        mark: "Expires",
        on: { deskId: desk.id, symbol: position.symbol },
        // The row link lands on the contract itself, not the name's first row.
        touches: touched
          .filter((t) => t.deskId === desk.id && t.symbol === occ.underlying)
          .map((t) => ({ ...t, rowSymbol: position.symbol })),
      });
    }
  }
  return out;
}

/**
 * The book's events in `range`: the decisions due, the corpus's events naming a held ticker, each
 * held name's next print, each option's expiry, the headline macro prints, and — as the backstop —
 * any position's own `nextEvent` the corpus did not carry.
 */
export function bookEventsIn({
  desks,
  events,
  calls,
  range,
  lens,
}: {
  readonly desks: readonly BookDesk[];
  readonly events: readonly ResearchEvent[];
  readonly calls: readonly ResearchCall[];
  readonly range: DayRange;
  readonly lens: Lens;
}): BookEvents {
  const touched = touchedPositions(desks);
  const callById = new Map(calls.map((call) => [call.eventId, call] as const));
  const callOf = (id: string): BookEvent["call"] => {
    const call = callById.get(id);
    const row = call ? callForLens(call, lens) : null;
    return call && row ? { ...row, href: call.href } : undefined;
  };
  const held: BookEvent[] = [];
  const market: BookEvent[] = [];
  for (const event of events) {
    if (!inRange(event.date, range)) continue;
    const touches = touched.filter((t) => event.symbols.includes(t.symbol));
    const call = callOf(event.id);
    const base = { id: event.id, title: event.title, date: event.date, ...(call ? { call } : {}) };
    if (touches.length > 0) held.push({ ...base, tier: "held", touches });
    else if (isHeadlineMacro(event))
      market.push({ ...base, tier: "market", touches: nextFor(desks, touched, event.date) });
  }
  prints(desks, range, touched, held);
  backstop(desks, range, touched, held, market);
  const decide = dueDecisions(desks, range, touched);
  held.push(...expiries(desks, range, touched, decide));
  return {
    decide: decide.sort(byDay),
    held: held.sort(byDay),
    market: market.sort(byDay),
    positions: desks.reduce((n, { desk }) => n + desk.positions.length, 0),
  };
}

/**
 * THE NEXT DAY ON WHAT YOU HOLD (#5045): the earliest decision due or held-name event dated after
 * `after` (a range's last day) — what an empty range names, so a quiet week never reads as
 * "nothing coming" while a print sits three weeks out. Market-wide prints never count: every book
 * has those. On one day a decision leads, since it is the one with a deadline.
 */
export function nextOnBook(
  events: Pick<BookEvents, "decide" | "held">,
  after: string,
): BookEvent | undefined {
  let next: BookEvent | undefined;
  for (const event of [...events.decide, ...events.held])
    if (event.date > after && (!next || event.date < next.date)) next = event;
  return next;
}

const SHORT_DAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "2026-10-28" → "Wed, Oct 28". */
export const dayLabel = (iso: string): string => SHORT_DAY.format(new Date(`${iso}T00:00:00Z`));

/** One held name in plain words: "NVDA · 100 shares · 3 contracts · next expiry Sep 18". */
export function describeTouch(touch: TouchedPosition): string {
  const parts = [touch.symbol];
  if (touch.shares > 0) parts.push(`${touch.shares.toLocaleString("en-US")} shares`);
  if (touch.contracts > 0)
    parts.push(`${String(touch.contracts)} ${touch.contracts === 1 ? "contract" : "contracts"}`);
  parts.push(
    touch.expiry
      ? `next expiry ${SHORT_DATE.format(new Date(`${touch.expiry}T00:00:00Z`))}`
      : "no expiry",
  );
  return parts.join(" · ");
}
