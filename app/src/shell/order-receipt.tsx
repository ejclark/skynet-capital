import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { useRef, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { useOrderFill } from "../live/desk-events";
import { manageSearch } from "../live/manage-handoff";
import { marketSession } from "../live/market-session";
import {
  followRow,
  isLive,
  orderWords,
  readReceipt,
  receiptHeadline,
  receiptNote,
  receiptTone,
  type SentOrder,
} from "../live/order-receipt";
import type { DeskOrderRow, OrderChange } from "../live/orders";
import { useFillFlare } from "./fill-flare";
import { GateHead } from "./gate-frame";
import { useNow } from "./market-session";
import { ModifyForm } from "./working-order-modify";
import { deskOrdersQuery, FALLBACK_POLL_MS, RowActions, useOrderActions } from "./working-orders";

/** How often the receipt asks for its order until the broker lists it — a moment, not a minute. */
const LISTING_POLL_MS = 5_000;

/**
 * THE TICKET BECOMES ITS RECEIPT (Eric, 2026-11-06: "After completing execution of a trade, it's
 * highly confusing that the trade form entries persist; it sends signals that the trade didn't
 * execute" — and an unfilled order should be one you "click into … to modify or cancel", a filled
 * one should offer "a way to roll or close"). A sent order replaces the ticket's entry fields with
 * this card, so the screen can't be read as an unsent form:
 *  - the headline says where the order stands in words — placed, partly filled, filled, cancelled —
 *    never a UUID or the broker's raw status (`live/order-receipt.ts` owns every sentence);
 *  - the order in words under it: the contract as a person reads it, then side · size · price · TIF;
 *  - while it is live, the Orders pane's own Modify and Cancel (`RowActions`, `ModifyForm`) act on it
 *    here — the same two-tap cancel, the same change drawer, following a modify's new id;
 *  - once it fills, the next step: an option opens its Close / Roll row on the Orders pane (the
 *    #3729 hand-off), bought shares open the Sell ticket;
 *  - "New ticket" clears the form for the next order; the page's symbol and expiration stay.
 * A refusal at submit never reaches this card — the form stays, so the member can fix what the
 * gate named.
 * @category trading
 */
export function OrderReceipt({
  deskId,
  order,
  onNewTicket,
  children,
}: {
  readonly deskId: string;
  readonly order: SentOrder;
  readonly onNewTicket: () => void;
  /** A ticket's own extra receipt line (the option ticket's exit plan). */
  readonly children?: ReactNode;
}): ReactElement {
  /** The order now — a modify answers with a new id and new terms, and the card follows both. */
  const [now, setNow] = useState(order);
  const nowId = useRef(now.orderId);
  nowId.current = now.orderId;
  const orders = useQuery({
    ...deskOrdersQuery(deskId),
    // Its own poll, not the pane's (which rests when no OTHER order is working): every few
    // seconds until the broker lists this order, slowly while it is live, never once it ends —
    // the stream re-reads it at once where a bus is wired.
    refetchInterval: (q) => {
      if (q.state.data?.available === false) return false;
      const listed = followRow(q.state.data, nowId.current);
      if (!listed) return LISTING_POLL_MS;
      return isLive(listed.state) ? FALLBACK_POLL_MS : false;
    },
  });
  const row = followRow(orders.data, now.orderId);
  const fill = useOrderFill(deskId, row?.id ?? now.orderId);
  useFillFlare(fill);
  const market = marketSession(useNow());
  const { pendingId, notice, cancel, replace } = useOrderActions(deskId);
  /** The gate took the member's cancel; until the broker confirms it the card says so, and offers
   *  no second cancel. */
  const [cancelSent, setCancelSent] = useState(false);
  const read = readReceipt({
    orderId: now.orderId,
    quantity: row?.quantity ?? now.quantity,
    // The submit's echo speaks for the order it answered, never for a modify's successor.
    ...(now.orderId === order.orderId ? { echo: order.status } : {}),
    ...(row ? { row } : {}),
    ...(fill ? { fill } : {}),
    cancelSent,
  });
  const quantity = row?.quantity ?? now.quantity;
  const words = orderWords(now, row ?? now);
  const [modifying, setModifying] = useState(false);

  const onCancel = async (id: string) => {
    const answer = await cancel(id);
    if (answer?.ok) setCancelSent(true);
  };
  // The drawer closes and the card follows the broker's new id and the changed terms on success;
  // a refusal keeps the drawer open with the server's sentence in the notice.
  const onChange = (live: DeskOrderRow) => async (change: OrderChange) => {
    const answer = await replace(live.id, change);
    if (answer?.ok) {
      setNow((sent) => ({ ...sent, ...change, orderId: answer.orderId }));
      setModifying(false);
    }
    return answer;
  };
  const listedNote =
    orders.data?.available === false
      ? orders.data.reason === "unlinked"
        ? "Modify and Cancel work through your own connected account, and this session isn't linked to one."
        : "Couldn't reach the broker's order list just now — Modify and Cancel come back when it answers."
      : "Modify and Cancel appear here once the broker lists the order.";

  const underlying = parseOccSymbol(order.symbol)?.underlying ?? order.symbol;
  return (
    <section className="receipt" aria-label="Order receipt">
      <div className="gate receipt-card" aria-live="polite">
        <GateHead tone={receiptTone(read.state)}>
          {receiptHeadline(read, quantity, order.unit)}
        </GateHead>
        <div className="gate-body">
          <p className="receipt-what">{words.instrument}</p>
          <p className="receipt-terms">{words.terms}</p>
          <p className="gate-note">{receiptNote(read, market)}</p>
          {children}
          <p className="receipt-ref">
            Order ref <span className="num">{now.orderId.slice(0, 8)}</span>
          </p>
        </div>
      </div>
      {isLive(read.state) ? (
        row?.cancelable ? (
          <div className="receipt-act">
            <RowActions
              row={row}
              onCancel={onCancel}
              pending={pendingId === row.id}
              modifying={modifying}
              setModifying={setModifying}
              cancelLabel="Cancel order"
            />
            {modifying ? (
              <ModifyForm
                row={row}
                busy={pendingId === row.id}
                onSend={onChange(row)}
                onClose={() => setModifying(false)}
              />
            ) : null}
          </div>
        ) : (
          <p className="tkt-note">{listedNote}</p>
        )
      ) : null}
      {read.state === "filled" ? (
        <NextStep deskId={deskId} order={order} underlying={underlying} />
      ) : null}
      <p className="wo-notice" aria-live="polite">
        {notice}
      </p>
      <button type="button" className="btn btn-primary" onClick={onNewTicket}>
        New ticket
      </button>
      <p className="receipt-links">
        <Link to="/trade" search={{ desk: deskId, symbol: underlying, section: "orders" }}>
          All your orders and positions →
        </Link>
      </p>
    </section>
  );
}

/** A filled order's next step: an option opens its Close / Roll row (the #3729 hand-off, the
 *  contract marked on the Orders pane); bought shares open the Sell ticket on the same symbol. A
 *  share sale is already the way out, so it offers none. */
function NextStep({
  deskId,
  order,
  underlying,
}: {
  readonly deskId: string;
  readonly order: SentOrder;
  readonly underlying: string;
}): ReactElement | null {
  if (order.unit === "contracts") {
    const search = manageSearch<{ desk: string; symbol: string; section?: string }>(
      { desk: deskId, symbol: underlying },
      { occ: order.symbol },
    );
    return (
      <Link to="/trade" search={search} className="btn receipt-next">
        Close or roll this position →
      </Link>
    );
  }
  if (order.side !== "buy") return null;
  return (
    <Link
      to="/trade"
      search={{ desk: deskId, symbol: order.symbol, play: "102" }}
      className="btn receipt-next"
    >
      Sell these shares →
    </Link>
  );
}
