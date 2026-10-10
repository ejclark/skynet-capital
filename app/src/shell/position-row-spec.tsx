import type { ReactElement, ReactNode } from "react";
import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition, Tone } from "../live/desk";
import type { GreeksParts } from "./holding-decay";
import { MINUS } from "./quote-change";

/**
 * ERIC'S ROW SPEC, the pieces both layouts draw (#5059 on the phone, #5071 on the desk table):
 * line 1 is the position now, line 2 is since it was opened, and an option adds what time and a $1
 * move in the stock do to it. The phone card (`position-cards.tsx`) and the desk table's Position
 * and θ · Δ cells (`blotter-row.tsx`) render these same components, so the two never word a
 * position differently.
 */

/** The server formats a loss with a hyphen ("-$412"); at a glance that reads as a dash. */
export const withMinus = (figure: string) => figure.replace(/^-/, MINUS);

/**
 * The column key, one word a figure (#5076, Eric on #5061: "the title headings mirrored the 2
 * column two row in the line item in a single word … gains in green, losses in red"). Each word
 * sits where its figure sits: over the phone card's two right-hand columns, and as the desk
 * table's two-line headers. "Value", not "Total", for what the position is worth: a sold put is
 * worth −$550, and "Total −$550" would read as a $550 loss when the loss is −$295. "P/L" is the one
 * word for the gain or loss, whichever way it went.
 */
export const ROW_KEY = { value: "Value", today: "Today", pl: "P/L", ret: "Return" } as const;

/** Today's change: signed dollars, or nothing when the day is flat or rounds to $0 — never a
 *  made-up "+$0" (#5041). */
export function dayChange(p: DeskPosition): { tone: Tone; text?: string } {
  if (p.dayTone === "flat" || /^[+-]?\$0$/.test(p.dayPl)) return { tone: "flat" };
  return { tone: p.dayTone, text: withMinus(p.dayPl) };
}

/** The server's quantity ("-1", "1,200") as a whole count and a side. */
export function held(quantity: string): { readonly count: number; readonly short: boolean } {
  const n = Number(quantity.replace(/[^0-9.-]/g, ""));
  return { count: Math.abs(n), short: n < 0 };
}

export const plural = (n: number, one: string) =>
  `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;

/** An option sold to open: its value is what it costs to close, its return is on the premium. */
export const isWritten = (p: DeskPosition): boolean => p.isOption && held(p.quantity).short;

/** Line 1, left: "NVDA · $232.10" for shares, "CRWV $80 SHORT PUT · 29d" for an option. */
export function PositionHead({ p }: { readonly p: DeskPosition }): ReactElement {
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
export function PositionSize({ p }: { readonly p: DeskPosition }): ReactElement {
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

/** "θ earns $11/day · Δ +$40 per $1", the figures in the text colour. */
export function GreeksLine({ theta, delta }: GreeksParts): ReactElement {
  return (
    <span className="pos-card-greeks">
      <span className="visually-hidden">, </span>
      {theta ? (
        <span className="pos-greek">
          θ {theta.verb} <span className="pos-card-greek-fig num">{theta.amount}</span>
        </span>
      ) : null}
      {theta && delta ? (
        <>
          <span className="pos-greek-sep" aria-hidden="true">
            {" · "}
          </span>
          <span className="visually-hidden">, </span>
        </>
      ) : null}
      {delta ? (
        <span className="pos-greek">
          Δ <span className="pos-card-greek-fig num">{delta}</span> per $1
        </span>
      ) : null}
    </span>
  );
}

/** A right-hand figure in brackets, the brackets for the eye only. */
export function Bracketed({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <>
      <span aria-hidden="true">(</span>
      {children}
      <span aria-hidden="true">)</span>
    </>
  );
}
