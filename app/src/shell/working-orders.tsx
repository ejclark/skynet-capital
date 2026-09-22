import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { useDeskEvents } from "../live/desk-events";
import {
  cancelOrder,
  type DeskOrderRow,
  type DeskOrderState,
  fetchOrders,
  type OrderChange,
  type ReplaceResult,
  replaceOrder,
} from "../live/orders";
import { money, orderTypeLabel, tifLabel } from "../live/ticket";
import { ModifyForm } from "./working-order-modify";

/**
 * WORKING ORDERS (#3407 P1 slice 2) — the list a Limit or Stop order was missing: directly on the
 * Trade page under the ticket, where the order was placed (#674, the member's own ask, and the
 * study's cross-exam: the market leader buries pending orders a screen away). Reads the broker
 * through `/api/trade/orders` (Alpaca is the store of record; nothing is cached here beyond the
 * query), cancels through `/api/trade/cancel` and changes a limit or stop through
 * `/api/trade/replace` (P1 1b — the broker issues a new id; the row says "changed from").
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
  replaced: "↻",
  rejected: "✕",
  expired: "⌛",
};

const STATE_WORD: Record<DeskOrderState, string> = {
  working: "Working",
  partial: "Partly filled",
  filled: "Filled",
  cancelled: "Cancelled",
  replaced: "Replaced",
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

/** The row's actions: Cancel (two taps — the button becomes its own confirm), and Modify on a
 *  working limit or stop, which opens the change drawer under the row (P1 1b). */
function RowActions({
  row,
  onCancel,
  pending,
  modifying,
  setModifying,
}: {
  readonly row: DeskOrderRow;
  readonly onCancel: (id: string) => Promise<void>;
  readonly pending: boolean;
  readonly modifying: boolean;
  readonly setModifying: (open: boolean) => void;
}): ReactElement {
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
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
    );
  }
  return (
    <span className="wo-actions">
      {row.replaceable ? (
        <button
          type="button"
          className="btn wo-btn"
          aria-expanded={modifying}
          onClick={() => setModifying(!modifying)}
        >
          Modify
        </button>
      ) : null}
      <button type="button" className="btn wo-btn" onClick={() => setArmed(true)}>
        Cancel
      </button>
    </span>
  );
}

function OrderRow({
  row,
  onCancel,
  onReplace,
  pending,
}: {
  readonly row: DeskOrderRow;
  readonly onCancel?: (id: string) => Promise<void>;
  readonly onReplace?: (id: string, change: OrderChange) => Promise<ReplaceResult | undefined>;
  readonly pending: boolean;
}): ReactElement {
  const [modifying, setModifying] = useState(false);
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
        {/* The lineage in words: a changed order is that order, not a stranger. */}
        {row.replaces ? ` · changed from ${row.replaces}` : ""}
        {row.state === "replaced" && row.replacedBy ? ` · now ${row.replacedBy}` : ""}
      </span>
      {row.cancelable && onCancel ? (
        <RowActions
          row={row}
          onCancel={onCancel}
          pending={pending}
          modifying={modifying}
          setModifying={setModifying}
        />
      ) : null}
      {modifying && onReplace ? (
        <ModifyForm
          row={row}
          busy={pending}
          onSend={async (change) => {
            const result = await onReplace(row.id, change);
            if (result?.ok) setModifying(false);
            return result;
          }}
          onClose={() => setModifying(false)}
        />
      ) : null}
    </li>
  );
}

/** The poll that stands in when the event stream is absent or between reconnects. */
export const FALLBACK_POLL_MS = 60_000;

/** @category trading */
export function WorkingOrders({ deskId }: { readonly deskId: string }): ReactElement | null {
  const queryClient = useQueryClient();
  // The desk's own event stream re-reads this list the moment the bus sees a fill or a cancel
  // (#3407 P4 slice 1); the poll below is the fallback for a deployment with no bus wired.
  useDeskEvents(deskId);
  const query = useQuery({
    queryKey: ["desk-orders", deskId],
    queryFn: () => fetchOrders(deskId),
    enabled: deskId !== "",
    staleTime: 10_000,
    // A working order changes state on the broker's clock, not the member's: poll while any is
    // live, rest when none are — slowly, since the stream carries the fast path.
    refetchInterval: (q) =>
      q.state.data?.available && q.state.data.working.length > 0 ? FALLBACK_POLL_MS : false,
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

  const onReplace = async (id: string, change: OrderChange) => {
    setPendingId(id);
    setNotice(undefined);
    try {
      const result = await replaceOrder(deskId, id, change);
      setNotice(
        result.ok
          ? `Change sent — the broker replaced ${result.replaces} with ${result.orderId} (${result.status.replace(/_/g, " ")}).`
          : result.refusals.join(" "),
      );
      return result;
    } catch (error) {
      setNotice(`Couldn't reach the gate — ${String(error)}`);
      return undefined;
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
                  onReplace={onReplace}
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
