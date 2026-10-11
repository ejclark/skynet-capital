import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { DeskActivityEvent } from "../live/desk";
import {
  byDay,
  cashMoved,
  dayHeader,
  instrumentWords,
  orderBet,
  orderTime,
  sideWord,
  signedDollars,
  sizeWord,
  statusMark,
} from "../live/order-facts";
import { findActivityRow, rowKey, WhyDetail } from "./activity-table";
import { BetGlyph } from "./bet-glyph";
import { useLandOnHash } from "./landing";
import { withMinus } from "./position-row-spec";

/**
 * THE PHONE'S ACTIVITY, ONE CARD AN ORDER (#5101; round 2 of #5037, the activity question, slice 1).
 * At ≤700px the wide ledger gives way to cards under a day header ("TUE · OCT 6"), so the date
 * leaves the row and nothing scrolls sideways. Each card is two lines:
 *  - line 1 is what happened: "SOLD 1 CRWV $80 PUT · Nov 6", and on the right the cash it moved,
 *    the word before the number so the digits share one edge — "received +$255", "paid −$9,044";
 *  - line 2 is the decision: the bet as a shape and a few words read off the contract ("Stays above
 *    $80"), the playbook it ran under for the owner alone (#885), a status only when it isn't
 *    "filled" (◷ working, ✕ canceled), and on the right what the order booked if it closed one.
 * Tapping the card opens it in place, under its own row: the time it filled, the price a share, and
 * — for a bot's order — the decision that placed it, the same words the desk table opens to.
 *
 * Every figure keeps its sign and its word, so neither the gain nor the cash direction rides on hue
 * (a standing reader is red/green colourblind). The card carries `id="act-<orderId>"`, the anchor a
 * Thesis marker or a FORM square links, and lands the way the table's rows do (`landing.ts`): only
 * one of the two layouts is ever mounted (`activity-ledger.tsx`), so the id is never doubled.
 */
