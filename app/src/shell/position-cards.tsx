import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "../live/desk";
import { manageSearch } from "../live/manage-handoff";
import { positionAnchor } from "./position-anchor";

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
 * table gives way to one card per position: name and total P/L on the first line, then the
 * plain line ("Expires in 37 days · loses ~$12/day") with the return. Each card is a 44px+ target
 * that opens the position on Trade, where closing it lives on a phone. The table keeps its inline
 * close on wider screens.
 */
export function PositionCards({
  positions,
  deskId,
  decayBySymbol,
}: {
  readonly positions: readonly DeskPosition[];
  readonly deskId: string;
  readonly decayBySymbol?: ReadonlyMap<string, string>;
}): ReactElement {
  return (
    <ul className="pos-cards">
      {positions.map((p) => {
        const decay = decayBySymbol?.get(p.symbol);
        const sub = [
          p.expiresIn && p.expiresIn !== "no expiry" ? `Expires in ${p.expiresIn}` : p.plainName,
          decay ? `loses ~${decay.replace("−", "")}` : undefined,
        ]
          .filter(Boolean)
          .join(" · ");
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
                <span className={`pos-card-pl num tone-${p.totalTone}`}>{p.totalPl}</span>
              </span>
              <span className="pos-card-bottom">
                <span className="pos-card-sub">{sub}</span>
                <span className={`pos-card-ret num tone-${p.totalTone}`}>{p.returnPct}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
