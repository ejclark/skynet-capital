import type { ReactElement } from "react";
import { useState } from "react";
import type { ChainRow } from "../live/options";
import {
  daysToExpiry,
  dividerIndex,
  expiresIn,
  inTheMoney,
  mergeStraddle,
  type StraddleRow,
  windowRows,
} from "../live/straddle";
import { money } from "../live/ticket";
import { EarningsBadge } from "./earnings-badge";

/**
 * THE STRADDLE VIEW (#1481, slice 1) — one expiration's chain as the entry instrument: strike down
 * the centre, call bid/ask to the left, put bid/ask to the right, a "Current price" divider row,
 * and an in-the-money rail on each side. The base view is these five columns and nothing else —
 * the short and long premiums for both sides in one glance (Eric, 2026-09-05). The scroll-out
 * columns (last, volume, open interest, then the greeks) are slice 2, additive, never base.
 *
 * Mobile-first: five narrow mono columns fit 390px without scrolling; the window keeps ±8 strikes
 * around the divider and says how many it hid. A row click is a PRESET — it hands the strike to
 * the ticket's `pickStrike`, which also seeds the limit from the quoted mid. Nothing here prices
 * anything: every number is the server's, drawn verbatim, "—" where the feed had none.
 *
 * A call or put PRICE cell can be its own preset too (#2017 Phase 0 task 4e, `onPickSide`): the
 * caller decides what a call/put pick means (in `OptionGate`, it can also switch Side/Type when
 * that's safe) — this component only reports which strike and which side got clicked. Cells with
 * no quoted value are still clickable — the contract exists in the chain regardless of whether a
 * live quote came back for it. Omitting `onPickSide` renders cells exactly as before (plain,
 * non-interactive), for any caller that doesn't wire this up.
 * @category trading
 */
export function StraddleView({
  symbol,
  expiration,
  spot,
  calls,
  puts,
  selectedStrike,
  onPickStrike,
  onPickSide,
  now = new Date(),
}: {
  readonly symbol: string;
  readonly expiration: string;
  readonly spot?: number;
  readonly calls: readonly ChainRow[];
  readonly puts: readonly ChainRow[];
  readonly selectedStrike?: number;
  readonly onPickStrike?: (strike: number) => void;
  /** A call/put price cell pick (task 4e) — fires with the row's strike and which side was
   *  clicked. Optional: omitted, cells render as plain, non-interactive text (unchanged). */
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
  readonly now?: Date;
}): ReactElement {
  const [showAll, setShowAll] = useState(false);
  const all = mergeStraddle(calls, puts);
  const { rows, hidden } = showAll ? { rows: all, hidden: 0 } : windowRows(all, spot);
  const divider = dividerIndex(rows, spot);
  return (
    <section className="straddle" aria-label={`Options chain for ${symbol}`}>
      <div className="straddle-head">
        <span className="straddle-eyebrow">
          Chain · {symbol} · {expiration}
        </span>
        <span className="straddle-dte">{expiresIn(daysToExpiry(expiration, now))}</span>
      </div>
      <EarningsBadge symbol={symbol} now={now} />
      <div className="straddle-scroll">
        <table className="straddle-table">
          <thead>
            <tr>
              <th colSpan={2} className="straddle-side straddle-side-calls">
                Calls
              </th>
              <th className="straddle-strike-h">Strike</th>
              <th colSpan={2} className="straddle-side straddle-side-puts">
                Puts
              </th>
            </tr>
            <tr className="straddle-sub">
              <th>Bid</th>
              <th>Ask</th>
              <th />
              <th>Bid</th>
              <th>Ask</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <RowGroup
                key={row.strike}
                row={row}
                spot={spot}
                divider={i === divider}
                selected={row.strike === selectedStrike}
                onPick={onPickStrike}
                onPickSide={onPickSide}
              />
            ))}
            {divider !== undefined && divider === rows.length && spot !== undefined ? (
              <DividerRow spot={spot} />
            ) : null}
          </tbody>
        </table>
      </div>
      {hidden > 0 ? (
        <button type="button" className="straddle-more" onClick={() => setShowAll(true)}>
          Show all {all.length} strikes
        </button>
      ) : null}
    </section>
  );
}

function DividerRow({ spot }: { readonly spot: number }): ReactElement {
  return (
    <tr className="straddle-divider">
      <td colSpan={5}>
        Current price · <span className="num">{money(spot)}</span>
      </td>
    </tr>
  );
}

function RowGroup({
  row,
  spot,
  divider,
  selected,
  onPick,
  onPickSide,
}: {
  readonly row: StraddleRow;
  readonly spot?: number;
  readonly divider: boolean;
  readonly selected: boolean;
  readonly onPick?: (strike: number) => void;
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
}): ReactElement {
  const callItm = inTheMoney(row.strike, spot, "call");
  const putItm = inTheMoney(row.strike, spot, "put");
  const cls = [
    "straddle-row",
    callItm ? "straddle-call-itm" : "",
    putItm ? "straddle-put-itm" : "",
    selected ? "straddle-selected" : "",
    onPick ? "straddle-pickable" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      {divider && spot !== undefined ? <DividerRow spot={spot} /> : null}
      <tr className={cls} onClick={onPick ? () => onPick(row.strike) : undefined}>
        <SideCell value={row.call?.bid} strike={row.strike} side="call" onPickSide={onPickSide} />
        <SideCell value={row.call?.ask} strike={row.strike} side="call" onPickSide={onPickSide} />
        <td className="straddle-strike num">
          {onPick ? (
            <button
              type="button"
              className="straddle-pick"
              aria-label={`Pick the ${row.strike} strike`}
              aria-pressed={selected}
            >
              {row.strike}
            </button>
          ) : (
            row.strike
          )}
        </td>
        <SideCell value={row.put?.bid} strike={row.strike} side="put" onPickSide={onPickSide} />
        <SideCell value={row.put?.ask} strike={row.strike} side="put" onPickSide={onPickSide} />
      </tr>
    </>
  );
}

/** A premium the feed quoted, or "—" — never a confident 0.00 nobody measured. Plain when
 *  `onPickSide` isn't wired up (unchanged from before task 4e); a clickable button when it is —
 *  even over a "—", since the contract exists in the chain regardless of whether a live quote
 *  came back for it. */
function SideCell({
  value,
  strike,
  side,
  onPickSide,
}: {
  readonly value: number | undefined;
  readonly strike: number;
  readonly side: "call" | "put";
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
}): ReactElement {
  const text = value === undefined ? "—" : money(value);
  if (!onPickSide) return <td className="num">{text}</td>;
  return (
    <td className="num">
      <button
        type="button"
        className="straddle-cell-pick"
        aria-label={`Pick the ${strike} ${side}`}
        onClick={(event) => {
          // Nested inside the row's own onClick (the strike-only pick) — stop it from also firing,
          // so a cell click fires only the more specific side pick (review fix, 2026-09-08).
          event.stopPropagation();
          onPickSide(strike, side);
        }}
      >
        {text}
      </button>
    </td>
  );
}
