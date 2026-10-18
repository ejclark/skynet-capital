import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskActivityEvent, DeskActivityLeg, DeskMissingLeg } from "../live/desk";
import { type EntryLeg, type LedgerEntry, ledgerEntry, legTail } from "../live/ledger-entry";
import {
  byDay,
  dayHeader,
  dayWords,
  orderDayKey,
  orderStamp,
  signedDollars,
} from "../live/order-facts";
import { targetedAnchor, useLandOnHash } from "./landing";
import { OpenedOrder, PlaybookLine } from "./opened-order";

/**
 * THE LEDGER ON A DESK (#738; the receipt, #5317 — #5160 rounds 9–15). Four columns — What
 * happened · Playbook · Cash · Outcome — under a day divider per market day ("TUE · OCT 6"); the
 * entries sit indented under it, and no column is spent on the date (Eric, round 15: "i don't care
 * for the full column reserved for the date - indenting feels better"). An entry is its legs
 * (`ledger-entry.ts`):
 *  - a single order is one row: what happened, its playbook, its signed cash, and where it stands
 *    — `open`, `closed Oct 1`, `✕ canceled` — in the Outcome column;
 *  - a round trip is the close, then each order it closed (quieter, newest first), then a total
 *    under a dashed rule — "META · 9 days · Sep 22 → Oct 1" — with the signed result as its
 *    Outcome. An order the close closed is also its own entry on its own day; only that one
 *    carries its anchor.
 * The time an order filled moved into the opened order and Full detail; the bet lives there too.
 *
 * A bot's rows carry the decision that placed them (#3687 slice 4): a leading chevron opens it
 * directly beneath the entry, the blotter's inline row accordion (docs/PATTERNS.md). Opened, it is
 * the phone card's own view (#5262, `opened-order.tsx`). Its playbook is the owner's alone (#885:
 * "we do not show what playbooks others are using"): the server withholds the key from anyone
 * else, and `showPlaybook={false}` on a page the viewer does not own keeps it from ever drawing —
 * the column too. A bot's spread is ONE row — the spread in words, its net cash once — with each
 * leg's own fill beneath it (#4650), because the broker reports a spread's fills one per leg.
 * @category trading
 */
