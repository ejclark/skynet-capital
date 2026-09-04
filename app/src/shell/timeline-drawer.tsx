import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { type DeskActivityEvent, fetchDeskActivity } from "../live/desk";

/**
 * The position timeline drawer (#738 phase 2d) — a right side sheet (elevation: sheet) opened
 * from a blotter row, showing that symbol's fill history from the durable activity ledger.
 * Esc or the scrim closes it and focus returns to the opener (the Dialog contract from the
 * pattern research). Two provenance seams ride the rows, and they answer different questions:
 * `backfilled` says the ledger recovered the row rather than watching it land; the `*` says the
 * order was placed straight in Alpaca and never touched our ticket (#782). Provenance is
 * recorded, not laundered — and where the evidence doesn't reach, nothing is marked.
 */

function EventLine({ event }: { readonly event: DeskActivityEvent }): ReactElement {
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

/** @category navigation */
export function TimelineDrawer({
  deskId,
  symbol,
  display,
  onClose,
}: {
  readonly deskId: string;
  readonly symbol: string;
  readonly display: string;
  readonly onClose: () => void;
}): ReactElement {
  const closeRef = useRef<HTMLButtonElement>(null);
  const activity = useQuery({
    queryKey: ["desk-activity", deskId],
    queryFn: () => fetchDeskActivity(deskId),
    staleTime: 30_000,
  });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const events = activity.data?.activity.filter((e) => e.symbol === symbol) ?? [];
  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the scrim mirrors Esc for pointer users; the dialog owns focus */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard path is the document-level Escape handler above */}
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${display} timeline`}>
        <header className="drawer-head">
          <h2>{display}</h2>
          <button
            ref={closeRef}
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="drawer-body">
          {activity.isPending ? <p className="note">Reading the ledger…</p> : null}
          {activity.isError ? <p className="note">The ledger is unreachable.</p> : null}
          {activity.data && !activity.data.available ? (
            <p className="note">No durable activity ledger is wired in this deployment.</p>
          ) : null}
          {activity.data?.available && events.length === 0 ? (
            <p className="note">No recorded orders for {display} in the ledger's window.</p>
          ) : null}
          {events.length > 0 ? (
            <ul className="tl">
              {events.map((event) => (
                <EventLine key={`${event.orderId}-${event.at}`} event={event} />
              ))}
            </ul>
          ) : null}
          {/* A bare glyph is a mystery; the key appears only when something carries it. */}
          {events.some((e) => e.origin === "alpaca-direct") ? (
            <p className="tl-legend">
              <span className="tl-direct" aria-hidden="true">
                *
              </span>{" "}
              Placed directly in Alpaca — this order skipped the app's ticket, so none of the desk's
              pre-trade checks saw it.
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
