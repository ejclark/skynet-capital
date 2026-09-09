import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { type DeskPosition, fetchDeskActivity } from "../live/desk";
import { EventLine } from "./timeline-drawer";

/**
 * One blotter row (#738 phase 2c, extracted 3b) — responsive disclosure per the round-1 verdict:
 * detail columns visible on wide viewports (`col-detail`), folded behind the chevron only when
 * the viewport hides them. The symbol is the door to the position's fill timeline, which opens
 * INLINE as its own accordion row (#2321) — never a right-rail drawer, which read as too far
 * removed from the row that triggered it. Its open state (`timelineOpen`) is deliberately separate
 * from the detail fold's `open`: the fold is hidden at ≥1100px (`desk.css`'s responsive-disclosure
 * rule), so sharing one boolean would make the timeline undiscoverable on desktop.
 * @category trading
 */

export function BlotterRow({
  position,
  deskId,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  // The queryKey is shared across every row on this desk, so React Query fetches the ledger once
  // no matter how many symbols get expanded — `enabled` only gates when the FIRST row asks for it.
  const activity = useQuery({
    queryKey: ["desk-activity", deskId],
    queryFn: () => fetchDeskActivity(deskId),
    staleTime: 30_000,
    enabled: timelineOpen,
  });
  const events = activity.data?.activity.filter((e) => e.symbol === position.symbol) ?? [];

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
          <button
            type="button"
            className="sym sym-link"
            aria-expanded={timelineOpen}
            onClick={() => setTimelineOpen(!timelineOpen)}
          >
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
      {timelineOpen ? (
        <tr className="row-timeline">
          <td colSpan={10}>
            {activity.isPending ? <p className="note">Reading the ledger…</p> : null}
            {activity.isError ? <p className="note">The ledger is unreachable.</p> : null}
            {activity.data && !activity.data.available ? (
              <p className="note">No durable activity ledger is wired in this deployment.</p>
            ) : null}
            {activity.data?.available && events.length === 0 ? (
              <p className="note">
                No recorded orders for {position.display} in the ledger's window.
              </p>
            ) : null}
            {events.length > 0 ? (
              <ul className="tl">
                {events.map((event) => (
                  <EventLine key={`${event.orderId}-${event.at}`} event={event} />
                ))}
              </ul>
            ) : null}
            {events.some((e) => e.origin === "alpaca-direct") ? (
              <p className="tl-legend">
                <span className="tl-direct" aria-hidden="true">
                  *
                </span>{" "}
                Placed directly in Alpaca — this order skipped the app's ticket, so none of the
                desk's pre-trade checks saw it.
              </p>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}
