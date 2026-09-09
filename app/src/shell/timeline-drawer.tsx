import type { ReactElement } from "react";
import type { DeskActivityEvent } from "../live/desk";

/**
 * One fill/order event on a desk's activity timeline (#738 phase 2d). Rendered inline inside a
 * blotter row's accordion now (`blotter-row.tsx`, #2321) — the right-rail drawer this component
 * used to render into was retired: Eric's live-review complaint was that the popup read as too
 * far removed from the row that opened it, and an inline row keeps the reader in flow. Two
 * provenance seams ride the rows, and they answer different questions: `backfilled` says the
 * ledger recovered the row rather than watching it land; the `*` says the order was placed
 * straight in Alpaca and never touched our ticket (#782). Provenance is recorded, not laundered —
 * and where the evidence doesn't reach, nothing is marked.
 */

export function EventLine({ event }: { readonly event: DeskActivityEvent }): ReactElement {
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
    <li className="tl-event">
      <span className={`tl-side tl-${event.side}`}>{event.side.toUpperCase()}</span>
      <span>
        {event.filled > 0 && event.filled !== event.quantity
          ? `${event.filled}/${event.quantity}`
          : event.quantity}{" "}
        @ <span className="num">{event.price}</span>
      </span>
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
      <span className="tl-when num">{stamp}</span>
    </li>
  );
}
