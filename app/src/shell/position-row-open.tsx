import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { ROLL_UNAVAILABLE_REASON } from "../../../src/trading/order-ticket";
import type { DeskPosition, PositionLot } from "../live/desk";
import { withMinus } from "../ui";
import { ClosePanel, closeRefusal } from "./close-panel";
import { CloseReceipt, type SentClose } from "./close-receipt";
import { buysLabel } from "./glossary";
import { GlossaryTerm } from "./glossary-term";
import type { HoldingGreeks } from "./holding-decay";
import {
  BestWorstContent,
  EventContent,
  GreeksContent,
  ProjectionContent,
} from "./position-columns";

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
  const rawTotalPl = Number(lot.totalPl.replace(/\u2212/g, "-").replace(/[^0-9.-]/g, "")) || 0;
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

/** A buy's close button, in words that say what the order does (#5959). The ledger pairs a sell
 *  with the oldest buy first (`round-trips.ts`, FIFO) and the order names no buy, so only the
 *  oldest buy's sell closes that buy; any other's comes out of older buys first, and says so. */
function buyCloseLabel(position: DeskPosition, lot: PositionLot, index: number): string {
  return index === 0
    ? "Close this buy"
    : `Sell ${lot.quantity} ${unit(position)} (oldest buys first)`;
}

/** The buys that make up the position: when, how many at what, worth now, P/L since. Each closes
 *  as a sell of its own size, so the row's close refusal holds for every buy (#5091): under a short
 *  stock, "Close this buy" would add to the short — off, described by the row's own reason. */
function Buys({
  position,
  deskId,
  canTrade,
  refusedWhyId,
  onClosing,
  onClosed,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  readonly canTrade: boolean;
  /** When the row's Close is off: the id of its visible reason, which every buy's Close cites. */
  readonly refusedWhyId?: string;
  /** A buy's close opened — the next action, which clears the last receipt. */
  readonly onClosing: () => void;
  readonly onClosed: (sent: SentClose) => void;
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
        {lots.map((lot, index) => (
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
                {refusedWhyId ? (
                  <button
                    type="button"
                    className="btn mc-btn close-btn"
                    disabled
                    aria-describedby={refusedWhyId}
                  >
                    Close this buy
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn mc-btn close-btn"
                    aria-expanded={closing === lot.lotId}
                    onClick={() => {
                      onClosing();
                      setClosing(closing === lot.lotId ? undefined : lot.lotId);
                    }}
                  >
                    {buyCloseLabel(position, lot, index)}
                  </button>
                )}
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
            {canTrade && !refusedWhyId && closing === lot.lotId ? (
              <div className="pos-buy-close">
                <ClosePanel
                  deskId={deskId}
                  position={lotAsPosition(position, lot)}
                  buys={lots}
                  sellsOldestFirst={index > 0}
                  onDone={(sent) => {
                    setClosing(undefined);
                    onClosed(sent);
                  }}
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
  greeks,
  canTrade,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  readonly greeks?: HoldingGreeks;
  readonly canTrade: boolean;
}): ReactElement {
  const [closeOpen, setCloseOpen] = useState(false);
  // The last close sent from this row (#5959) — kept here, not in the panel, so it outlives the
  // panel and a buy the sell emptied; cleared by Dismiss or the next close opened.
  const [receipt, setReceipt] = useState<SentClose | undefined>(undefined);
  const whyId = useId();
  const refusal = closeRefusal(position);
  const many = (position.lots?.length ?? 0) > 0;
  return (
    <div className="pos-open">
      {position.plainName ? <p className="pos-open-plain">{position.plainName}</p> : null}
      <dl className="more-grid pos-open-grid">
        <div className="pos-more-greeks">
          <dt>θ · Δ</dt>
          <dd>
            <GreeksContent position={position} greeks={greeks} />
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
      <Buys
        position={position}
        deskId={deskId}
        canTrade={canTrade}
        {...(refusal ? { refusedWhyId: whyId } : {})}
        onClosing={() => setReceipt(undefined)}
        onClosed={setReceipt}
      />
      {receipt ? (
        <CloseReceipt
          key={receipt.orderId}
          deskId={deskId}
          sent={receipt}
          onDismiss={() => setReceipt(undefined)}
        />
      ) : null}
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
        {canTrade && refusal ? (
          <button type="button" className="btn mc-btn close-btn" disabled aria-describedby={whyId}>
            Close
          </button>
        ) : canTrade ? (
          <button
            type="button"
            className="btn mc-btn close-btn"
            aria-expanded={closeOpen}
            onClick={() => {
              setReceipt(undefined);
              setCloseOpen(!closeOpen);
            }}
          >
            {many ? "Close all" : "Close"}
          </button>
        ) : null}
      </div>
      {/* Short stock (#5086): the reason as text, the Roll pattern — a title has no hover on a
          phone, and a sell here would add to the short. Every buy's Close cites it too (#5091). */}
      {canTrade && refusal ? (
        <p id={whyId} className="lot-why">
          {refusal}
        </p>
      ) : null}
      {canTrade && closeOpen && !refusal ? (
        <ClosePanel
          deskId={deskId}
          position={position}
          {...(position.lots ? { buys: position.lots } : {})}
          onDone={(sent) => {
            setCloseOpen(false);
            setReceipt(sent);
          }}
        />
      ) : null}
    </div>
  );
}
