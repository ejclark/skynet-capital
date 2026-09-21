import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { cancelOrder, type DeskOrderRow, type DeskOrderState, fetchOrders } from "../live/orders";
import { money, orderTypeLabel, tifLabel } from "../live/ticket";

/**
 * WORKING ORDERS (#3407 P1 slice 2) — the list a Limit or Stop order was missing: directly on the
 * Trade page under the ticket, where the order was placed (#674, the member's own ask, and the
 * study's cross-exam: the market leader buries pending orders a screen away). Reads the broker
 * through `/api/trade/orders` (Alpaca is the store of record; nothing is cached here beyond the
 * query) and cancels through `/api/trade/cancel`.
 *
 * Honesty rules, in order: an unlinked or unreachable broker says so (never an empty list that
 * reads as "nothing working"); every state is a WORD plus a glyph, never a hue alone (a standing
 * reader is red/green colourblind); a cancel is two taps — the button becomes its own confirm —
 * because a working order is capital at risk and the desk's no-one-tap doctrine covers leaving a
 * position as much as entering one; a refusal is the server's sentence, verbatim.
 *
 * Where this section LIVES is still the open #674 fork on the plan issue (the lo-fi shapes put it
 * under the ticket, in a rail, or on a ledger page); this placement executes the standing #674
 * decision and moves when the pick lands — the component itself is shape-independent.
 * @category trading
 */

const STATE_GLYPH: Record<DeskOrderState, string> = {
  working: "◷",
  partial: "◐",
  filled: "●",
  cancelled: "⊘",
  rejected: "✕",
  expired: "⌛",
};

const STATE_WORD: Record<DeskOrderState, string> = {
  working: "Working",
  partial: "Partly filled",
  filled: "Filled",
  cancelled: "Cancelled",
  rejected: "Rejected",
  expired: "Expired",
};

function priceLabel(row: DeskOrderRow): string {
  if (row.limitPrice !== undefined) return `limit ${money(row.limitPrice)}`;
  if (row.stopPrice !== undefined) return `stop ${money(row.stopPrice)}`;
  return "market";
}

function qtyLabel(row: DeskOrderRow): string {
  return row.state === "partial" || (row.filledQuantity > 0 && row.filledQuantity < row.quantity)
    ? `${row.filledQuantity} of ${row.quantity}`
    : String(row.quantity);
}

function OrderRow({
  row,
  onCancel,
  pending,
}: {
  readonly row: DeskOrderRow;
  readonly onCancel?: (id: string) => Promise<void>;
  readonly pending: boolean;
}): ReactElement {
  const [armed, setArmed] = useState(false);
  const tif = tifLabel(row.timeInForce);
  return (
    <li className={`wo-row wo-${row.state}`}>
      <span className="wo-main">
        <span className="wo-sym">{row.symbol}</span>
        <span className="wo-side">{row.side === "buy" ? "Buy" : "Sell"}</span>
        <span className="wo-qty num">{qtyLabel(row)}</span>
        <span className="wo-type">
          {orderTypeLabel(row.orderType)} · {priceLabel(row)}
          {tif ? ` · ${tif}` : ""}
        </span>
      </span>
      <span className="wo-state">
        <span aria-hidden="true">{STATE_GLYPH[row.state]}</span> {STATE_WORD[row.state]}
        {row.state === "filled" && row.avgFillPrice !== undefined
          ? ` · ${money(row.avgFillPrice)}`
          : ""}
      </span>
      {row.cancelable && onCancel ? (
        armed ? (
          <span className="wo-actions">
            <button
              type="button"
              className="btn wo-btn wo-confirm"
              disabled={pending}
              onClick={() => onCancel(row.id)}
            >
              {pending ? "Cancelling…" : "Confirm cancel"}
            </button>
            <button
              type="button"
              className="btn wo-btn"
              disabled={pending}
              onClick={() => setArmed(false)}
            >
              Keep
            </button>
          </span>
        ) : (
          <button type="button" className="btn wo-btn" onClick={() => setArmed(true)}>
            Cancel
          </button>
        )
      ) : null}
    </li>
  );
}

/** @category trading */
export function WorkingOrders({ deskId }: { readonly deskId: string }): ReactElement | null {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["desk-orders", deskId],
    queryFn: () => fetchOrders(deskId),
    enabled: deskId !== "",
    staleTime: 10_000,
    // A working order changes state on the broker's clock, not the member's: poll while any is
    // live, rest when none are.
    refetchInterval: (q) =>
      q.state.data?.available && q.state.data.working.length > 0 ? 15_000 : false,
  });
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  if (deskId === "" || !query.data) return null;

  const onCancel = async (id: string) => {
    setPendingId(id);
    setNotice(undefined);
    try {
      const result = await cancelOrder(deskId, id);
      setNotice(result.ok ? "Cancel sent to the broker." : result.refusals.join(" "));
    } catch (error) {
      setNotice(`Couldn't reach the gate — ${String(error)}`);
    } finally {
      setPendingId(undefined);
      await queryClient.invalidateQueries({ queryKey: ["desk-orders", deskId] });
    }
  };

  const data = query.data;
  return (
    <section className="wr-panel wo-panel" aria-label="Working orders">
      <h3 className="wr-h">Working orders</h3>
      {!data.available ? (
        <p className="tkt-note">
          {data.reason === "unlinked"
            ? "Working orders load through your own connected account, and this session isn't linked to one yet."
            : "Couldn't reach the broker for your working orders just now — the ticket still works; try again shortly."}
        </p>
      ) : (
        <>
          {data.working.length === 0 ? (
            <p className="tkt-note">
              No working orders — a limit or stop order you place shows here.
            </p>
          ) : (
            <ul className="wr-list">
              {data.working.map((row) => (
                <OrderRow
                  key={row.id}
                  row={row}
                  onCancel={onCancel}
                  pending={pendingId === row.id}
                />
              ))}
            </ul>
          )}
          {data.recent.length > 0 ? (
            <>
              <h4 className="wo-sub">Settled today</h4>
              <ul className="wr-list wo-recent">
                {data.recent.map((row) => (
                  <OrderRow key={row.id} row={row} pending={false} />
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
      <p className="wo-notice" aria-live="polite">
        {notice}
      </p>
    </section>
  );
}
