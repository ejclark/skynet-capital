import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskPosition } from "../live/desk";

/**
 * One blotter row (#738 phase 2c, extracted 3b) — responsive disclosure per the round-1 verdict:
 * detail columns visible on wide viewports (`col-detail`), folded behind the chevron only when
 * the viewport hides them. The symbol is the door to the position's fill timeline.
 */

export function BlotterRow({
  position,
  onTimeline,
}: {
  readonly position: DeskPosition;
  readonly onTimeline: (position: DeskPosition) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr>
        <td className="fold-col">
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
        <td>
          <button type="button" className="sym sym-link" onClick={() => onTimeline(position)}>
            {position.display}
          </button>
          <span className="sym-sub">{position.detail}</span>
        </td>
        <td className="num">{position.quantity}</td>
        <td className="num col-detail">{position.costPerShare}</td>
        <td className="num">{position.price}</td>
        <td className="num col-detail">{position.costBasis}</td>
        <td className="num">{position.value}</td>
        <td className={`num col-detail tone-${position.dayTone}`}>{position.dayPl}</td>
        <td className={`num tone-${position.totalTone}`}>{position.totalPl}</td>
        <td className={`num col-detail tone-${position.totalTone}`}>{position.returnPct}</td>
      </tr>
      {open ? (
        <tr className="row-more">
          <td colSpan={10}>
            <dl className="more-grid">
              <div>
                <dt>Cost / share</dt>
                <dd>{position.costPerShare}</dd>
              </div>
              <div>
                <dt>Cost basis</dt>
                <dd>{position.costBasis}</dd>
              </div>
              <div>
                <dt>Day P/L</dt>
                <dd className={`tone-${position.dayTone}`}>
                  {position.dayPl} ({position.dayPct})
                </dd>
              </div>
              <div>
                <dt>Return</dt>
                <dd className={`tone-${position.totalTone}`}>{position.returnPct}</dd>
              </div>
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}
