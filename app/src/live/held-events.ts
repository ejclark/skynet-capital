import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";
import { type DayRange, inRange } from "./horizon-range";

/**
 * EVENTS ON WHAT YOU HOLD (#3807 slice 2·1 — the burning-day joint, `docs/IA.md` §6 joint 1, the
 * largest in the wargame's matrix: 62 of 86 scenarios). The server already joins ONE dated event
 * to every position (`src/observatory/position-event.ts` → `positions[].nextEvent`: the stock's
 * own print or a named event, else the next headline macro print — the Fed, CPI, the jobs report).
 * This is the by-day direction of that join, client-side over the desk payload the Overview has
 * already fetched: the events inside the market calendar's range, in two tiers —
 *
 *   held         the stock's own event on a name this book holds (`scope: "stock"`)
 *   market-wide  the Fed / CPI / jobs print a held position carries (`scope: "market"`)
 *
 * Each tier renders with a glyph AND a word — hue never carries meaning alone (docs/BRAND.md →
 * Accessibility). No endpoint: the data is thin and the line says so — 31 of 1184 event records
 * carry a symbol and ten prints are dated, so most weeks read "Nothing dated on what you hold"
 * honestly, with the market-wide print beside it. Below two held days a month the market tier
 * leads and the held glyph is the rare accent (the panel's F7); a zero is research coverage,
 * never a defect of the line.
 *
 * The market tier is only as wide as the book: a position carries its NEXT event, so a macro
 * print further out than a held name's own print is not on this line. The calendar as a place
 * (slice 2·2, Events on the book) reads the corpus itself.
 */

/** What the join needs of a desk payload — `DeskSnapshot` fits; a spec needs no more than this. */
export interface HeldBook {
  readonly desk: {
    readonly id: string;
    readonly positions: readonly Pick<DeskPosition, "symbol" | "nextEvent">[];
  };
}

export interface HeldEvent {
  /** The ticker — for an option, its underlying (`NVDA260918C00180000` → `NVDA`). */
  readonly symbol: string;
  /** The server's words: "Earnings Oct 28", "Jobs report Oct 2". */
  readonly label: string;
  /** `YYYY-MM-DD`. */
  readonly at: string;
  readonly scope: "stock" | "market";
  /** The account that holds it — Trade's `?desk=`. */
  readonly deskId: string;
  /** How many positions carry it — shares and a call on the same name count twice. */
  readonly positions: number;
}

export interface HeldEvents {
  readonly held: readonly HeldEvent[];
  readonly market: readonly HeldEvent[];
  /** Open positions across the desks read — zero is its own honest state. */
  readonly positions: number;
}

/** The ticker an event belongs to: an option's underlying, else the symbol itself. */
export const underlyingOf = (symbol: string): string =>
  parseOccSymbol(symbol)?.underlying ?? symbol;

const byDate = (a: HeldEvent, b: HeldEvent): number =>
  a.at < b.at ? -1 : a.at > b.at ? 1 : a.symbol.localeCompare(b.symbol);

/** The events in `range` on what these desks hold, one entry per distinct event, date-sorted. */
export function heldEventsIn(desks: readonly HeldBook[], range: DayRange): HeldEvents {
  const found = new Map<string, HeldEvent>();
  let positions = 0;
  for (const { desk } of desks) {
    for (const position of desk.positions) {
      positions += 1;
      const event = position.nextEvent;
      if (!(event && inRange(event.at, range))) continue;
      const symbol = underlyingOf(position.symbol);
      const key =
        event.scope === "stock"
          ? `stock ${symbol} ${event.at} ${event.label}`
          : `market ${event.at} ${event.label}`;
      const seen = found.get(key);
      found.set(
        key,
        seen
          ? { ...seen, positions: seen.positions + 1 }
          : {
              symbol,
              label: event.label,
              at: event.at,
              scope: event.scope,
              deskId: desk.id,
              positions: 1,
            },
      );
    }
  }
  const all = [...found.values()];
  return {
    held: all.filter((e) => e.scope === "stock").sort(byDate),
    market: all.filter((e) => e.scope === "market").sort(byDate),
    positions,
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * "Jobs report Oct 2" on 2026-10-02 → "Jobs report Fri Oct 2": the server's words with the weekday
 * the Monday read wants. A label in any other shape passes through with its date beside it.
 */
export function describeHeldEvent(event: Pick<HeldEvent, "label" | "at">): string {
  const weekday = WEEKDAYS[new Date(`${event.at}T00:00:00Z`).getUTCDay()] ?? "";
  const dated = /^(.*\S)\s+([A-Z][a-z]{2} \d{1,2})$/.exec(event.label);
  return dated
    ? `${dated[1] ?? ""} ${weekday} ${dated[2] ?? ""}`
    : `${event.label} · ${weekday} ${event.at}`;
}
