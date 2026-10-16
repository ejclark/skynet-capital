import type { ReactElement, ReactNode } from "react";
import type { DeskPosition } from "../live/desk";
import { BlotterRow } from "./blotter-row";
import type { HoldingDecay } from "./holding-decay";
import { colClass, POS_COLUMNS, PositionsHeaderRow } from "./position-columns";

/**
 * The positions blotter (#738 phase 2c, extracted #2321) — shared between a single desk (`/u/:id`)
 * and the unified Accounts view, so both render the exact same table/columns and the exact same
 * row (`BlotterRow`) rather than two copies drifting apart. `canTrade` is the one difference the
 * two pages have (#3807 slice 2d): off an account the viewer owns, the rows offer no write.
 *
 * Its columns are ranked (#5071, `position-columns.tsx`): which of them show is decided by the
 * table's own width, a container query on `.blotter-scroll` (`positions-columns.css`), so the
 * same table fits beside the tower, beside Moneypenny's rail, or alone, with no sideways scroll.
 *
 * `table-layout: fixed` + the `<colgroup>` (#3186 slice 3) — under the default `auto` layout,
 * EVERY column's width is recomputed from the max content across ALL currently-rendered rows, so
 * opening a row would visibly shift the columns. Fixed layout locks each column's width from the
 * colgroup once (the widths live in `positions-columns.css`, beside the widths that pick them).
 * Each `<col>` carries its column's class, like its `<th>`/`<td>`, so a hidden column's width
 * drops out too.
 * @category trading
 */
export function PositionsTable({
  positions,
  deskId,
  totalCount,
  decayBySymbol,
  deltaBySymbol,
  canTrade = true,
  guide,
}: {
  readonly positions: readonly DeskPosition[];
  readonly deskId: string;
  /** Time decay per OCC symbol, from the option book (#3689 slice 6); absent until it answers. */
  readonly decayBySymbol?: ReadonlyMap<string, HoldingDecay>;
  /** Dollars per $1 in the stock per OCC symbol, from the same book (#5059). */
  readonly deltaBySymbol?: ReadonlyMap<string, number>;
  /** Unfiltered count, for the empty-state copy (0 open vs. 0 matching a filter). */
  readonly totalCount: number;
  /** Does the viewer own this account? Off it, no row renders a write (`BlotterRow`). */
  readonly canTrade?: boolean;
  /** Each position's guidance line (#5070), drawn as a full-width row under it. */
  readonly guide?: (position: DeskPosition) => ReactNode;
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
        <table className="blotter blotter-fixed pos-table">
          <colgroup>
            {POS_COLUMNS.map((key) => (
              <col key={key} className={colClass(key)} />
            ))}
          </colgroup>
          <thead>
            <PositionsHeaderRow />
          </thead>
          <tbody>
            {positions.map((position) => (
              <BlotterRow
                key={position.symbol}
                position={position}
                deskId={deskId}
                decay={decayBySymbol?.get(position.symbol)}
                delta={deltaBySymbol?.get(position.symbol)}
                canTrade={canTrade}
                guide={guide?.(position)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
