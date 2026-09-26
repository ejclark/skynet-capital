import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { dayLensFog } from "../live/fog";
import {
  describeHeldEvent,
  type HeldBook,
  type HeldEvent,
  heldEventsIn,
} from "../live/held-events";
import { useHorizonRange } from "../live/horizon-params";
import { rangeLabel } from "../live/horizon-range";
import { fetchPlays } from "../live/options";

/**
 * THE LINE UNDER THE NET-WORTH CARD (#3807 slice 2·1): what is dated, in the market calendar's
 * range, on what this book holds — `live/held-events.ts` is the join, this is its one plain line.
 * Two tiers, each a glyph AND a word (hue never alone): ◆ held — the stock's own event on a name
 * you hold, linking to that position's guidance on Trade; ○ market-wide — the Fed / CPI / jobs
 * print a held position carries. The empty states are honest and say the range: nothing dated
 * on what you hold this week is the common Monday, and the line says so rather than hiding.
 *
 * It reads the same range the head does (`useHorizonRange`, the root `?on=&span=` params, the
 * same fog), so a step on the head moves this line with it.
 */

function EventItem({ event, link }: { readonly event: HeldEvent; readonly link: boolean }) {
  const text = describeHeldEvent(event);
  if (!link) return <span className="held-event">{text}</span>;
  return (
    <Link
      to="/trade"
      search={{ desk: event.deskId, symbol: event.symbol, section: "guidance" }}
      className="held-event"
    >
      <span className="held-event-sym">{event.symbol}</span> {text}
    </Link>
  );
}

function Tier({
  glyph,
  word,
  events,
  link,
}: {
  readonly glyph: string;
  readonly word: string;
  readonly events: readonly HeldEvent[];
  readonly link: boolean;
}): ReactElement {
  return (
    <>
      <span className="held-tier">
        <i className="held-glyph" aria-hidden="true">
          {glyph}
        </i>{" "}
        {word}
      </span>{" "}
      {events.map((event, i) => (
        <span key={`${event.symbol} ${event.at} ${event.label}`}>
          {i > 0 ? " · " : ""}
          <EventItem event={event} link={link} />
        </span>
      ))}
    </>
  );
}

export function HeldEventsLine({ desks }: { readonly desks: readonly HeldBook[] }): ReactElement {
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays, retry: false });
  const horizon = useHorizonRange({ fogged: dayLensFog(plays.data).fogged });
  const { held, market, positions } = heldEventsIn(desks, horizon.range);
  const when = horizon.lens === "all" ? "on any date" : rangeLabel(horizon.range, horizon.lens);
  return (
    <p className="held-events">
      {positions === 0 ? (
        `No open positions — nothing dated ${when}.`
      ) : held.length === 0 ? (
        `Nothing dated on what you hold ${when}`
      ) : (
        <Tier glyph="◆" word="held" events={held} link />
      )}
      {market.length > 0 ? (
        <>
          {" · "}
          <Tier glyph="○" word="market-wide:" events={market} link={false} />
        </>
      ) : null}
    </p>
  );
}
