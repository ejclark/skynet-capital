import type { ReactElement } from "react";
import { useState } from "react";
import type { ActivityReasoning, DeskActivityEvent } from "../live/desk";

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
 * widths — the "why" is not overflow detail.
 * @category trading
 */
export function ActivityTable({
  events,
}: {
  readonly events: readonly DeskActivityEvent[];
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
              <ActivityRow key={`${event.orderId}-${event.at}`} event={event} withWhy={withWhy} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WhyDetail({ why }: { readonly why: ActivityReasoning }): ReactElement {
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
      {why.playbookId ? (
        <div>
          <dt>Playbook</dt>
          <dd>
            {why.playbookId}
            {why.playbookMode ? ` · ${why.playbookMode}` : ""}
          </dd>
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
      {why.guardDelta ? (
        <div>
          <dt>Risk guards</dt>
          <dd>{why.guardDelta}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function ActivityRow({
  event,
  withWhy,
}: {
  readonly event: DeskActivityEvent;
  readonly withWhy: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);
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
      <tr id={`act-${event.orderId}`}>
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
      {open && event.reasoning ? (
        <tr className="row-why">
          <td colSpan={9}>
            <WhyDetail why={event.reasoning} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
