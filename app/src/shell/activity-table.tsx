import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskActivityEvent, DeskActivityLeg, DeskMissingLeg } from "../live/desk";
import { lifecycleDayText } from "../live/lifecycle-day";
import { orderStamp } from "../live/order-facts";
import { targetedAnchor, useLandOnHash } from "./landing";
import { OpenedOrder } from "./opened-order";

/**
 * The activity ledger as a table (#738 — the Cockpit's Activity section). Replaces the old
 * `<ul>` + `EventLine` timeline with the same `blotter` table the Positions section uses, so
 * the two sections read as one surface. P/L and Return columns appear only on closing fills
 * (sells that close longs, buys that close shorts) — opening fills show `—`, the honest
 * "nothing realized yet" rather than a misleading $0.
 *
 * `col-detail` on P/L and Return follows the blotter's responsive disclosure: the core columns
 * (Date, Symbol, Side, Qty, Price, Status) survive at phone width, the P/L pair scrolls out.
 * Status joined the core set in #3407 P0 — a member on a phone could not see whether an order was
 * working, filled or cancelled, the one column the parity study's audit found every reference
 * desk keeps phone-first.
 *
 * A bot's rows carry the decision that placed them (#3687 slice 4 — the Decisions tab folded into
 * its trades): a leading chevron opens it directly beneath the row, the blotter's inline row
 * accordion (docs/PATTERNS.md). Unlike the blotter's own fold column it never hides at wide
 * widths — the "why" is not overflow detail. Opened, it is the phone card's own view (#5262,
 * `opened-order.tsx`): the price line on the left, Placed by and Why on the right. Its playbook is
 * the owner's alone (#885: "we do not show what playbooks others are using"): the server withholds
 * the key from anyone else, and `showPlaybook={false}` on a page the viewer does not own keeps it
 * from ever drawing. A bot's spread is ONE row — the spread in words, its net cash once — with each leg's own fill beneath
 * it (#4650), because the broker reports a spread's fills one per leg.
 * @category trading
 */
