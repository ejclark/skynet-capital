import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskOrderRow, OrderChange, ReplaceResult } from "../live/orders";
import { TIF_LABELS, type TicketTimeInForce } from "../live/ticket";

/**
 * MODIFY A WORKING ORDER (#3407 P1 1b; the study's rows 1–2 — Fidelity's "Change order =
 * attempt to cancel and replace", thinkorswim's Replacing / Replaced, Robinhood's replace of a
 * limit or stop, same type). The row's Modify button opens this drawer pre-filled with the
 * order as it stands; the member changes shares, the price or the time in force, and "Send
 * change" posts ONLY the fields that differ — the broker cancels the old id and answers with a
 * new one, and the row re-reads under that id (`replaces` on the new row carries the lineage).
 *
 * Honesty rules: the type never changes here (a market order or a different type is a new
 * order, which the ticket already handles); an unchanged form cannot be sent; the outcome is the
 * server's sentence, verbatim, and "replaced" is the broker's word for the old row, never ours.
 * @category trading
 */

/** Parse a typed number; "" and non-numbers are "no change", ≤ 0 is a refusal the form shows. */
function parseField(text: string): number | undefined | null {
  if (text.trim() === "") return undefined;
  const value = Number(text);
  if (!Number.isFinite(value)) return undefined;
  return value > 0 ? value : null;
}

/** The change a form holds against the row it started from — only what differs. */
export function orderChange(
  row: DeskOrderRow,
  form: { quantity: string; price: string; timeInForce: TicketTimeInForce | undefined },
): { change: OrderChange; refusal?: string } {
  const quantity = parseField(form.quantity);
  const price = parseField(form.price);
  if (quantity === null || (quantity !== undefined && !Number.isInteger(quantity))) {
    return { change: {}, refusal: "Shares must be a positive whole number." };
  }
  if (price === null) return { change: {}, refusal: "The price must be above $0." };
  const priceKey =
    row.stopPrice !== undefined && row.limitPrice === undefined ? "stopPrice" : "limitPrice";
  const current = priceKey === "stopPrice" ? row.stopPrice : row.limitPrice;
  return {
    change: {
      ...(quantity !== undefined && quantity !== row.quantity ? { quantity } : {}),
      ...(price !== undefined && price !== current ? { [priceKey]: price } : {}),
      ...(form.timeInForce !== undefined && form.timeInForce !== row.timeInForce
        ? { timeInForce: form.timeInForce }
        : {}),
    },
  };
}

export function ModifyForm({
  row,
  busy,
  onSend,
  onClose,
}: {
  readonly row: DeskOrderRow;
  readonly busy: boolean;
  readonly onSend: (change: OrderChange) => Promise<ReplaceResult | undefined>;
  readonly onClose: () => void;
}): ReactElement {
  const isStop = row.stopPrice !== undefined && row.limitPrice === undefined;
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [price, setPrice] = useState(String(isStop ? row.stopPrice : (row.limitPrice ?? "")));
  const [timeInForce, setTimeInForce] = useState<TicketTimeInForce | undefined>(
    row.timeInForce === "gtc" || row.timeInForce === "day" ? row.timeInForce : undefined,
  );
  const [refusal, setRefusal] = useState<string | undefined>();
  const { change, refusal: shapeRefusal } = orderChange(row, { quantity, price, timeInForce });
  const unchanged = Object.keys(change).length === 0;
  const send = async () => {
    if (shapeRefusal) {
      setRefusal(shapeRefusal);
      return;
    }
    setRefusal(undefined);
    await onSend(change);
  };
  const qtyId = `wo-mod-qty-${row.id}`;
  const priceId = `wo-mod-price-${row.id}`;
  return (
    <div className="wo-modify" data-order={row.id}>
      <div className="wo-modify-fields">
        <label htmlFor={qtyId}>
          Shares
          <input
            id={qtyId}
            className="num"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={quantity}
            disabled={busy}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label htmlFor={priceId}>
          {isStop ? "Stop price" : "Limit price"}
          <input
            id={priceId}
            className="num"
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={price}
            disabled={busy}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
        <fieldset className="wo-modify-tif">
          <legend>Time in force</legend>
          <div className="toggle-group">
            {(Object.keys(TIF_LABELS) as TicketTimeInForce[]).map((tif) => (
              <button
                key={tif}
                type="button"
                aria-pressed={(timeInForce ?? row.timeInForce) === tif}
                disabled={busy}
                onClick={() => setTimeInForce(tif)}
              >
                {TIF_LABELS[tif]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="wo-modify-note">
        {shapeRefusal ??
          refusal ??
          (unchanged ? "Change shares, the price or the time in force." : changeLine(change))}
      </p>
      <span className="wo-actions">
        <button
          type="button"
          className="btn btn-primary wo-btn"
          disabled={busy || unchanged || shapeRefusal !== undefined}
          onClick={send}
        >
          {busy ? "Sending change…" : "Send change"}
        </button>
        <button type="button" className="btn wo-btn" disabled={busy} onClick={onClose}>
          Keep as is
        </button>
      </span>
    </div>
  );
}

/** "Will send: 8 shares · limit $172.00 · GTC" — what the broker is about to be told. */
export function changeLine(change: OrderChange): string {
  const parts = [
    change.quantity !== undefined ? `${change.quantity} shares` : undefined,
    change.limitPrice !== undefined ? `limit $${change.limitPrice.toFixed(2)}` : undefined,
    change.stopPrice !== undefined ? `stop $${change.stopPrice.toFixed(2)}` : undefined,
    change.timeInForce !== undefined ? TIF_LABELS[change.timeInForce] : undefined,
  ].filter((part): part is string => part !== undefined);
  return `Will send: ${parts.join(" · ")}`;
}
