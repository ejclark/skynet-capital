import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { DeskActivityEvent } from "../live/desk";
import { type EntryLeg, type LedgerEntry, ledgerEntry, legTail } from "../live/ledger-entry";
import { byDay, dayHeader, instrumentWords, orderTime, signedDollars } from "../live/order-facts";
import { useLandOnHash } from "./landing";
import { findLedgerRow, rowKey } from "./ledger-table";
import { OpenedOrder, PlaybookLine } from "./opened-order";

/**
 * THE PHONE'S LEDGER, ONE CARD AN ENTRY (#5101; the receipt, #5317 — #5160 rounds 9–15). At ≤700px
 * the wide ledger gives way to cards under a day header ("TUE · OCT 6"), so the date leaves the row
 * and nothing scrolls sideways. A card is its legs (`ledger-entry.ts`), never a symbol header:
 *  - a single order: what happened with its signed cash on the right, then its contract or price on
 *    a quieter second line, then the playbook it ran under (the owner's alone, #885) with where it
 *    stands on the right — `open`, `closed Oct 1`, `✕ canceled`;
 *  - a round trip: the close, then each order it closed (quieter, its own day beside its price),
 *    then a dashed rule and the total — "META · 9 days" with the signed result.
 * Tapping the card opens it in place, under its own row: the time it filled and the price a share,
 * then the view the desk table's row opens to (#5262, `opened-order.tsx`). The bet lives there,
 * never in the list (#5317).
 *
 * Every figure keeps its sign, so neither the gain nor the cash direction rides on hue (a standing
 * reader is red/green colourblind). The card carries `id="act-<orderId>"`, the anchor a Thesis
 * marker or a FORM square links, and lands the way the table's rows do (`landing.ts`): only one of
 * the two layouts is ever mounted (`ledger.tsx`), so the id is never doubled. An order a
 * close closed is drawn inside the close's card too, but carries no anchor there — its own card,
 * on its own day, keeps it.
 */
export function LedgerCards({
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
  useLandOnHash(findLedgerRow, rowKey(events));
  return (
    <div className="act-cards">
      {byDay(events).map((day) => (
        <section key={day.key} className="act-day" aria-labelledby={`ledger-day-${day.key}`}>
          <h3 id={`ledger-day-${day.key}`} className="act-day-head">
            <span>{dayHeader(day.key)}</span>
          </h3>
          <ol className="act-day-list">
            {day.events.map((event) => (
              <li key={`${event.orderId}-${event.at}`}>
                <LedgerCard
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

function LedgerCard({
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
  const entry = ledgerEntry(event);
  const playbook = showPlaybook ? event.reasoning?.playbookId : undefined;
  // A single order's standing sits beside its playbook on the last line; with no playbook to sit
  // beside, it moves up to the right of the second line rather than holding a line alone.
  const standingBelow = !entry.total && playbook !== undefined;
  return (
    <article id={`act-${event.orderId}`} className="act-card" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="act-card-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        {entry.legs.map((leg, i) => (
          <CardLeg
            key={leg.key}
            leg={leg}
            {...(i === 0 && !entry.total && !standingBelow ? { outcome: entry.outcome } : {})}
          />
        ))}
        {entry.total ? <CardTotal entry={entry} /> : null}
      </button>
      {event.legs || event.missingLegs ? <CardLegs event={event} /> : null}
      {playbook && event.reasoning ? (
        <p className="act-foot">
          <PlaybookLine
            why={event.reasoning}
            playbookId={playbook}
            orderId={event.orderId}
            deskId={deskId}
            bare
          />
          {standingBelow ? <Outcome outcome={entry.outcome} /> : null}
        </p>
      ) : null}
      {open ? (
        <div id={bodyId} className="act-card-body">
          <Receipt event={event} />
          <OpenedOrder
            event={event}
            showPlaybook={showPlaybook}
            {...(deskId ? { deskId } : {})}
            {...(onDetail ? { onDetail } : {})}
          />
        </div>
      ) : null}
    </article>
  );
}

/** One leg in two lines: what happened with its cash, then its contract or price (and, for an order
 *  the close closed, its own day) — the outcome on the right when this card has no last line. */
function CardLeg({
  leg,
  outcome,
}: {
  readonly leg: EntryLeg;
  readonly outcome?: LedgerEntry["outcome"];
}): ReactElement {
  const sub = [legTail(leg.words), leg.opened?.day].filter(Boolean).join(" · ");
  return (
    <span className="act-leg-row" data-opened={leg.opened ? "" : undefined}>
      <span className="act-what">
        <span className="act-side">{leg.words.side}</span> {leg.words.size}{" "}
        <span className="act-inst">{leg.words.name}</span>
      </span>
      <span className="act-cash">{leg.cash !== undefined ? signedDollars(leg.cash) : null}</span>
      {sub ? <span className="act-sub">{sub}</span> : null}
      {outcome ? <Outcome outcome={outcome} /> : null}
    </span>
  );
}

/** A round trip's bottom line, under a dashed rule: "META · 9 days" and the signed result. */
function CardTotal({ entry }: { readonly entry: LedgerEntry }): ReactElement | null {
  if (!entry.total) return null;
  return (
    <span className="act-total">
      <span className="act-total-name">
        {entry.total.name} · {entry.total.held}
      </span>
      <Outcome outcome={entry.outcome} />
    </span>
  );
}

function Outcome({ outcome }: { readonly outcome: LedgerEntry["outcome"] }): ReactElement | null {
  if (!outcome) return null;
  return (
    <span className="act-outcome">
      <b className={outcome.tone ? `tone-${outcome.tone}` : undefined}>{outcome.text}</b>
    </span>
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
    // "filled" is what the price before it already says; any other status is news (#5262).
    event.lifecycle || event.status === "filled" ? undefined : event.status.replace(/_/g, " "),
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