export function ActivityTable({
  events,
  showPlaybook = true,
  deskId,
  onDetail,
  detail,
  reopen,
}: {
  readonly events: readonly DeskActivityEvent[];
  readonly showPlaybook?: boolean;
  /** Whose ledger this is — needed to link a fill's decision to the whole round on that account's
   *  Heartbeat (#3961). Omitted where one table merges several accounts' rows, since a row carries
   *  no account of its own: the count still renders, the link honestly does not. */
  readonly deskId?: string;
  /** Opens an order's full detail (#5101): "Full detail ›" under an opened why. Absent, no door. */
  readonly onDetail?: (orderId: string) => void;
  /** The order whose full detail is open beside the table: its row wears the selected mark. */
  readonly detail?: string;
  /** The order whose full detail was just closed: its why comes back opened. */
  readonly reopen?: string;
}): ReactElement {
  const withWhy = events.some((event) => event.reasoning);
  useLandOnHash(findActivityRow, rowKey(events));
  return (
    <div className="blotter-card">
      <div className="blotter-scroll">
        <table className="blotter">
          <thead>
            <tr>
              {withWhy ? (
                <th className="why-col">
                  <span className="visually-hidden">Why</span>
                </th>
              ) : null}
              <th>Date</th>
              <th>Symbol</th>
              <th>Side</th>
              <th className="num">Qty</th>
              <th className="num">Price</th>
              <th className="num col-detail">P/L</th>
              <th className="num col-detail">Return</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <ActivityRow
                key={`${event.orderId}-${event.at}`}
                event={event}
                withWhy={withWhy}
                showPlaybook={showPlaybook}
                selected={detail === event.orderId}
                startOpen={reopen === event.orderId || detail === event.orderId}
                {...(deskId ? { deskId } : {})}
                {...(onDetail ? { onDetail } : {})}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The row the URL points at, if any (#4046 item 1): a Thesis marker or a FORM square links
 *  `?section=activity#act-<orderId>`, but the ledger loads after the router has already tried the
 *  hash, so the browser's own jump finds nothing. The table lands on the row once it exists — the
 *  same landing a position gets (`landing.ts`, #5022): centred below the sticky head, marked. */
export function targetedActivityRow(): string | undefined {
  return typeof window === "undefined" ? undefined : targetedAnchor("act-", window.location.hash);
}

export const findActivityRow = (hash: string): HTMLElement | undefined => {
  const anchor = targetedAnchor("act-", hash);
  return (anchor && document.getElementById(anchor)) || undefined;
};

/** Every anchor the table draws, a spread's legs included: it changes when an older page lands. */
export const rowKey = (events: readonly DeskActivityEvent[]): string =>
  events.flatMap((e) => [e.orderId, ...(e.legs ?? []).map((leg) => leg.orderId)]).join(",");

/** What a lifecycle row says where an order's side would be. Nothing was bought or sold, and on a
 *  phone a $0 "SELL" under the put's real sale read as a second sale (#4650). The word carries it;
 *  the chip is neutral and dashed, never the buy/sell hues. */
const LIFECYCLE_CHIP: Record<NonNullable<DeskActivityEvent["lifecycle"]>, string> = {
  OPEXP: "EXPIRED",
  OPASN: "ASSIGNED",
  OPEXC: "EXERCISED",
  OPTRD: "SETTLED",
};

function SideChip({ event }: { readonly event: DeskActivityEvent }): ReactElement {
  return event.lifecycle ? (
    <span className="tl-side tl-lifecycle">{LIFECYCLE_CHIP[event.lifecycle]}</span>
  ) : (
    <span className={`tl-side tl-${event.side}`}>{event.side.toUpperCase()}</span>
  );
}

/** An order's day and time in New York time, naming the zone — the phone card's clock (#5164); a
 *  lifecycle row's DAY alone, the lifecycle card's own rule — its stamp is a synthetic end-of-day
 *  instant, so a time would be one the event never had. */
function rowStamp(event: DeskActivityEvent, now = new Date()): string {
  if (event.lifecycle) return lifecycleDayText(event.at, now);
  return orderStamp(event, now) ?? event.at;
}

function ActivityRow({
  event,
  withWhy,
  showPlaybook,
  selected = false,
  startOpen = false,
  deskId,
  onDetail,
}: {
  readonly event: DeskActivityEvent;
  readonly withWhy: boolean;
  readonly showPlaybook: boolean;
  readonly selected?: boolean;
  readonly startOpen?: boolean;
  readonly deskId?: string;
  readonly onDetail?: (orderId: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(startOpen);
  const stamp = rowStamp(event);
  return (
    <>
      <tr id={`act-${event.orderId}`} data-detail={selected ? "" : undefined}>
        {withWhy ? (
          <td className="why-col">
            {event.reasoning ? (
              <button
                type="button"
                className="expand-btn"
                aria-expanded={open}
                aria-label={`Why ${event.display} was ${event.side === "buy" ? "bought" : "sold"}`}
                onClick={() => setOpen(!open)}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            ) : null}
          </td>
        ) : null}
        <td className="num">{stamp}</td>
        <td>
          <span className="sym">{event.display}</span>
          {event.net ? <span className="sym-sub">net {event.net}</span> : null}
        </td>
        <td>
          <SideChip event={event} />
        </td>
        <td className="num">
          {event.filled > 0 && event.filled !== event.quantity
            ? `${event.filled}/${event.quantity}`
            : event.quantity}
        </td>
        <td className="num">{event.price}</td>
        <td className={`num col-detail${event.realizedTone ? ` tone-${event.realizedTone}` : ""}`}>
          {event.realizedPl ?? "—"}
        </td>
        <td className="num col-detail">{event.returnPct ?? "—"}</td>
        <td>
          <span className="tl-status">{event.status}</span>
          {event.backfilled ? <span className="tl-backfill">backfilled</span> : null}
          {event.origin === "alpaca-direct" ? (
            <span
              className="tl-direct"
              title="Placed directly in Alpaca — this order never went through the app's ticket"
            >
              <span aria-hidden="true">*</span>
              <span className="visually-hidden">Placed directly in Alpaca</span>
            </span>
          ) : null}
        </td>
      </tr>
      {event.legs?.map((leg) => (
        <LegRow key={leg.orderId} leg={leg} span={withWhy ? 9 : 8} />
      ))}
      {event.missingLegs?.map((leg) => (
        <MissingLegRow key={`${leg.side}-${leg.display}`} leg={leg} span={withWhy ? 9 : 8} />
      ))}
      {open && event.reasoning ? (
        <tr className="row-why">
          <td colSpan={9}>
            <OpenedOrder
              event={event}
              showPlaybook={showPlaybook}
              wide
              deskId={deskId}
              onDetail={onDetail}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** One leg of a spread, beneath the spread's row (#4650) — always shown, never behind the chevron:
 *  the broker filled each leg as its own order, so a member must be able to see what each one paid
 *  or received without opening anything. One spanning cell, capped to the visible table, so the
 *  contract, its side in words and its dollars all read at 390px. Its anchor is the leg's own order
 *  id, the one a Thesis marker for that fill links to. */
function LegRow({
  leg,
  span,
}: {
  readonly leg: DeskActivityLeg;
  readonly span: number;
}): ReactElement {
  return (
    <tr className="row-leg" id={`act-${leg.orderId}`}>
      <td colSpan={span}>
        <div className="leg-line">
          <span className="visually-hidden">Leg: </span>
          <span className={`tl-side tl-${leg.side}`}>{leg.side.toUpperCase()}</span>
          <span className="leg-contract">{leg.display}</span>
          {/* No cost means nothing filled at a known price: the broker's status is what there is. */}
          <span className="leg-cost num">{leg.cost ?? leg.status}</span>
        </div>
      </td>
    </tr>
  );
}

/** A leg the spread placed whose fill the account's ledger does not hold yet — named, so the row
 *  above never passes the legs it does hold off as the whole spread. A dashed rule marks it, a
 *  shape rather than a tone. */
function MissingLegRow({
  leg,
  span,
}: {
  readonly leg: DeskMissingLeg;
  readonly span: number;
}): ReactElement {
  return (
    <tr className="row-leg row-leg-missing">
      <td colSpan={span}>
        <div className="leg-line">
          <span className="visually-hidden">Leg: </span>
          <span className={`tl-side tl-${leg.side}`}>{leg.side.toUpperCase()}</span>
          <span className="leg-contract">{leg.display}</span>
          <span className="leg-cost">
            not in this account's ledger yet — the spread's result waits for it
          </span>
        </div>
      </td>
    </tr>
  );
}
