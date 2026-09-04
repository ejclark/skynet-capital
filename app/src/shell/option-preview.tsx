import type { ReactElement } from "react";
import type { OptionPreview } from "../live/options";
import type { TicketResult } from "../live/ticket";
import { money } from "../live/ticket";
import { DisarmNote, GateHead } from "./gate-frame";

/**
 * The options gate's review rendering (#738 phase 10b) — the server's `OptionTicketPreview`
 * shown whole: refusals and warnings verbatim, then the payoff arithmetic every legacy surface
 * shows (premium, credit/debit, collateral or shares committed, max profit/loss, breakeven) —
 * including the honest worst case nobody likes saying out loud. Numbers are server-computed;
 * `money` formats for display only.
 */

export type OptionGateState =
  | { readonly step: "draft" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: OptionPreview }
  | { readonly step: "submitting"; readonly preview: OptionPreview }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

function Est({ label, value }: { readonly label: string; readonly value: string }): ReactElement {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

function PayoffGrid({ preview }: { readonly preview: OptionPreview }): ReactElement {
  const flow = preview.side === "sell" ? "Est. credit" : "Est. debit";
  return (
    <dl className="gate-est">
      <Est label="Premium /share" value={money(preview.estPremium)} />
      <Est label={flow} value={money(preview.estNotional)} />
      {preview.collateral !== undefined ? (
        <Est label="Cash set aside" value={money(preview.collateral)} />
      ) : null}
      {preview.sharesCommitted !== undefined ? (
        <Est label="Shares committed" value={String(preview.sharesCommitted)} />
      ) : null}
      <Est
        label="Max profit"
        value={preview.maxProfit === "uncapped" ? "Uncapped" : money(preview.maxProfit)}
      />
      <Est label="Max loss" value={money(preview.maxLoss)} />
      <Est label="Breakeven" value={money(preview.breakeven)} />
    </dl>
  );
}
/** The single-leg ticket's body: cost, max loss, breakeven, and the disarm note.
 *
 *  @category trading
 */
export function OptionPreviewBody({ preview }: { readonly preview: OptionPreview }): ReactElement {
  return (
    <div className="gate-body">
      {preview.occSymbol ? <p className="gate-row num tkt-occ">{preview.occSymbol}</p> : null}
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
      {preview.ok ? <PayoffGrid preview={preview} /> : null}
      <DisarmNote />
    </div>
  );
}

/** The gate's one action, keyed to its state: review, submit (priced), or start over.
 *
 *  @category trading
 */
export function GateAction({
  state,
  drafted,
  onReview,
  onSubmit,
  onReset,
}: {
  readonly state: OptionGateState;
  readonly drafted: boolean;
  readonly onReview: () => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}): ReactElement {
  const busy = state.step === "reviewing" || state.step === "submitting";
  if (state.step === "reviewed" && state.preview.ok) {
    return (
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onSubmit}>
        Submit order
        {state.preview.estNotional ? ` — ${money(state.preview.estNotional)}` : ""}
      </button>
    );
  }
  if (state.step === "done") {
    return (
      <button type="button" className="btn" onClick={onReset}>
        Start another ticket
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={busy || !drafted}
      onClick={onReview}
    >
      {state.step === "reviewing" ? "Reviewing…" : "Review order"}
    </button>
  );
}
/** The gate's status line — the current step rendered as a tone plus a headline.
 *
 *  @category trading
 */
export function OptionGateStatus({
  state,
}: {
  readonly state: OptionGateState;
}): ReactElement | null {
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
        <OptionPreviewBody preview={state.preview} />
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
