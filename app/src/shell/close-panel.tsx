import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskPosition } from "../live/desk";
import { type OptionPreview, reviewOption, submitOption } from "../live/options";
import { reviewTicket, submitTicket, type TicketPreview, type TicketResult } from "../live/ticket";

/* Moved unchanged from blotter-row.tsx (#5071), when a row's Close moved into its opened row. */

/** The qty unit label — "shares" for stock, "contracts" for options. */
const qtyUnit = (position: DeskPosition): string => (position.isOption ? "contracts" : "shares");

/** Parse the blotter's formatted quantity string to a number for the close draft. */
const parseQty = (position: DeskPosition): number => {
  const n = Number(position.quantity);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

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
 * server-side); stocks close via `reviewTicket`/`submitTicket` with `action: "sell"`. On a
 * successful fill, the desk + activity queries are invalidated so positions and the ledger
 * refresh without a manual page reload.
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
  const fullQty = parseQty(position);
  const [qty, setQty] = useState(position.quantity);
  const [state, setState] = useState<CloseState>({ step: "editing" });

  const closeQty = Math.min(Number(qty) || 0, fullQty);
  const isFull = closeQty >= fullQty;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["desk-activity", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-networth"] });
  };

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      if (position.isOption) {
        const { preview } = await reviewOption({
          kind: "close",
          participantId: deskId,
          occSymbol: position.symbol,
          ...(isFull ? {} : { contracts: closeQty }),
        });
        setState({ step: "reviewed", preview });
      } else {
        const { preview } = await reviewTicket({
          participantId: deskId,
          symbol: position.symbol,
          quantity: closeQty,
          action: "sell",
        });
        setState({ step: "reviewed", preview });
      }
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const confirm = async () => {
    setState({ step: "submitting" });
    try {
      if (position.isOption) {
        const result = await submitOption({
          kind: "close",
          participantId: deskId,
          occSymbol: position.symbol,
          ...(isFull ? {} : { contracts: closeQty }),
        });
        setState({ step: "done", result });
        if (result.ok) {
          refresh();
          onDone();
        }
      } else {
        const result = await submitTicket({
          participantId: deskId,
          symbol: position.symbol,
          quantity: closeQty,
          action: "sell",
        });
        setState({ step: "done", result });
        if (result.ok) {
          refresh();
          onDone();
        }
      }
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

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
            <span className="close-panel-unit">{qtyUnit(position)}</span>
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
                {position.isOption
                  ? `Close ${closeQty} ${qtyUnit(position)}`
                  : `Sell ${closeQty} ${qtyUnit(position)}`}
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
