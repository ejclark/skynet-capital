import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  ActivityReasoning,
  DeskActivityEvent,
  DeskActivityLeg,
  DeskMissingLeg,
} from "../live/desk";
import { cycleAnchor } from "./cycle-anchor";

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
 * widths — the "why" is not overflow detail. Its "Playbook" row is the owner's alone (#885: "we do
 * not show what playbooks others are using"): the server withholds the key from anyone else, and
 * `showPlaybook={false}` on a page the viewer does not own keeps the row from ever drawing. A bot's
 * option fill adds the order in words, its dollar cost and what would prove it wrong (#4642
 * criterion 8): the row's Price is per share, so the cost is where the ×100 is shown. A bot's
 * spread is ONE row — the spread in words, its net cash once — with each leg's own fill beneath
 * it (#4650), because the broker reports a spread's fills one per leg.
 * @category trading
 */
export function ActivityTable({
  events,
  showPlaybook = true,
  deskId,
}: {
  readonly events: readonly DeskActivityEvent[];
  readonly showPlaybook?: boolean;
  /** Whose ledger this is — needed to link a fill's decision to the whole round on that account's
   *  Heartbeat (#3961). Omitted where one table merges several accounts' rows, since a row carries
   *  no account of its own: the count still renders, the link honestly does not. */
  readonly deskId?: string;
}): ReactElement {
  const withWhy = events.some((event) => event.reasoning);
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
                {...(deskId ? { deskId } : {})}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** THE REST OF THE ROUND (#3961) — a fill is one decision out of a pass that usually weighed
 *  several: siblings it rejected or skipped, ideas the risk guards refused outright. The count
 *  rides here because it is the one number that says how much was weighed; the round itself stays
 *  one link away on Heartbeat rather than being copied into this row (`docs/IA.md` §8.1 — one home
 *  per fact, a joint renders as a row or a link). Both halves are absent for a fill whose decision
 *  predates the round being addressable, never faked. The link wears `door-link` — the house's
 *  "these words are the way in" style, accent AND underline, never the hue alone (docs/BRAND.md). */
function RoundLine({
  why,
  deskId,
}: {
  readonly why: ActivityReasoning;
  readonly deskId?: string;
}): ReactElement | null {
  const anchor = why.cycleAt ? cycleAnchor(why.cycleAt) : undefined;
  const counted =
    why.rawCount !== undefined && why.guardedCount !== undefined
      ? `${why.rawCount} idea${why.rawCount === 1 ? "" : "s"} → ${why.guardedCount} past the guards`
      : undefined;
  if (!(counted || (anchor && deskId))) return null;
  return (
    <div className="why-round">
      <dt>The round</dt>
      <dd>
        {counted}
        {counted && anchor && deskId ? " · " : null}
        {anchor && deskId ? (
          <Link className="door-link" to="/u/$id/decisions" params={{ id: deskId }} hash={anchor}>
            the whole pass
          </Link>
        ) : null}
      </dd>
    </div>
  );
}

function WhyDetail({
  why,
  showPlaybook,
  deskId,
  costShown = false,
}: {
  readonly why: ActivityReasoning;
  readonly showPlaybook: boolean;
  readonly deskId?: string;
  /** The row itself already says what the order cost (a spread's net) — said once, not twice. */
  readonly costShown?: boolean;
}): ReactElement {
  return (
    <dl className="more-grid why-grid">
      <div>
        <dt>Why</dt>
        <dd>“{why.reason}”</dd>
      </div>
      <div>
        <dt>Decided by</dt>
        <dd>{why.personaId}</dd>
      </div>
      {showPlaybook && why.playbookId ? (
        <div>
          <dt>Playbook</dt>
          <dd>
            {why.playbookId}
            {why.playbookMode ? ` · ${why.playbookMode}` : ""}
          </dd>
        </div>
      ) : null}
      {why.contract ? (
        <div>
          <dt>Order</dt>
          <dd className="num">{why.contract}</dd>
        </div>
      ) : null}
      {why.cost && !costShown ? (
        <div>
          <dt>Cost</dt>
          <dd className="num">{why.cost}</dd>
        </div>
      ) : null}
      {why.strategy ? (
        <div>
          <dt>Strategy</dt>
          <dd>{why.strategy}</dd>
        </div>
      ) : null}
      {why.expectation ? (
        <div>
          <dt>Expected</dt>
          <dd>{why.expectation}</dd>
        </div>
      ) : null}
      {why.invalidator ? (
        <div>
          <dt>Proves it wrong</dt>
          <dd>{why.invalidator}</dd>
        </div>
      ) : null}
      {why.guardDelta ? (
        <div>
          <dt>Risk guards</dt>
          <dd>{why.guardDelta}</dd>
        </div>
      ) : null}
      <RoundLine why={why} {...(deskId ? { deskId } : {})} />
    </dl>
  );
}

/** The row the URL points at, if any (#4046 item 1): a Thesis marker or a FORM square links
 *  `?section=activity#act-<orderId>`, but the ledger loads after the router has already tried the
 *  hash, so the browser's own jump finds nothing. The row scrolls itself in once it exists. */
function targetedRow(): string | undefined {
  const raw = typeof window === "undefined" ? "" : window.location.hash;
  const hash = raw.startsWith("#") ? decodeURIComponent(raw.slice(1)) : "";
  return hash.startsWith("act-") ? hash : undefined;
}

function ActivityRow({
  event,
  withWhy,
  showPlaybook,
  deskId,
}: {
  readonly event: DeskActivityEvent;
  readonly withWhy: boolean;
  readonly showPlaybook: boolean;
  readonly deskId?: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const anchor = `act-${event.orderId}`;
  const row = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    // Optional-call, as `decisions-section.tsx` does: happy-dom has no `scrollIntoView`.
    if (targetedRow() === anchor) row.current?.scrollIntoView?.({ block: "center" });
  }, [anchor]);
  const when = new Date(event.at);
  const stamp = Number.isNaN(when.getTime())
    ? event.at
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <>
      <tr id={anchor} ref={row}>
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
          <span className={`tl-side tl-${event.side}`}>{event.side.toUpperCase()}</span>
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
            <WhyDetail
              why={event.reasoning}
              showPlaybook={showPlaybook}
              costShown={event.net !== undefined}
              {...(deskId ? { deskId } : {})}
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
  const anchor = `act-${leg.orderId}`;
  const row = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (targetedRow() === anchor) row.current?.scrollIntoView?.({ block: "center" });
  }, [anchor]);
  return (
    <tr className="row-leg" id={anchor} ref={row}>
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
