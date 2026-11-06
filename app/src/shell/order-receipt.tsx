import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
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
import { cancelOrder, type DeskOrderRow, type OrderChange, replaceOrder } from "../live/orders";
import { useFillFlare } from "./fill-flare";
import { GateHead } from "./gate-frame";
import { useNow } from "./market-session";
import { ModifyForm } from "./working-order-modify";
import { deskOrdersQuery, RowActions } from "./working-orders";

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
  const queryClient = useQueryClient();
  /** The order's id now — a modify answers with a new one, and the card follows it. */
  const [orderId, setOrderId] = useState(order.orderId);
  const orders = useQuery(deskOrdersQuery(deskId));
  const row = followRow(orders.data, orderId);
  const fill = useOrderFill(deskId, row?.id ?? orderId);
  useFillFlare(fill);
  const market = marketSession(useNow());
  const read = readReceipt({ ...order, orderId }, row, fill);
  const quantity = row?.quantity ?? order.quantity;
  const words = orderWords(order, row ?? order);
  const [pending, setPending] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();

  const settle = async (send: () => Promise<string>) => {
    setPending(true);
    setNotice(undefined);
    try {
      setNotice(await send());
    } catch (error) {
      setNotice(`Couldn't reach the gate — ${String(error)}`);
    } finally {
      setPending(false);
      await queryClient.invalidateQueries({ queryKey: ["desk-orders", deskId] });
    }
  };
  const onCancel = (id: string) =>
    settle(async () => {
      const result = await cancelOrder(deskId, id);
      return result.ok ? "Cancel sent to the broker." : result.refusals.join(" ");
    });
  // The drawer closes and the card follows the broker's new id on success; a refusal keeps the
  // drawer open with the server's sentence in the notice.
  const onChange = (live: DeskOrderRow) => (change: OrderChange) =>
    settle(async () => {
      const result = await replaceOrder(deskId, live.id, change);
      if (!result.ok) return result.refusals.join(" ");
      setOrderId(result.orderId);
      setModifying(false);
      return "Change sent — the broker swaps in the changed order.";
    }).then(() => undefined);

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
            Order ref <span className="num">{orderId.slice(0, 8)}</span>
          </p>
        </div>
      </div>
      {isLive(read.state) ? (
        row?.cancelable ? (
          <div className="receipt-act">
            <RowActions
              row={row}
              onCancel={onCancel}
              pending={pending}
              modifying={modifying}
              setModifying={setModifying}
              cancelLabel="Cancel order"
            />
            {modifying ? (
              <ModifyForm
                row={row}
                busy={pending}
                onSend={onChange(row)}
                onClose={() => setModifying(false)}
              />
            ) : null}
          </div>
        ) : (
          <p className="tkt-note">Modify and Cancel appear here once the broker lists the order.</p>
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
