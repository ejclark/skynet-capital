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
  now = new Date(),
}: {
  readonly symbol: string;
  readonly expiration: string;
  readonly spot?: number;
  readonly calls: readonly ChainRow[];
  readonly puts: readonly ChainRow[];
  readonly selectedStrike?: number;
  readonly onPickStrike?: (strike: number) => void;
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
}: {
  readonly row: StraddleRow;
  readonly spot?: number;
  readonly divider: boolean;
  readonly selected: boolean;
  readonly onPick?: (strike: number) => void;
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
        <Cell value={row.call?.bid} />
        <Cell value={row.call?.ask} />
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
        <Cell value={row.put?.bid} />
        <Cell value={row.put?.ask} />
      </tr>
    </>
  );
}

/** A premium the feed quoted, or "—" — never a confident 0.00 nobody measured. */
function Cell({ value }: { readonly value: number | undefined }): ReactElement {
  return <td className="num">{value === undefined ? "—" : money(value)}</td>;
}
