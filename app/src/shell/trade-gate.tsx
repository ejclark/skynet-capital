import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  buildDraft,
  money,
  ORDER_TYPE_LABELS,
  orderTypeLabel,
  orderTypeNote,
  priceFieldFor,
  reviewTicket,
  submitTicket,
  type TicketFields,
  type TicketOrderType,
  type TicketPreview,
  type TicketResult,
} from "../live/ticket";
import { DisarmNote, GateHead } from "./gate-frame";

/**
 * THE PRE-TRADE GATE (#738 phase 2e) — the merge-box state machine on a real ticket.
 *
 *   draft → reviewing → reviewed(ok | refused) → submitting → done(accepted | refused)
 *
 * The one rule that makes it a gate and not a decoration: **approval never outlives the thing it
 * approved.** Any edit while reviewed disarms straight back to draft, and the server re-reviews
 * the LIVE account at submit regardless — a stale mark or a moved position dies there, not here.
 * Refusals are the server's own sentences, rendered verbatim; this component decides nothing.
 */

type GateState =
  | { readonly step: "draft" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: TicketPreview }
  | { readonly step: "submitting"; readonly preview: TicketPreview }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

/** What the member asked for, echoed back in the review — the order class by its unambiguous name
 *  and every price it carries, so "Stop-Market at $40" is never confused with a limit at $40. */
function OrderLine({ preview }: { readonly preview: TicketPreview }): ReactElement {
  const prices = [
    preview.stopPrice !== undefined ? `stop ${money(preview.stopPrice)}` : "",
    preview.limitPrice !== undefined ? `limit ${money(preview.limitPrice)}` : "",
  ].filter(Boolean);
  return (
    <p className="gate-row">
      {orderTypeLabel(preview.orderType)}
      {prices.length ? ` · ${prices.join(" · ")}` : ""}
    </p>
  );
}

