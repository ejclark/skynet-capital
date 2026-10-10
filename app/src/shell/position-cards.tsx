import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition, Tone } from "../live/desk";
import { manageSearch } from "../live/manage-handoff";
import { type GreeksParts, greeksParts, type HoldingDecay } from "./holding-decay";
import { positionAnchor } from "./position-anchor";
import { MINUS } from "./quote-change";

/** The server formats a loss with a hyphen ("-$412"); at a glance that reads as a dash. */
const withMinus = (figure: string) => figure.replace(/^-/, MINUS);

/** Today's change for the bracket beside the value (#5041): signed dollars, or a dash when the
 *  day is flat or rounds to $0 — never a made-up "+$0". */
function dayChange(p: DeskPosition): { tone: Tone; text?: string } {
  if (p.dayTone === "flat" || /^[+-]?\$0$/.test(p.dayPl)) return { tone: "flat" };
  return { tone: p.dayTone, text: withMinus(p.dayPl) };
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

/** The server's quantity ("-1", "1,200") as a whole count and a side. */
function held(quantity: string): { readonly count: number; readonly short: boolean } {
  const n = Number(quantity.replace(/[^0-9.-]/g, ""));
  return { count: Math.abs(n), short: n < 0 };
}

const plural = (n: number, one: string) =>
  `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;

/** Line 1, left: "NVDA · $232.10" for shares, "CRWV $80 SHORT PUT · 29d" for an option. */
function Head({ p }: { readonly p: DeskPosition }): ReactElement {
  const occ = parseOccSymbol(p.symbol);
  if (!occ) {
    return (
      <span className="pos-card-name">
        <b>{p.symbol}</b>
        <span aria-hidden="true"> · </span>
        <span className="visually-hidden">, </span>
        <span className="num">{p.price}</span>
        <span className="visually-hidden"> a share</span>
      </span>
    );
  }
  const side = held(p.quantity).short ? "SHORT" : "LONG";
  const days = p.expiresInDays;
  return (
    <span className="pos-card-name">
      <b>{occ.underlying}</b> <span className="num">{occStrikeLabel(occ.strike)}</span>{" "}
      <span className="pos-card-kind">
        {side} {occ.type.toUpperCase()}
      </span>
      {days === undefined ? null : (
        <>
          <span className="pos-card-dte" aria-hidden="true">
            {" · "}
            {days === 0 ? "expires today" : `${days}d`}
          </span>
          <span className="visually-hidden">
            , {days === 0 ? "expires today" : `${plural(days, "day")} left`}
          </span>
        </>
      )}
    </span>
  );
}

/** Line 2, left: "130 shares (breakeven $223.98)", "1 contract (breakeven $77.45)". */
function Size({ p }: { readonly p: DeskPosition }): ReactElement {
  const { count, short } = held(p.quantity);
  const size = p.isOption
    ? plural(count, "contract")
    : `${plural(count, "share")}${short ? " short" : ""}`;
  return (
    <span className="pos-card-sub">
      <span className="visually-hidden">, </span>
      {size}
      {p.breakeven ? (
        <>
          <span aria-hidden="true"> (</span>
          <span className="visually-hidden">, </span>
          breakeven <span className="num">{p.breakeven}</span>
          <span aria-hidden="true">)</span>
        </>
      ) : null}
    </span>
  );
}

/** Line 3, an option's only: "θ earns $11/day · Δ +$40 per $1", the figures in the text colour. */
function GreeksLine({ theta, delta }: GreeksParts): ReactElement {
  return (
    <span className="pos-card-greeks">
      <span className="visually-hidden">, </span>
      {theta ? (
        <>
          θ {theta.verb} <span className="pos-card-greek-fig num">{theta.amount}</span>
        </>
      ) : null}
      {theta && delta ? (
        <>
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
        </>
      ) : null}
      {delta ? (
        <>
          Δ <span className="pos-card-greek-fig num">{delta}</span> per $1
        </>
      ) : null}
    </span>
  );
}

/** A right-hand figure in brackets, the brackets for the eye only. */
function Bracketed({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <>
      <span aria-hidden="true">(</span>
      {children}
      <span aria-hidden="true">)</span>
    </>
  );
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
 * cards names the two columns once. Each figure keeps its sign, so hue never carries the direction
 * alone, and the link's name says each one in words (#5049). Each card is a 44px+ target that
 * opens the position on Trade, where closing it lives on a phone.
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
      {/* The column key: the links' names say each figure, so this is for the eye only. */}
      <li className="pos-cards-key" aria-hidden="true">
        <span className="pos-cards-key-value">value</span>{" "}
        <span className="pos-cards-key-day">(today)</span>{" "}
        <span className="pos-cards-key-total">total</span>{" "}
        <span className="pos-cards-key-ret">(return)</span>
      </li>
      {positions.map((p) => {
        const day = dayChange(p);
        const greeks = p.isOption
          ? greeksParts(decayBySymbol?.get(p.symbol), deltaBySymbol?.get(p.symbol))
          : {};
        const writtenOption = p.isOption && held(p.quantity).short;
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
              <Head p={p} />{" "}
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
              <Size p={p} />{" "}
              <span className={`pos-card-total num tone-${p.totalTone}`}>
                <span className="visually-hidden">, total </span>
                {withMinus(p.totalPl)}
              </span>{" "}
              {p.returnPct === "—" ? null : (
                <span className={`pos-card-ret num tone-${p.totalTone}`}>
                  <span className="visually-hidden">
                    , return {writtenOption ? "on premium " : ""}
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
