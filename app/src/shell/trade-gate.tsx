import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  money,
  reviewTicket,
  submitTicket,
  type TicketDraft,
  type TicketPreview,
  type TicketResult,
} from "../live/ticket";

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

function GateHead({ tone, children }: { readonly tone: string; readonly children: string }) {
  return (
    <div className={`gate-head gate-${tone}`}>
      <span className="gate-icon" aria-hidden="true" />
      {children}
    </div>
  );
}

function PreviewBody({ preview }: { readonly preview: TicketPreview }): ReactElement {
  return (
    <div className="gate-body">
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
      <p className="gate-note">
        Editing the ticket re-arms this gate, and the desk re-checks the live account at submit —
        approval never outlives the thing it approved.
      </p>
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

export function TradeGate({ deskId }: { readonly deskId: string }): ReactElement {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [state, setState] = useState<GateState>({ step: "draft" });
  const symId = useId();
  const qtyId = useId();
  const sideId = useId();

  const draft = (): TicketDraft => ({
    participantId: deskId,
    symbol: symbol.trim().toUpperCase(),
    quantity: Number(quantity),
    action,
  });

  /** Any edit disarms a standing review — straight back to draft. */
  const edit = <T,>(set: (v: T) => void) => {
    return (value: T) => {
      set(value);
      setState((s) => (s.step === "reviewed" || s.step === "done" ? { step: "draft" } : s));
    };
  };

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
        Paper account · market order · the gate reviews before anything is sent
      </p>
      <div className="gate-fields">
        <div className="field">
          <label htmlFor={symId}>Symbol</label>
          <input
            id={symId}
            value={symbol}
            placeholder="AAPL"
            maxLength={8}
            spellCheck={false}
            onChange={(e) => edit(setSymbol)(e.target.value)}
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
            value={quantity}
            placeholder="10"
            onChange={(e) => edit(setQuantity)(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={sideId}>Side</label>
          <select
            id={sideId}
            value={action}
            onChange={(e) => edit(setAction)(e.target.value as "buy" | "sell")}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
      </div>

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
          disabled={busy || symbol.trim() === "" || quantity === ""}
          onClick={review}
        >
          {state.step === "reviewing" ? "Reviewing…" : "Review order"}
        </button>
      )}
    </section>
  );
}