function PreviewBody({ preview }: { readonly preview: TicketPreview }): ReactElement {
  return (
    <div className="gate-body">
      <OrderLine preview={preview} />
      {preview.refusals.map((refusal) => (
        <p key={refusal} className="gate-row gate-refusal">
          ✕ {refusal}
        </p>
      ))}
      {preview.warnings.map((warning) => (
        <p key={warning} className="gate-row gate-warning">
          ⚠ {warning}
        </p>
      ))}
      {preview.ok ? (
        <dl className="gate-est">
          <div>
            <dt>Est. price</dt>
            <dd className="num">{money(preview.estPrice)}</dd>
          </div>
          <div>
            <dt>Est. {preview.action === "buy" ? "cost" : "proceeds"}</dt>
            <dd className="num">{money(preview.estNotional)}</dd>
          </div>
          <div>
            <dt>Cash after</dt>
            <dd className="num">{money(preview.estCashAfter)}</dd>
          </div>
          {preview.positionAfter !== undefined ? (
            <div>
              <dt>Position after</dt>
              <dd className="num">{preview.positionAfter}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <DisarmNote />
    </div>
  );
}

function GateStatus({ state }: { readonly state: GateState }): ReactElement | null {
  if (state.step === "draft")
    return <GateHead tone="draft">Draft — nothing is sent until every check passes</GateHead>;
  if (state.step === "reviewing")
    return <GateHead tone="checks">Reviewing against the desk…</GateHead>;
  if (state.step === "reviewed" || state.step === "submitting")
    return (
      <>
        <GateHead tone={state.preview.ok ? "ready" : "refused"}>
          {state.preview.ok
            ? "All checks passed — ready to submit"
            : "Refused — the gate explains why"}
        </GateHead>
        <PreviewBody preview={state.preview} />
      </>
    );
  if (state.step === "error")
    return <GateHead tone="refused">{`The gate is unreachable — ${state.message}`}</GateHead>;
  if (state.result.ok)
    return (
      <>
        <GateHead tone="filled">{`Order ${state.result.orderId} ${state.result.status} — ${state.result.symbol}`}</GateHead>
        <div className="gate-body">
          <p className="gate-note">
            SIM account — simulated fill, real discipline. The blotter and timeline pick it up on
            the next read.
          </p>
        </div>
      </>
    );
  return (
    <>
      <GateHead tone="refused">The desk refused at submit</GateHead>
      <div className="gate-body">
        {state.result.refusals.map((refusal) => (
          <p key={refusal} className="gate-row gate-refusal">
            ✕ {refusal}
          </p>
        ))}
      </div>
    </>
  );
}

/** @category trading */
export function TradeGate({
  deskId,
  initialAction = "buy",
}: {
  readonly deskId: string;
  /** `?play=102` preselects Sell — the catalog's stock rungs are the same gate, sided. */
  readonly initialAction?: "buy" | "sell";
}): ReactElement {
  const [fields, setFields] = useState<TicketFields>({
    symbol: "",
    quantity: "",
    action: initialAction,
    orderType: "market",
    limitPrice: "",
    stopPrice: "",
  });
  const [state, setState] = useState<GateState>({ step: "draft" });
  const symId = useId();
  const qtyId = useId();
  const sideId = useId();
  const typeId = useId();
  const priceId = useId();

  const draft = () => buildDraft(deskId, fields);

  /** Any edit disarms a standing review — straight back to draft. Changing the order type counts:
   *  a review of a market order says nothing about the stop order that replaced it. */
  const edit =
    <K extends keyof TicketFields>(key: K) =>
    (value: TicketFields[K]) => {
      setFields((f) => ({ ...f, [key]: value }));
      setState((s) => (s.step === "reviewed" || s.step === "done" ? { step: "draft" } : s));
    };

  const priceField = priceFieldFor(fields.orderType);

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewTicket(draft());
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const submit = async (preview: TicketPreview) => {
    setState({ step: "submitting", preview });
    try {
      setState({ step: "done", result: await submitTicket(draft()) });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const busy = state.step === "reviewing" || state.step === "submitting";
  return (
    <section className="panel gate-panel" aria-label="New trade">
      <h2 className="panel-title">New trade</h2>
      <p className="panel-sub">
        Paper account · market, limit or stop · the gate reviews before anything is sent
      </p>
      <div className="gate-fields">
        <div className="field">
          <label htmlFor={symId}>Symbol</label>
          <input
            id={symId}
            value={fields.symbol}
            placeholder="AAPL"
            maxLength={8}
            spellCheck={false}
            onChange={(e) => edit("symbol")(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={qtyId}>Shares</label>
          <input
            id={qtyId}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={fields.quantity}
            placeholder="10"
            onChange={(e) => edit("quantity")(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={sideId}>Side</label>
          <select
            id={sideId}
            value={fields.action}
            onChange={(e) => edit("action")(e.target.value as "buy" | "sell")}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={typeId}>Order type</label>
          <select
            id={typeId}
            value={fields.orderType}
            onChange={(e) => edit("orderType")(e.target.value as TicketOrderType)}
          >
            {(Object.keys(ORDER_TYPE_LABELS) as TicketOrderType[]).map((type) => (
              <option key={type} value={type}>
                {ORDER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        {priceField !== undefined ? (
          <div className="field">
            <label htmlFor={priceId}>
              {priceField === "stopPrice" ? "Stop price" : "Limit price"}
            </label>
            <input
              id={priceId}
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={fields[priceField]}
              placeholder="40.00"
              onChange={(e) => edit(priceField)(e.target.value)}
            />
          </div>
        ) : null}
      </div>
      <p className="gate-note">{orderTypeNote(fields.orderType)}</p>

      <div className="gate" aria-live="polite">
        <GateStatus state={state} />
      </div>

      {state.step === "reviewed" && state.preview.ok ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => submit(state.preview)}
        >
          Submit order{state.preview.estNotional ? ` — ${money(state.preview.estNotional)}` : ""}
        </button>
      ) : state.step === "done" ? (
        <button type="button" className="btn" onClick={() => setState({ step: "draft" })}>
          Start another ticket
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || fields.symbol.trim() === "" || fields.quantity === ""}
          onClick={review}
        >
          {state.step === "reviewing" ? "Reviewing…" : "Review order"}
        </button>
      )}
    </section>
  );
}
