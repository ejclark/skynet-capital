import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { ROLL_UNAVAILABLE_REASON } from "../../../src/trading/order-ticket";
import type { DeskPosition, PositionLot } from "../live/desk";
import { ClosePanel } from "./close-panel";
import { buysLabel } from "./glossary";
import { GlossaryTerm } from "./glossary-term";
import type { HoldingDecay } from "./holding-decay";
import {
  BestWorstContent,
  EventContent,
  GreeksContent,
  ProjectionContent,
} from "./position-columns";
import { withMinus } from "./position-row-spec";

/**
 * A DESK ROW, OPENED (#5071): what the ranked columns leave out, under the row's guidance line —
 * round 2's "Best/worst, expiry dates, fills and the picture open in the row". In order: what the
 * position bets on in plain words; the figures with no column at this width (a figure whose column
 * is showing hides here, `positions-columns.css`, so nothing is said twice); the buys that make up
 * the position, each closable on its own (#3186 slice 1); then the position's own Guidance and
 * Close. The writes are the owner's (#3807 slice 2d); everyone can open a row.
 * @category trading
 */

/** A buy addressed as a `DeskPosition` of its own — the shape `ClosePanel` closes, scoped to just
 *  this buy's quantity (#3186 slice 1: closing one options buy is the common case). */
function lotAsPosition(position: DeskPosition, lot: PositionLot): DeskPosition {
  const rawTotalPl = Number(lot.totalPl.replace(/[^0-9.-]/g, "")) || 0;
  return {
    ...position,
    quantity: lot.quantity,
    costPerShare: lot.costPerShare,
    price: lot.price,
    costBasis: lot.costBasis,
    value: lot.value,
    dayPl: lot.dayPl,
    dayTone: lot.dayTone,
    totalPl: lot.totalPl,
    totalPlRaw: rawTotalPl,
    returnPct: lot.returnPct,
    totalTone: lot.totalTone,
  };
}

const unit = (position: DeskPosition) => (position.isOption ? "contracts" : "shares");

/** The buys that make up the position: when, how many at what, worth now, P/L since. */
function Buys({
  position,
  deskId,
  canTrade,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  readonly canTrade: boolean;
}): ReactElement | null {
  const [closing, setClosing] = useState<string | undefined>(undefined);
  const rollWhyId = useId();
  const lots = position.lots ?? [];
  if (lots.length === 0) return null;
  const rolls = canTrade && position.isOption;
  return (
    <section className="pos-buys" aria-label={`${buysLabel(lots.length)} for ${position.display}`}>
      <h4 className="pos-open-title">{buysLabel(lots.length)}</h4>
      <ul className="pos-buys-list">
        {lots.map((lot) => (
          <li key={lot.lotId} className="pos-buy">
            <span className="pos-buy-when">{lot.openedAt}</span>
            <span className="pos-buy-size num">
              {lot.quantity} {unit(position)} at {lot.costPerShare}
            </span>
            <span className="pos-buy-value num">{withMinus(lot.value)}</span>
            <span className={`pos-buy-pl num tone-${lot.totalTone}`}>
              {withMinus(lot.totalPl)} ({withMinus(lot.returnPct)})
            </span>
            {canTrade ? (
              <span className="pos-buy-acts">
                <button
                  type="button"
                  className="btn mc-btn close-btn"
                  aria-expanded={closing === lot.lotId}
                  onClick={() => setClosing(closing === lot.lotId ? undefined : lot.lotId)}
                >
                  Close this buy
                </button>
                {rolls ? (
                  <button
                    type="button"
                    className="btn mc-btn"
                    disabled
                    aria-describedby={rollWhyId}
                  >
                    Roll
                  </button>
                ) : null}
              </span>
            ) : null}
            {canTrade && closing === lot.lotId ? (
              <div className="pos-buy-close">
                <ClosePanel
                  deskId={deskId}
                  position={lotAsPosition(position, lot)}
                  onDone={() => setClosing(undefined)}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {/* Roll's reason as text, once under the buys (#3807 slice 2e, dead end 8): a title has no
          hover on a phone. Every Roll above points at it with aria-describedby. */}
      {rolls ? (
        <p id={rollWhyId} className="lot-why">
          {ROLL_UNAVAILABLE_REASON}
        </p>
      ) : null}
    </section>
  );
}

export function PositionRowOpen({
  position,
  deskId,
  decay,
  delta,
  canTrade,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  readonly decay?: HoldingDecay;
  readonly delta?: number;
  readonly canTrade: boolean;
}): ReactElement {
  const [closeOpen, setCloseOpen] = useState(false);
  const many = (position.lots?.length ?? 0) > 0;
  return (
    <div className="pos-open">
      {position.plainName ? <p className="pos-open-plain">{position.plainName}</p> : null}
      <dl className="more-grid pos-open-grid">
        <div className="pos-more-greeks">
          <dt>θ · Δ</dt>
          <dd>
            <GreeksContent position={position} decay={decay} delta={delta} />
          </dd>
        </div>
        <div className="pos-more-model">
          <dt>Model projects</dt>
          <dd>
            <ProjectionContent />
          </dd>
        </div>
        <div>
          <dt>Cost basis</dt>
          <dd>{withMinus(position.costBasis)}</dd>
        </div>
        {position.isOption ? (
          <div>
            <dt>
              <GlossaryTerm term="expiresIn" />
            </dt>
            <dd>{position.expiresIn ?? "—"}</dd>
          </div>
        ) : null}
        <div className="pos-more-event">
          <dt>Next event</dt>
          <dd>
            <EventContent event={position.nextEvent} />
          </dd>
        </div>
        <div className="pos-more-best">
          <dt>
            <GlossaryTerm term="bestWorst" />
          </dt>
          <dd>
            <BestWorstContent position={position} />
          </dd>
        </div>
      </dl>
      <Buys position={position} deskId={deskId} canTrade={canTrade} />
      <div className="pos-open-acts">
        {/* Shares only: the guidance is about what to do with a stock you hold (#3729 step 4). The
            link carries the symbol and account, never the stake. */}
        {position.isOption ? null : (
          <Link
            to="/trade"
            search={{ desk: deskId, symbol: position.symbol, section: "guidance" }}
            className="btn mc-btn guidance-link"
          >
            Guidance
          </Link>
        )}
        {canTrade ? (
          <button
            type="button"
            className="btn mc-btn close-btn"
            aria-expanded={closeOpen}
            onClick={() => setCloseOpen(!closeOpen)}
          >
            {many ? "Close all" : "Close"}
          </button>
        ) : null}
      </div>
      {canTrade && closeOpen ? (
        <ClosePanel deskId={deskId} position={position} onDone={() => setCloseOpen(false)} />
      ) : null}
    </div>
  );
}
