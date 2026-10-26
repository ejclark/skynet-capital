import type { ReactElement } from "react";
import { actionDay, type SymbolBook, wholeDollars } from "../live/symbol-book";
import { LaneGlyphIcon } from "./book-lanes";
import { SymbolRecapFor } from "./symbol-recap-for";

/**
 * EVENTS ON ONE SYMBOL — the head (#6082; #5154 round 4, option C, Eric's Build pick). What the
 * section shows above its range when `?symbol=` narrows it, top down in the order the drawing reads:
 *
 *   the symbol   its name, "Invested" with the money in it, and the unrealized P/L in a box; the
 *                way back to every symbol ("All symbols ×")
 *   the action   "⧗ Decide by Nov 6 — the $80 put expires first": the soonest date to act leads
 *                (round 3: "Soonest dates to act take precedent")
 *   the rows     one per position — name, state, target, its own P/L (round 4, pin 3 👍: "This
 *                gives us metrics to take profit")
 *   the recap    the symbol's call until its next decision and its windows — `SymbolRecapFor`, the
 *                Guidance tab's own card (#5747), never a copy; drawn at the card's foot
 *                (`SymbolFoot`), under the dates
 *
 * P/L WITHOUT A LABEL (Eric, round 4: "I don't care for the label, ideally the design presentation
 * handles this information without text"). One outlined box, the same on the head and on every
 * row: ▲ a gain, ▼ a loss, nothing for flat — a shape, so hue never carries it alone (a standing
 * reader is red/green colourblind). A screen reader hears the words the box leaves out.
 */

/** The unrealized P/L as a ▲/▼ amount in one outlined box. */
export function PlBox({ value }: { readonly value: number }): ReactElement {
  const whole = Math.round(value);
  const tone = whole > 0 ? "pos" : whole < 0 ? "neg" : "flat";
  const glyph = whole > 0 ? "▲" : whole < 0 ? "▼" : "";
  const words =
    tone === "flat"
      ? "unrealized P/L $0"
      : `unrealized ${tone === "pos" ? "gain" : "loss"} ${wholeDollars(whole)}`;
  return (
    <span className="pl-box num" data-tone={tone} role="img" aria-label={words}>
      {glyph ? <span aria-hidden="true">{glyph} </span> : null}
      <span aria-hidden="true">{wholeDollars(whole)}</span>
    </span>
  );
}

export function SymbolHead({
  book,
  onClear,
}: {
  readonly book: SymbolBook;
  readonly onClear: () => void;
}): ReactElement {
  return (
    <div className="sym-head">
      <div className="sym-top">
        <h3 className="sym-name">{book.symbol}</h3>
        <button type="button" className="sym-clear" onClick={onClear}>
          All symbols <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className="sym-money">
        <b className="num">{wholeDollars(book.invested)}</b>{" "}
        <span className="sym-word">invested</span> <PlBox value={book.pl} />
      </p>
      {book.soonest ? (
        <p className="sym-action">
          <span className="sym-due">
            <LaneGlyphIcon glyph="decide" />
            Decide by <span className="num">{actionDay(book.soonest.date)}</span>
          </span>{" "}
          <span className="sym-what">{book.soonest.what}</span>
        </p>
      ) : (
        <p className="sym-action sym-what">No date to act on is recorded for {book.symbol}.</p>
      )}
      <ul className="sym-rows" aria-label={`${book.symbol} positions`}>
        {book.rows.map((row) => (
          <li key={row.key} className="sym-row">
            <span className="sym-row-name">
              <b>{row.name}</b> <span className="sym-state">· {row.state}</span>
            </span>
            <PlBox value={row.pl} />
            <span className="sym-target">{row.target}</span>
            {row.toClose ? <span className="sym-close">{row.toClose}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The symbol's recap at the card's foot: the house call until its next decision and its windows,
 *  the Guidance tab's own card. Under the dates, not over them — at 390 it is a screen tall, and
 *  the drawing reads head → positions → range → dates. */
export function SymbolFoot({
  book,
}: {
  readonly book: SymbolBook | undefined;
}): ReactElement | null {
  if (!book) return null;
  return (
    <div className="sym-foot">
      <SymbolRecapFor symbol={book.symbol} />
    </div>
  );
}

/** What leads Events when `?symbol=` names one: its head, or — when the book holds none of it — a
 *  plain line and the way back. Nothing while the desks are still being read. */
export function SymbolLead({
  symbol,
  book,
  read,
  onSymbol,
}: {
  readonly symbol: string | undefined;
  readonly book: SymbolBook | undefined;
  /** The desks have arrived, so "nothing on it" is a claim the section can vouch for. */
  readonly read: boolean;
  /** The section's narrowing; `undefined` brings every symbol back. */
  readonly onSymbol: ((symbol: string | undefined) => void) | undefined;
}): ReactElement | null {
  if (!symbol) return null;
  const onClear = (): void => onSymbol?.(undefined);
  if (book) return <SymbolHead book={book} onClear={onClear} />;
  if (!read) return null;
  return (
    <p className="note sym-none">
      Nothing on {symbol} is open on this book.{" "}
      <button type="button" className="sym-clear" onClick={onClear}>
        All symbols <span aria-hidden="true">×</span>
      </button>
    </p>
  );
}
