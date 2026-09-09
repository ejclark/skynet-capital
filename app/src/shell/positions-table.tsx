import type { ReactElement } from "react";
import type { DeskPosition } from "../live/desk";
import { BlotterRow } from "./blotter-row";

/**
 * The positions blotter (#738 phase 2c, extracted #2321) — shared between a single desk (`/u/:id`)
 * and the unified Accounts view, so both render the exact same table/columns and the exact same
 * inline fill-timeline accordion (`BlotterRow`) rather than two copies drifting apart.
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
        <table className="blotter">
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
