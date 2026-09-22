import type { ReactElement } from "react";
import type { OptionPreview } from "../live/options";
import { daysToExpiry, expiresIn } from "../live/straddle";
import type { TicketResult } from "../live/ticket";
import { money, orderTypeLabel, tifLabel } from "../live/ticket";
import { DisarmNote, GateHead, keepFocus } from "./gate-frame";

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
      {/* Chance of profit never renders without expected value beside it (#3407 P2; the study's
          ledger #20): 72%-to-win-$1 next to 28%-to-lose-$5 is the legible pair, POP alone is the
          casino's number. Both absent when the solver had no honest input. */}
      {preview.chanceOfProfit !== undefined && preview.expectedValue !== undefined ? (
        <>
          <Est label="Chance of profit" value={percent(preview.chanceOfProfit)} />
          <Est label="Expected value" value={signedMoney(preview.expectedValue)} />
        </>
      ) : null}
      {preview.impliedVol !== undefined ? (
        <Est label="Implied vol" value={percent(preview.impliedVol)} />
      ) : null}
    </dl>
  );
}

/** "72%" — one decimal only when it changes the read (a 0.4% chance is not 0%). */
export function percent(fraction: number): string {
  const pct = fraction * 100;
  return `${pct >= 10 || pct === 0 ? Math.round(pct) : pct.toFixed(1)}%`;
}

/** A signed dollar figure — the sign is a word-level cue, never a hue (a standing reader is
 *  red/green colourblind), so the plus is written out. */
export function signedMoney(value: number): string {
  return value > 0 ? `+${money(value)}` : money(value);
}

/** The contract's quoted greeks in the desk's own units, "—" where the feed had none. */
function GreeksLine({
  greeks,
}: {
  readonly greeks: NonNullable<OptionPreview["greeks"]>;
}): ReactElement {
  const cell = (label: string, value: number | undefined, digits: number): string =>
    `${label} ${value === undefined ? "—" : value.toFixed(digits)}`;
  return (
    <p className="gate-row num tkt-greeks">
      {cell("Δ", greeks.delta, 2)} · {cell("Γ", greeks.gamma, 3)} · {cell("Θ", greeks.theta, 2)}
      {" · "}
      {cell("V", greeks.vega, 2)}
    </p>
  );
}
/** The single-leg ticket's body: cost, max loss, breakeven, and the disarm note.
 *
 *  @category trading
 */
export function OptionPreviewBody({ preview }: { readonly preview: OptionPreview }): ReactElement {
  // The order class, its limit and the time in force the server says it will send — the same
  // line the share ticket echoes (#3407 P1); a member never learns the TIF after the fact.
  const tif = tifLabel(preview.timeInForce);
  return (
    <div className="gate-body">
      {preview.occSymbol ? <p className="gate-row num tkt-occ">{preview.occSymbol}</p> : null}
      <p className="gate-row">
        {orderTypeLabel(preview.orderType)}
        {preview.limitPrice !== undefined ? ` · limit ${money(preview.limitPrice)}` : ""}
        {tif ? ` · ${tif}` : ""}
        {/* DTE lands here, not on the chain (Eric, 2026-09-21): a member just picked the date
            themselves, so a chain-header echo of it added nothing — the theta lesson belongs at
            the moment it's actually decision-relevant, reviewing what's about to be sent. */}
        {preview.expiration ? ` · ${expiresIn(daysToExpiry(preview.expiration, new Date()))}` : ""}
      </p>
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
      {preview.ok && preview.greeks ? <GreeksLine greeks={preview.greeks} /> : null}
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
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onMouseDown={keepFocus}
        onClick={onSubmit}
      >
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
      onMouseDown={keepFocus}
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
  if (state.step === "draft") return null;
  if (state.step === "reviewing") return <GateHead tone="checks">Reviewing…</GateHead>;
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
        <GateHead tone="filled">{`Order ${state.result.orderId} ${state.result.status} — ${state.result.symbol}${
          tifLabel(state.result.timeInForce) ? ` · ${tifLabel(state.result.timeInForce)}` : ""
        }`}</GateHead>
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
      <GateHead tone="refused">The gate refused at submit</GateHead>
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
