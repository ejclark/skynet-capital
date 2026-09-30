import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { dayLensFog } from "../live/fog";
import { useHorizonRange } from "../live/horizon-params";
import { type DayRange, rangeLabel } from "../live/horizon-range";
import { fetchPlays } from "../live/options";
import { fetchResearch } from "../live/research";
import { describeSymbolEvent, type SymbolEvent, symbolEventsIn } from "../live/symbol-events";
import { CalendarHead } from "./calendar-head";

/**
 * THE MARKET CALENDAR'S HEAD ON TRADE (#3807 slice 3b-2): the same row the Profile page's head is
 * (`cockpit-clock.tsx` — range · arrows · lens row · fog line), leading Trade's stage the way R&D's
 * band head leads its board. Its
 * range is the ROOT `?on=&span=` (`live/horizon-params.ts`), so a week picked on the Profile page
 * is the week Trade opens on, and a step here follows you back.
 *
 * What differs is the line: scoped to THE TICKET'S SYMBOL (`?symbol=`), not a book — tier 1 "on
 * <SYM>", the symbol's own dated events in range; tier 2 "market-wide", the Fed / CPI / jobs print
 * (`live/symbol-events.ts`). Each tier is a glyph AND a word (hue never alone), and the empty
 * states say the range: "Nothing dated on META Sep 28 – Oct 4" is the common week. No symbol yet
 * reads market-wide only.
 *
 * NEVER AN EXPIRATION CONTROL. The chain owns expiry (#3407/#3523: `?exp=` is written by the
 * ticket's field and the chain's browse); this head neither selects nor presets one — an arrow
 * press moves the calendar's range and nothing on the ticket.
 *
 * A ROW, NEVER A COLUMN. The Bench docks at 1280 by the window's width (`use-bench-width.ts`), and
 * this head spends height, never width. From 1280 the page frame's tower column (#3977) takes its
 * width beside the whole stage, not from this row.
 * @category trading
 */

/** Items one tier shows before it counts the rest — the line stays one line at 1280. */
const SHOWN = 3;

function Tier({
  glyph,
  word,
  events,
}: {
  readonly glyph: string;
  readonly word: string;
  readonly events: readonly SymbolEvent[];
}): ReactElement {
  const rest = events.length - SHOWN;
  return (
    <>
      <span className="held-tier">
        <i className="held-glyph" aria-hidden="true">
          {glyph}
        </i>{" "}
        {word}
      </span>{" "}
      {events.slice(0, SHOWN).map((event, i) => (
        <span key={event.id}>
          {i > 0 ? " · " : ""}
          <span className="held-event">{describeSymbolEvent(event)}</span>
        </span>
      ))}
      {rest > 0 ? <span className="num"> +{rest} more</span> : null}
    </>
  );
}

/** The line: what is dated on the symbol and market-wide, in the head's range. */
export function SymbolEventsLine({
  symbol,
  range,
  when,
}: {
  /** The ticket's symbol, upper-case; "" before one is picked. */
  readonly symbol: string;
  readonly range: DayRange;
  /** The range in words, for the empty states: "Sep 28 – Oct 4", "from today on". */
  readonly when: string;
}): ReactElement {
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch });
  if (research.isPending) return <p className="held-events">Reading the calendar…</p>;
  if (research.isError) {
    return <p className="held-events">The calendar's events are unreachable right now.</p>;
  }
  const { on, market } = symbolEventsIn(research.data.events, symbol, range);
  const own =
    symbol === "" ? null : on.length === 0 ? (
      `Nothing dated on ${symbol} ${when}`
    ) : (
      <Tier glyph="◆" word={`on ${symbol}:`} events={on} />
    );
  return (
    <p className="held-events">
      {own}
      {market.length > 0 ? (
        <>
          {own ? " · " : null}
          <Tier glyph="○" word="market-wide:" events={market} />
        </>
      ) : symbol === "" ? (
        `Nothing market-wide dated ${when}`
      ) : null}
    </p>
  );
}

/** `symbol` is the ticket's `?symbol=`, absent before one is picked. */
export function TradeClock({ symbol = "" }: { readonly symbol?: string }): ReactElement {
  // The day lens's fog reads the ladder the ticket already fetches (same key, shared cache).
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays, retry: false });
  const fog = dayLensFog(plays.data);
  const horizon = useHorizonRange({ fogged: fog.fogged });
  // Under the all lens a ticket reads what is ahead: history is R&D's, not the order form's.
  const all = horizon.lens === "all";
  const range = all ? { ...horizon.range, start: horizon.today } : horizon.range;
  return (
    <section className="cal-head trade-clock" aria-label="Market calendar">
      <CalendarHead
        lens={horizon.lens}
        range={horizon.range}
        closures={MARKET_CLOSURES}
        all={{
          name: "any date",
          count: symbol ? `everything ahead on ${symbol}` : "everything ahead market-wide",
        }}
        onLens={horizon.setLens}
        onStep={horizon.step}
        {...(fog.fogged ? { dayFog: { door: fog.door, reason: fog.reason } } : {})}
      />
      <SymbolEventsLine
        symbol={symbol}
        range={range}
        when={all ? "from today on" : rangeLabel(horizon.range, horizon.lens)}
      />
    </section>
  );
}
