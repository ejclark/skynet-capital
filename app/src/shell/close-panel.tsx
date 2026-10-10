import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { DeskPosition } from "../live/desk";
import { type OptionDraft, type OptionPreview, reviewOption, submitOption } from "../live/options";
import { held, parseQuantity } from "../live/quantity";
import {
  reviewTicket,
  submitTicket,
  type TicketDraft,
  type TicketPreview,
  type TicketResult,
} from "../live/ticket";
import { plural } from "./position-row-spec";

/* Moved from blotter-row.tsx (#5071), when a row's Close moved into its opened row. */

/** The qty unit label — "shares" for stock, "contracts" for options; singular for a count of one. */
const qtyUnit = (position: DeskPosition, count?: number): string =>
  `${position.isOption ? "contract" : "share"}${count === 1 ? "" : "s"}`;

/**
 * Why Close is off, in words; undefined when the position can close here (#5086). Short stock
 * closes by BUYING the shares back (a buy to cover), and this panel's share path only sells what
 * is held (`order-ticket.ts` refuses a sell past the holding, and no buy-to-cover order is built),
 * so Close stays off and says why rather than offer a sell that would add to the short. A sold
 * OPTION is not this case: its close resolves to a buy-to-close on the server
 * (`previewOptionClose`), so it closes like any other.
 */
export function closeRefusal(position: DeskPosition): string | undefined {
  const { count, short } = held(position.quantity);
  if (position.isOption || !short) return undefined;
  return `Close is off: you're short ${plural(count, "share")}, so closing means buying them back (a buy to cover), which this desk doesn't place yet. A sell would add to the short.`;
}

/** The confirm step's side and size in words, from the server's own preview — what it will send. */
function closeWords(preview: TicketPreview | OptionPreview): string {
  if ("positionIntent" in preview) {
    const side =
      preview.positionIntent === "buy_to_close"
        ? "Buy to close"
        : preview.positionIntent === "sell_to_close"
          ? "Sell to close"
          : preview.side === "buy"
            ? "Buy"
            : "Sell";
    return `${side} ${plural(preview.contracts, "contract")}`;
  }
  return `${preview.action === "buy" ? "Buy" : "Sell"} ${plural(preview.quantity, "share")}`;
}

type CloseState =
  | { readonly step: "editing" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: TicketPreview | OptionPreview }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

/**
 * The inline close panel — qty input → review → confirm, same review-then-confirm discipline as
 * every order on this desk. Options close via `reviewOption`/`submitOption` (direction resolved
 * server-side, and always the count named, so one buy of a larger position never reads as "close
 * everything held"); stocks close via `reviewTicket`/`submitTicket` with `action: "sell"`, and a
 * short stock not at all (`closeRefusal`). The confirm step says the side and the count the
 * server previewed. On a successful fill, the desk + activity queries are invalidated so positions
 * and the ledger refresh without a manual page reload.
 */
export function ClosePanel({
  deskId,
  position,
  onDone,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly onDone: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const whyId = useId();
  const refusal = closeRefusal(position);
  // The count held, whichever side: a sold put's "-1" closes one contract (#5086).
  const fullQty = refusal ? 0 : held(position.quantity).count;
  const [qty, setQty] = useState(fullQty > 0 ? String(fullQty) : "");
  const [state, setState] = useState<CloseState>({ step: "editing" });

  const typed = parseQuantity(qty);
  const closeQty = Math.min(Number.isFinite(typed) ? typed : 0, fullQty);
  const isFull = closeQty >= fullQty;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["desk-activity", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-networth"] });
  };

  // One draft for both steps, so Confirm sends exactly what was reviewed. An option close always
  // names its count: left off, the server reads "close everything held", which is wrong for one
  // buy of a larger position.
  const optionDraft: OptionDraft = {
    kind: "close",
    participantId: deskId,
    occSymbol: position.symbol,
    contracts: closeQty,
  };
  const ticketDraft: TicketDraft = {
    participantId: deskId,
    symbol: position.symbol,
    quantity: closeQty,
    action: "sell",
  };

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      const { preview } = position.isOption
        ? await reviewOption(optionDraft)
        : await reviewTicket(ticketDraft);
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const confirm = async () => {
    setState({ step: "submitting" });
    try {
      const result = position.isOption
        ? await submitOption(optionDraft)
        : await submitTicket(ticketDraft);
      setState({ step: "done", result });
      if (result.ok) {
        refresh();
        onDone();
      }
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  if (refusal) {
    return (
      <div className="close-panel">
        <div className="close-panel-form">
          <button type="button" className="btn mc-btn" disabled aria-describedby={whyId}>
            Close
          </button>
        </div>
        <p id={whyId} className="lot-why">
          {refusal}
        </p>
      </div>
    );
  }

  return (
    <div className="close-panel">
      <div className="close-panel-head">
        <span className="close-panel-sym">{position.display}</span>
        <span className={`close-panel-unrealized num tone-${position.totalTone}`}>
          {position.totalPl} total P/L
        </span>
      </div>
      {state.step === "editing" || state.step === "error" ? (
        <div className="close-panel-form">
          <label className="close-panel-qty">
            <span className="visually-hidden">{qtyUnit(position)} to close</span>
            <input
              type="number"
              min={1}
              max={fullQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <span className="close-panel-unit">{qtyUnit(position, typed)}</span>
          </label>
          <button
            type="button"
            className="btn mc-btn"
            disabled={closeQty < 1 || closeQty > fullQty}
            onClick={() => void review()}
          >
            {isFull ? "Close all" : `Close ${closeQty}`}
          </button>
        </div>
      ) : null}
      {state.step === "reviewing" ? <span className="tkt-close-note">reviewing…</span> : null}
      {state.step === "reviewed" ? (
        <div className="close-panel-confirm">
          {state.preview.ok ? (
            <>
              <span className="tkt-close-note">
                {closeWords(state.preview)}
                {state.preview.estNotional !== undefined
                  ? ` · est $${state.preview.estNotional.toLocaleString("en-US")}`
                  : ""}
              </span>
              <button
                type="button"
                className="btn btn-primary mc-btn"
                onClick={() => void confirm()}
              >
                Confirm
              </button>
            </>
          ) : (
            <span className="tkt-close-note gate-refusal">✕ {state.preview.refusals[0]}</span>
          )}
        </div>
      ) : null}
      {state.step === "submitting" ? <span className="tkt-close-note">closing…</span> : null}
      {state.step === "done" ? (
        state.result.ok ? (
          <span className="tkt-close-note gate-ok">
            order {state.result.orderId} {state.result.status}
          </span>
        ) : (
          <span className="tkt-close-note gate-refusal">✕ {state.result.refusals[0]}</span>
        )
      ) : null}
      {state.step === "error" ? (
        <span className="tkt-close-note gate-refusal">{state.message}</span>
      ) : null}
    </div>
  );
}
