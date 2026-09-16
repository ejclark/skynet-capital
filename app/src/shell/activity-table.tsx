import type { ReactElement } from "react";
import type { DeskActivityEvent } from "../live/desk";

/**
 * The activity ledger as a table (#738 — the Cockpit's Activity section). Replaces the old
 * `<ul>` + `EventLine` timeline with the same `blotter` table the Positions section uses, so
 * the two sections read as one surface. P/L and Return columns appear only on closing fills
 * (sells that close longs, buys that close shorts) — opening fills show `—`, the honest
 * "nothing realized yet" rather than a misleading $0.
 *
 * `col-detail` on P/L, Return, and Status follows the blotter's responsive disclosure: the
 * core columns (Date, Symbol, Side, Qty, Price) survive at phone width, detail scrolls out.
 * @category trading
 */
export function ActivityTable({
  events,
}: {
  readonly events: readonly DeskActivityEvent[];
}): ReactElement {
  return (
    <div className="blotter-card">
      <div className="blotter-scroll">
        <table className="blotter">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Side</th>
              <th className="num">Qty</th>
              <th className="num">Price</th>
              <th className="num col-detail">P/L</th>
              <th className="num col-detail">Return</th>
              <th className="col-detail">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <ActivityRow key={`${event.orderId}-${event.at}`} event={event} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityRow({ event }: { readonly event: DeskActivityEvent }): ReactElement {
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
    <tr id={`act-${event.orderId}`}>
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
      <td className="col-detail">
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
  );
}