export function ActivityCards({
  events,
  showPlaybook = true,
  deskId,
  onDetail,
  reopen,
}: {
  readonly events: readonly DeskActivityEvent[];
  readonly showPlaybook?: boolean;
  readonly deskId?: string;
  /** Opens an order's full detail (#5101) — "Full detail ›" in the opened card. Absent, no door. */
  readonly onDetail?: (orderId: string) => void;
  /** The order whose full detail was just closed: its card comes back opened, the row it left. */
  readonly reopen?: string;
}): ReactElement {
  useLandOnHash(findActivityRow, rowKey(events));
  return (
    <div className="act-cards">
      {byDay(events).map((day) => (
        <section key={day.key} className="act-day" aria-labelledby={`ledger-day-${day.key}`}>
          <h3 id={`ledger-day-${day.key}`} className="act-day-head">
            {dayHeader(day.key)}
          </h3>
          <ol className="act-day-list">
            {day.events.map((event) => (
              <li key={`${event.orderId}-${event.at}`}>
                <ActivityCard
                  event={event}
                  showPlaybook={showPlaybook}
                  startOpen={reopen === event.orderId}
                  {...(deskId ? { deskId } : {})}
                  {...(onDetail ? { onDetail } : {})}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Where a side would be on an expiry or assignment report: the event's name, on a dashed chip —
 *  nothing was bought or sold (#4650), so it never borrows a side's word. */
const LIFECYCLE_WORD: Record<NonNullable<DeskActivityEvent["lifecycle"]>, string> = {
  OPEXP: "EXPIRED",
  OPASN: "ASSIGNED",
  OPEXC: "EXERCISED",
  OPTRD: "SETTLED",
};

function ActivityCard({
  event,
  showPlaybook,
  startOpen,
  deskId,
  onDetail,
}: {
  readonly event: DeskActivityEvent;
  readonly showPlaybook: boolean;
  readonly startOpen: boolean;
  readonly deskId?: string;
  readonly onDetail?: (orderId: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(startOpen);
  const bodyId = useId();
  const bet = orderBet(event);
  const cash = cashMoved(event);
  const status = statusMark(event);
  const playbook = showPlaybook ? event.reasoning?.playbookId : undefined;
  return (
    <article id={`act-${event.orderId}`} className="act-card" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="act-card-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="act-what">
          {event.lifecycle ? (
            <span className="act-side act-lifecycle">{LIFECYCLE_WORD[event.lifecycle]}</span>
          ) : (
            <span className="act-side">{sideWord(event)}</span>
          )}{" "}
          <span className="act-size">{sizeWord(event)}</span>{" "}
          <span className="act-inst">{instrumentWords(event)}</span>
        </span>
        <span className="act-cash">
          {cash ? (
            <>
              {cash.word} <b>{signedDollars(cash.dollars)}</b>
            </>
          ) : null}
        </span>
        <span className="act-bet">
          {bet ? (
            <span className="act-bet-words">
              <BetGlyph shape={bet.shape} />
              {bet.words}
            </span>
          ) : event.lifecycle ? (
            <span className="act-bet-words">{event.status}</span>
          ) : null}
          {playbook ? <span className="act-playbook">{playbook}</span> : null}
          {status ? <span className="act-status">{status}</span> : null}
        </span>
        <span className="act-result">
          {event.realizedPl ? (
            <>
              booked{" "}
              <b className={event.realizedTone ? `tone-${event.realizedTone}` : undefined}>
                {withMinus(event.realizedPl)}
              </b>
            </>
          ) : null}
        </span>
      </button>
      {event.legs || event.missingLegs ? <CardLegs event={event} /> : null}
      {open ? (
        <div id={bodyId} className="act-card-body">
          <Receipt event={event} />
          {event.reasoning ? (
            <WhyDetail
              why={event.reasoning}
              showPlaybook={showPlaybook}
              costShown={event.net !== undefined}
              {...(deskId ? { deskId } : {})}
            />
          ) : null}
          {onDetail && !event.lifecycle ? (
            <button type="button" className="act-full" onClick={() => onDetail(event.orderId)}>
              Full detail <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** The opened card's first line — the facts the row left out to stay two lines: the time, the
 *  price a share (an option's is per share too, its ×100 is in the cash), and who placed it when
 *  the audit log says it was not this app. */
function Receipt({ event }: { readonly event: DeskActivityEvent }): ReactElement {
  const parts = [
    orderTime(event),
    event.filled > 0 && !event.lifecycle && event.price !== "—"
      ? `${event.symbol === "" ? "net" : "filled at"} ${event.price} a share`
      : undefined,
    event.lifecycle ? undefined : event.status.replace(/_/g, " "),
    event.backfilled ? "backfilled" : undefined,
    event.origin === "alpaca-direct"
      ? "placed directly in Alpaca, not through this app"
      : undefined,
  ].filter(Boolean);
  return <p className="act-receipt">{parts.join(" · ")}</p>;
}

/** A spread's legs, always shown (#4650): the broker filled each as its own order, so what each one
 *  paid or received reads without opening anything — a leg not in the ledger yet is named. */
function CardLegs({ event }: { readonly event: DeskActivityEvent }): ReactElement {
  return (
    <ul className="act-legs">
      {event.legs?.map((leg) => (
        <li key={leg.orderId} id={`act-${leg.orderId}`} className="act-leg">
          <span className="act-side">{leg.side === "buy" ? "BUY" : "SELL"}</span>{" "}
          <span className="act-leg-contract">{instrumentWords(leg)}</span>{" "}
          <span className="act-leg-cost">{leg.cost ?? leg.status}</span>
        </li>
      ))}
      {event.missingLegs?.map((leg) => (
        <li key={`${leg.side}-${leg.display}`} className="act-leg act-leg-missing">
          <span className="act-side">{leg.side === "buy" ? "BUY" : "SELL"}</span>{" "}
          <span className="act-leg-contract">{leg.display}</span>{" "}
          <span className="act-leg-cost">
            not in this account's ledger yet — the spread's result waits for it
          </span>
        </li>
      ))}
    </ul>
  );
}