export function LedgerTable({
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
  const withPlaybook =
    showPlaybook && events.some((event) => event.reasoning?.playbookId !== undefined);
  const cols: Columns = { why: withWhy, playbook: withPlaybook };
  useLandOnHash(findLedgerRow, rowKey(events));
  return (
    <div className="blotter-card">
      <div className="blotter-scroll">
        <table className="blotter act-ledger-table">
          <thead>
            <tr>
              {withWhy ? (
                <th className="why-col">
                  <span className="visually-hidden">Why</span>
                </th>
              ) : null}
              <th className="act-what-col">What happened</th>
              {withPlaybook ? <th>Playbook</th> : null}
              <th className="num">Cash</th>
              <th className="num">Outcome</th>
            </tr>
          </thead>
          {byDay(events).map((day) => (
            <tbody key={day.key} className="act-day-group">
              <tr className="act-day-row">
                <th colSpan={span(cols)} scope="colgroup" id={`ledger-day-${day.key}`}>
                  <span>{dayHeader(day.key)}</span>
                </th>
              </tr>
              {day.events.map((event) => (
                <LedgerRow
                  key={`${event.orderId}-${event.at}`}
                  event={event}
                  cols={cols}
                  showPlaybook={showPlaybook}
                  selected={detail === event.orderId}
                  startOpen={reopen === event.orderId || detail === event.orderId}
                  {...(deskId ? { deskId } : {})}
                  {...(onDetail ? { onDetail } : {})}
                />
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

/** Which optional columns the table draws: the why chevron (any decision) and Playbook (any
 *  playbook the viewer may see). */
interface Columns {
  readonly why: boolean;
  readonly playbook: boolean;
}

const span = (cols: Columns): number => 3 + (cols.why ? 1 : 0) + (cols.playbook ? 1 : 0);

/** The row the URL points at, if any (#4046 item 1): a Thesis marker or a FORM square links
 *  `?section=activity#act-<orderId>`, but the ledger loads after the router has already tried the
 *  hash, so the browser's own jump finds nothing. The table lands on the row once it exists — the
 *  same landing a position gets (`landing.ts`, #5022): centred below the sticky head, marked. */
export function targetedLedgerRow(): string | undefined {
  return typeof window === "undefined" ? undefined : targetedAnchor("act-", window.location.hash);
}

export const findLedgerRow = (hash: string): HTMLElement | undefined => {
  const anchor = targetedAnchor("act-", hash);
  return (anchor && document.getElementById(anchor)) || undefined;
};

/** Every anchor the table draws, a spread's legs included: it changes when an older page lands. */
export const rowKey = (events: readonly DeskActivityEvent[]): string =>
  events.flatMap((e) => [e.orderId, ...(e.legs ?? []).map((leg) => leg.orderId)]).join(",");

function LedgerRow({
  event,
  cols,
  showPlaybook,
  selected = false,
  startOpen = false,
  deskId,
  onDetail,
}: {
  readonly event: DeskActivityEvent;
  readonly cols: Columns;
  readonly showPlaybook: boolean;
  readonly selected?: boolean;
  readonly startOpen?: boolean;
  readonly deskId?: string;
  readonly onDetail?: (orderId: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(startOpen);
  const entry = ledgerEntry(event);
  const [own, ...opened] = entry.legs;
  const playbook = showPlaybook ? event.reasoning?.playbookId : undefined;
  const full = span(cols);
  return (
    <>
      <tr id={`act-${event.orderId}`} className="act-entry" data-detail={selected ? "" : undefined}>
        {cols.why ? (
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
        {/* The day is the divider's and the time is the opened order's; the stamp stays one hover
            away, in New York time like every other place an order's time is said (#5164). */}
        <td className="act-what-cell" title={orderStamp(event) ?? dayWords(orderDayKey(event))}>
          {own ? <LegWords leg={own} event={event} /> : null}
        </td>
        {cols.playbook ? (
          <td className="act-playbook-cell">
            {playbook && event.reasoning ? (
              <PlaybookLine
                why={event.reasoning}
                playbookId={playbook}
                orderId={event.orderId}
                deskId={deskId}
                bare
              />
            ) : null}
          </td>
        ) : null}
        <td className="num">{own?.cash !== undefined ? signedDollars(own.cash) : null}</td>
        <td className="num act-outcome-cell">
          {entry.total ? null : <Outcome outcome={entry.outcome} />}
        </td>
      </tr>
      {opened.map((leg) => (
        <OpenedRow key={leg.key} leg={leg} cols={cols} />
      ))}
      {event.legs?.map((leg) => (
        <LegRow key={leg.orderId} leg={leg} span={full} />
      ))}
      {event.missingLegs?.map((leg) => (
        <MissingLegRow key={`${leg.side}-${leg.display}`} leg={leg} span={full} />
      ))}
      {entry.total ? <TotalRow entry={entry} cols={cols} /> : null}
      {open && event.reasoning ? (
        <tr className="row-why">
          <td colSpan={full}>
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

/** What happened, in one line — an expiry or assignment names itself on a dashed chip, nothing
 *  bought or sold (#4650); a fill placed straight in Alpaca, or recovered rather than watched,
 *  says so beside it. */
function LegWords({
  leg,
  event,
}: {
  readonly leg: EntryLeg;
  readonly event?: DeskActivityEvent;
}): ReactElement {
  const { side, size, name } = leg.words;
  const tail = legTail(leg.words);
  return (
    <>
      <span className={event?.lifecycle ? "act-side act-lifecycle" : "act-side"}>{side}</span>{" "}
      {size} <span className="act-inst">{name}</span>
      {tail ? ` ${tail}` : null}
      {event?.backfilled ? <span className="tl-backfill">backfilled</span> : null}
      {event?.origin === "alpaca-direct" ? (
        <span
          className="tl-direct"
          title="Placed directly in Alpaca — this order never went through the app's ticket"
        >
          <span aria-hidden="true">*</span>
          <span className="visually-hidden">Placed directly in Alpaca</span>
        </span>
      ) : null}
    </>
  );
}

/** An order the entry's close closed, under the close: quieter, its cash beside it. */
function OpenedRow({
  leg,
  cols,
}: {
  readonly leg: EntryLeg;
  readonly cols: Columns;
}): ReactElement {
  return (
    <tr className="act-opened">
      {cols.why ? <td className="why-col" /> : null}
      <td className="act-what-cell">
        <LegWords leg={leg} />
      </td>
      {cols.playbook ? <td /> : null}
      <td className="num">{leg.cash !== undefined ? signedDollars(leg.cash) : null}</td>
      <td />
    </tr>
  );
}

/** A round trip's bottom line, under a dashed rule: what, how long, when — and the result. */
function TotalRow({
  entry,
  cols,
}: {
  readonly entry: LedgerEntry;
  readonly cols: Columns;
}): ReactElement | null {
  if (!entry.total) return null;
  const { name, held, range } = entry.total;
  return (
    <tr className="act-total-row">
      {cols.why ? <td className="why-col" /> : null}
      <td className="act-what-cell" colSpan={cols.playbook ? 3 : 2}>
        <span className="act-total-name">
          {name} · {held}
        </span>{" "}
        <span className="act-total-range">· {range}</span>
      </td>
      <td className="num act-outcome-cell">
        <Outcome outcome={entry.outcome} />
      </td>
    </tr>
  );
}

function Outcome({ outcome }: { readonly outcome: LedgerEntry["outcome"] }): ReactElement | null {
  if (!outcome) return null;
  return (
    <span className="act-outcome">
      {outcome.tone ? <b className={`tone-${outcome.tone}`}>{outcome.text}</b> : outcome.text}
    </span>
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
