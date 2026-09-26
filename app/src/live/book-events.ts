import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";
import { underlyingOf } from "./held-events";
import { type DayRange, inRange } from "./horizon-range";
import {
  callForLens,
  type HorizonRow,
  type Lens,
  type ResearchCall,
  type ResearchEvent,
} from "./research";

/**
 * EVENTS ON YOUR BOOK (#3807 slice 2c, the co-location — `docs/IA.md` §8): the market calendar's
 * events joined to what a book holds, for the Profile page's Events section. `held-events.ts` is
 * the one-line version over each position's single `nextEvent`; this reads the research corpus
 * itself (`/api/research` — every dated event, earnings prints included), so a month with two
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
 * NO FAKE DATES. A playbook store card's window ("D-20 to D-6") is relative to a print, not a day
 * (`playbook-store.ts`), and a decision carries no structured due date yet (a data slice in the
 * plan, F11) — neither is placed on a day here.
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
      "symbol" | "isOption" | "quantity" | "nextEvent"
    >[];
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
  readonly tier: "held" | "market";
  /** The held names it lands on — for a market-wide print, the ones it is the next event for
   *  (it moves all of them; these are the ones with nothing sooner of their own). */
  readonly touches: readonly TouchedPosition[];
  /** The ledger's call under the lens in force, when the event is researched and states one. */
  readonly call?: HorizonRow & { readonly href: string };
}

export interface BookEvents {
  readonly held: readonly BookEvent[];
  readonly market: readonly BookEvent[];
  /** Open positions across the desks read — zero is its own honest state. */
  readonly positions: number;
}

const quantityOf = (raw: string): number => {
  const n = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

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
      const qty = quantityOf(position.quantity);
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

/**
 * The book's events in `range`: the corpus's events naming a held ticker, the headline macro
 * prints, and — as the backstop — any position's own `nextEvent` the corpus did not carry.
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
  backstop(desks, range, touched, held, market);
  return {
    held: held.sort(byDay),
    market: market.sort(byDay),
    positions: desks.reduce((n, { desk }) => n + desk.positions.length, 0),
  };
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
