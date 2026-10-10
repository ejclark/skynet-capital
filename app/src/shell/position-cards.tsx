import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition, Tone } from "../live/desk";
import { manageSearch } from "../live/manage-handoff";
import { decayClause, type HoldingDecay } from "./holding-decay";
import { positionAnchor } from "./position-anchor";
import { GLYPH, MINUS } from "./quote-change";

/** The server formats a loss with a hyphen ("-$412"); at a glance that reads as a dash. */
const withMinus = (figure: string) => figure.replace(/^-/, MINUS);

/** Today's change for the card's second figure (#5041): a glyph and signed dollars, or a dash when
 *  the day is flat or rounds to $0 — never a made-up "▲ +$0". */
function dayChange(p: DeskPosition): { tone: Tone; glyph?: string; text: string } {
  if (p.dayTone === "flat" || /^[+-]?\$0$/.test(p.dayPl)) return { tone: "flat", text: "—" };
  return { tone: p.dayTone, glyph: GLYPH[p.dayTone], text: withMinus(p.dayPl) };
}

/** Trade's search for a held position: an option opens on the HELD contract (the Orders pane, its
 *  Close / Roll row marked — #4947; a strike/expiry preset would seed a new order instead), shares
 *  on their ticker. Trade's `?symbol=` takes tickers only. */
function tradeSearch(deskId: string, symbol: string) {
  const occ = parseOccSymbol(symbol);
  return occ
    ? manageSearch<{ desk: string; symbol: string; section?: string }>(
        { desk: deskId, symbol: occ.underlying },
        { occ: symbol },
      )
    : { desk: deskId, symbol };
}

/**
 * HOLDING STEADY, AS CARDS (#3689 slice 8, handoff 3b): the phone's positions. At ≤700px the wide
 * table gives way to one card per position: name, total P/L and return on the first line
 * ("+$414 · +1.85% total"), then the plain line ("Expires in 37 days · loses ~$12/day to time", or
 * "earns ~$11/day from time" on an option sold, #5023) with today's change ("▼ −$76 today",
 * #5041 — the desktop table's Today column; on a phone the cards are the only positions view).
 * Each figure is named in a word and a direction glyph rides with the tone, so hue never carries
 * it alone. Each card is a 44px+ target that opens the position on Trade, where closing it lives
 * on a phone. The table keeps its inline close on wider screens.
 */
export function PositionCards({
  positions,
  deskId,
  decayBySymbol,
}: {
  readonly positions: readonly DeskPosition[];
  readonly deskId: string;
  readonly decayBySymbol?: ReadonlyMap<string, HoldingDecay>;
}): ReactElement {
  return (
    <ul className="pos-cards">
      {positions.map((p) => {
        const sub = [
          p.expiresIn && p.expiresIn !== "no expiry" ? `Expires in ${p.expiresIn}` : p.plainName,
          decayClause(decayBySymbol?.get(p.symbol)),
        ]
          .filter(Boolean)
          .join(" · ");
        const day = dayChange(p);
        return (
          <li key={p.symbol}>
            <Link
              to="/trade"
              search={tradeSearch(deskId, p.symbol)}
              className="pos-card"
              // The phone's landing target for `#pos-<symbol>` (#4348): an `id` would duplicate the
              // table row's, which is still in the DOM, only hidden.
              data-pos-anchor={positionAnchor(p.symbol)}
            >
              <span className="pos-card-top">
                <span className="pos-card-name">{p.display}</span>
                {/* One link name, so a screen reader hears each figure named: "MSFT, total +$414,
                    return +1.85%". The on-screen "total" trails the figures, where it lines up
                    with "today" below. */}
                <span className={`pos-card-fig num tone-${p.totalTone}`}>
                  <span className="visually-hidden">, total </span>
                  <span className="pos-card-pl">{withMinus(p.totalPl)}</span>
                  {p.returnPct === "—" ? null : (
                    <span className="pos-card-ret">
                      <span aria-hidden="true"> · </span>
                      <span className="visually-hidden">, return </span>
                      {withMinus(p.returnPct)}
                    </span>
                  )}{" "}
                  <span className="pos-card-label" aria-hidden="true">
                    total
                  </span>
                </span>
              </span>
              <span className="pos-card-bottom">
                <span className="pos-card-sub">{sub}</span>
                <span className={`pos-card-fig pos-card-day num tone-${day.tone}`}>
                  {/* Apart on screen, but one link name: without the pause a reader hears
                      "profits if MSFT rises −$76" (#5023's lesson). */}
                  <span className="visually-hidden">, </span>
                  {day.glyph ? (
                    <>
                      <span aria-hidden="true">{day.glyph} </span>
                      {day.text}
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">{day.text}</span>
                      <span className="visually-hidden">no change</span>
                    </>
                  )}{" "}
                  <span className="pos-card-label">today</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
