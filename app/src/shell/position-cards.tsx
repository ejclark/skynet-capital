import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "../live/desk";
import { manageSearch } from "../live/manage-handoff";
import { greeksParts, type HoldingDecay } from "./holding-decay";
import { positionAnchor } from "./position-anchor";
import {
  Bracketed,
  dayChange,
  GreeksLine,
  isWritten,
  PositionHead,
  PositionSize,
  ROW_KEY,
  withMinus,
} from "./position-row-spec";

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
 * THE PHONE'S POSITIONS, AS ERIC'S ROW SPEC (#5059; round 2 of #5037, the positions surface,
 * question 2 slice 1). At ≤700px the wide table gives way to one card per position, in two lines:
 *  - line 1 is the position now: "NVDA · $232.10" (an option: "CRWV $80 SHORT PUT · 29d"), and on
 *    the right its value with today's change in brackets, "$30,173 (+$195)";
 *  - line 2 is since it was opened: "130 shares (breakeven $223.98)", and on the right the total
 *    with its return in brackets, "+$1,056 (+3.63%)" — the boldest figure on the card, because
 *    the total matters more than today's (Eric, #5037);
 *  - an option adds a third line: "θ earns $11/day · Δ +$40 per $1" (`greeksParts`).
 * A sold option's value is what it costs to close, a negative, and its return is against the
 * premium collected (the server's `returnPct`). The right-hand figures sit on two edges shared by
 * every card (one grid, subgridded through each card, in tabular digits), and a key above the
 * cards names them once, one word a figure in the figures' own 2 × 2 (#5076: Value · Today over
 * P/L · Return, `ROW_KEY`). Each figure keeps its sign, so hue never carries the direction alone,
 * and the link's name says each one in words (#5049). The pieces are `position-row-spec.tsx`'s,
 * shared with the desk table. Each card is a 44px+ target that opens the position on Trade, where
 * closing it lives on a phone.
 *
 * Under the link, inside the same card, each position carries its guidance line (#5070,
 * `position-guidance-slot.tsx`): a sibling of the link, never inside it, so its own controls stay
 * buttons and the link keeps exactly the name above.
 */
export function PositionCards({
  positions,
  deskId,
  decayBySymbol,
  deltaBySymbol,
  guide,
}: {
  readonly positions: readonly DeskPosition[];
  readonly deskId: string;
  readonly decayBySymbol?: ReadonlyMap<string, HoldingDecay>;
  readonly deltaBySymbol?: ReadonlyMap<string, number>;
  /** Each position's guidance line, drawn under its link in the same card. */
  readonly guide?: (position: DeskPosition) => ReactNode;
}): ReactElement {
  return (
    <ul className="pos-cards">
      {/* The column key, one word a figure on the figures' own edges (#5076): the links' names
          say each figure in words, so this is for the eye only. */}
      <li className="pos-cards-key" aria-hidden="true">
        <span className="pos-cards-key-value">{ROW_KEY.value}</span>{" "}
        <span className="pos-cards-key-day">{ROW_KEY.today}</span>{" "}
        <span className="pos-cards-key-total">{ROW_KEY.pl}</span>{" "}
        <span className="pos-cards-key-ret">{ROW_KEY.ret}</span>
      </li>
      {positions.map((p) => {
        const day = dayChange(p);
        const greeks = p.isOption
          ? greeksParts(decayBySymbol?.get(p.symbol), deltaBySymbol?.get(p.symbol))
          : {};
        return (
          <li key={p.symbol} className={guide ? "pos-card-guided" : undefined}>
            <Link
              to="/trade"
              search={tradeSearch(deskId, p.symbol)}
              className="pos-card"
              // The phone's landing target for `#pos-<symbol>` (#4348): an `id` would duplicate the
              // table row's, which is still in the DOM, only hidden.
              data-pos-anchor={positionAnchor(p.symbol)}
            >
              <PositionHead p={p} />{" "}
              <span className="pos-card-value num">
                <span className="visually-hidden">, value </span>
                {withMinus(p.value)}
              </span>{" "}
              <span className={`pos-card-day num tone-${day.tone}`}>
                <span className="visually-hidden">, </span>
                {day.text ? (
                  <>
                    <Bracketed>{day.text}</Bracketed>
                    <span className="visually-hidden"> today</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">(—)</span>
                    <span className="visually-hidden">no change today</span>
                  </>
                )}
              </span>{" "}
              <PositionSize p={p} />{" "}
              <span className={`pos-card-total num tone-${p.totalTone}`}>
                <span className="visually-hidden">, total </span>
                {withMinus(p.totalPl)}
              </span>{" "}
              {p.returnPct === "—" ? null : (
                <span className={`pos-card-ret num tone-${p.totalTone}`}>
                  <span className="visually-hidden">
                    , return {isWritten(p) ? "on premium " : ""}
                  </span>
                  <Bracketed>{withMinus(p.returnPct)}</Bracketed>
                </span>
              )}{" "}
              {greeks.theta || greeks.delta ? <GreeksLine {...greeks} /> : null}
            </Link>
            {guide?.(p)}
          </li>
        );
      })}
    </ul>
  );
}
