import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import type { DeskPosition } from "../live/desk";
import type { HoldingDecay } from "./holding-decay";
import { positionAnchor } from "./position-anchor";
import {
  BestWorstContent,
  colClass,
  EventContent,
  GreeksContent,
  PlCell,
  POS_SPAN,
  PositionCell,
  ProjectionContent,
  ValueCell,
} from "./position-columns";
import { PositionRowOpen } from "./position-row-open";

/**
 * One desk row (#738 phase 2c; ranked columns #5071): the position in the table's ranked columns
 * (`position-columns.tsx`), its guidance line as a full-width row under it (#5070), and, when its
 * chevron is opened, everything the columns leave out (`position-row-open.tsx`) — round 2's depth
 * ladder: glance, then open in place. One disclosure per row: the buys and Close that used to sit
 * in the row (a symbol-header accordion, an action column) open with the rest, so the closed row
 * fits the table's width with no sideways scroll.
 * @category trading
 */
export function BlotterRow({
  position,
  deskId,
  decay,
  delta,
  canTrade = true,
  guide,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  /** This holding's time decay from the option book, when the feed quoted it. */
  readonly decay?: HoldingDecay;
  /** Its dollars for a $1 rise in the stock, from the same book. */
  readonly delta?: number;
  /** Does the viewer own this account (#3807 slice 2d, dead end 4)? The server refuses an order
   *  on any account that isn't yours (`account-identity-gate.ts`), so off it Close, Close this buy
   *  and Roll do not render — the page says why in visible text beside the blotter. Guidance is a
   *  read and stays. */
  readonly canTrade?: boolean;
  /** The position's guidance line (#5070), a full-width row right under this one. */
  readonly guide?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr id={positionAnchor(position.symbol)} className={open ? "row-opened" : undefined}>
        <PositionCell position={position} />
        {/* The four ranked-out columns hold their content in one `.pos-cell`, which a column at
            zero width does not lay out (`positions-columns.css`). */}
        <td className={colClass("greeks")}>
          <div className="pos-cell">
            <GreeksContent position={position} decay={decay} delta={delta} />
          </div>
        </td>
        <ValueCell position={position} />
        <PlCell position={position} />
        <td className={`num ${colClass("model")}`}>
          <div className="pos-cell">
            <ProjectionContent />
          </div>
        </td>
        <td className={`next-event ${colClass("event")}`}>
          <div className="pos-cell">
            <EventContent event={position.nextEvent} />
          </div>
        </td>
        <td className={`num ${colClass("best")}`}>
          <div className="pos-cell">
            <BestWorstContent position={position} />
          </div>
        </td>
        <td className={colClass("open")}>
          <button
            type="button"
            className="expand-btn"
            aria-expanded={open}
            aria-label={`Detail for ${position.display}`}
            onClick={() => setOpen(!open)}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </td>
      </tr>
      {guide ? (
        <tr className="row-guide">
          <td colSpan={POS_SPAN}>{guide}</td>
        </tr>
      ) : null}
      {open ? (
        <tr className="row-open">
          <td colSpan={POS_SPAN}>
            <PositionRowOpen
              position={position}
              deskId={deskId}
              decay={decay}
              delta={delta}
              canTrade={canTrade}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
