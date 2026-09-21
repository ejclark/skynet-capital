import type { ReactElement } from "react";
import type { DeskPosition } from "../live/desk";
import { BlotterRow } from "./blotter-row";

/**
 * The positions blotter (#738 phase 2c, extracted #2321) — shared between a single desk (`/u/:id`)
 * and the unified Accounts view, so both render the exact same table/columns and the exact same
 * inline fill-timeline accordion (`BlotterRow`) rather than two copies drifting apart.
 *
 * `table-layout: fixed` + the `<colgroup>` below (#3186 slice 3) — under the default `auto`
 * layout, EVERY column's width is recomputed from the max content across ALL currently-rendered
 * rows; opening a lot accordion adds rows whose symbol cell holds an opened-at date (~21 chars)
 * instead of a ticker (~5), so the whole table's columns visibly shifted on open/close
 * (live-review). Fixed layout locks each column's width from the colgroup once, so no row content
 * can ever move another column. `col-detail`/`fold-col` classes on the `<col>` elements mirror the
 * same classes on the `<th>`/`<td>` cells so a hidden column's width drops out too.
 * @category trading
 */
export function PositionsTable({
  positions,
  deskId,
  totalCount,
}: {
  readonly positions: readonly DeskPosition[];
  readonly deskId: string;
  /** Unfiltered count, for the empty-state copy (0 open vs. 0 matching a filter). */
  readonly totalCount: number;
}): ReactElement {
  if (positions.length === 0) {
    return (
      <p className="note">
        {totalCount === 0
          ? "No open positions — waiting is a position."
          : "No positions match this filter."}
      </p>
    );
  }
  return (
    <div className="blotter-card">
      <div className="blotter-scroll">
        <table className="blotter blotter-fixed">
          <colgroup>
            <col className="fold-col" style={{ width: 32 }} />
            <col style={{ width: 190 }} />
            <col style={{ width: 70 }} />
            <col className="col-detail" style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col className="col-detail" style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col className="col-detail" style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col className="col-detail" style={{ width: 80 }} />
            <col style={{ width: 170 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="fold-col" aria-label="Row detail" />
              <th>Symbol</th>
              <th className="num">Qty</th>
              <th className="num col-detail">Cost / share</th>
              <th className="num">Mark</th>
              <th className="num col-detail">Cost basis</th>
              <th className="num">Value</th>
              <th className="num col-detail">Day P/L</th>
              <th className="num">Total P/L</th>
              <th className="num col-detail">Return</th>
              <th className="act-col" aria-label="Close position" />
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <BlotterRow key={position.symbol} position={position} deskId={deskId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
