import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import type { VitalGauge, WireTrade } from "../live/wire";

/**
 * ONE ACTIVITY ROW, EXPANDABLE (PR 6, issue #2287) — the plan's "why" (the persona's own stated
 * reasoning) and "vitals" (whether the system that made the call is sustainable) side by side,
 * one click away, the exact `CycleRow` pattern `u.$id.decisions.tsx` already ships: a button +
 * `aria-expanded` + a conditional body, collapsed by default (nothing here is a failure state that
 * demands attention the way a halted/refused decision cycle does).
 *
 * Extracted to its own file rather than grown inline in `activity.tsx`, which is already at the
 * 300-code-line architecture cap (`scripts/arch-scan.mjs`).
 */

/** A budget bar: fill = room left against ITS OWN cap, never the raw value. Word + number always
 *  render regardless of measurement state — hue never carries meaning alone (`docs/BRAND.md`).
 *  The "Budget bar" named UI pattern (see docs/PATTERNS.md), generalized from `.pulse-progress`. */
function GaugeBar({ gauge }: { readonly gauge: VitalGauge }): ReactElement {
  return (
    <div className={`vital-gauge${gauge.measured ? "" : " vital-gauge-unmeasured"}`}>
      <span className="vital-label">{gauge.label}</span>
      <div
        className="budget-bar"
        role="progressbar"
        aria-valuenow={gauge.measured ? Math.round((gauge.fraction ?? 0) * 100) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={gauge.valueText}
      >
        {gauge.measured ? <i style={{ width: `${(gauge.fraction ?? 0) * 100}%` }} /> : null}
      </div>
      <span className="vital-value num">{gauge.valueText}</span>
      {gauge.detailText ? <span className="vital-detail num">{gauge.detailText}</span> : null}
    </div>
  );
}

function TradeReasoning({ trade }: { readonly trade: WireTrade }): ReactElement {
  const { reasoning, vitals } = trade;
  return (
    <div className="wire-trade-body">
      {reasoning ? (
        <div className="wire-trade-why">
          {reasoning.strategy ? <span className="chip chip-bot">{reasoning.strategy}</span> : null}
          <p className="cycle-reason">"{reasoning.reason}"</p>
          {reasoning.expectation ? (
            <p className="cycle-expectation">Expected: {reasoning.expectation}</p>
          ) : null}
          {reasoning.guardDelta ? <p className="wire-guard-delta">{reasoning.guardDelta}</p> : null}
        </div>
      ) : (
        <p className="note">No decision recorded for this fill.</p>
      )}
      {vitals ? (
        <div className="wire-vitals">
          <p className="wire-vitals-h">System vitals — at this decision</p>
          <GaugeBar gauge={vitals.lossHeadroom} />
          <GaugeBar gauge={vitals.edgeVsHold} />
          <GaugeBar gauge={vitals.proof} />
          <GaugeBar gauge={vitals.breadth} />
        </div>
      ) : null}
    </div>
  );
}

export function TradeRow({ trade }: { readonly trade: WireTrade }): ReactElement {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(trade.reasoning || trade.vitals);
  return (
    <li className="wire-trade">
      {/* A `<button>` may never nest an `<a>` (the `Link` below) — that toggle stays a SIBLING
       *  button, not a wrapper, so the row keeps two independently-clickable controls: expand,
       *  and navigate to the trader's profile. */}
      <button
        type="button"
        className="wire-trade-row"
        aria-expanded={expandable ? open : undefined}
        disabled={!expandable}
        onClick={() => setOpen(!open)}
      >
        {expandable ? <span className="wire-disclosure" aria-hidden="true" /> : null}
        <span className={`wire-side tone-${trade.side === "buy" ? "pos" : "neg"}`}>
          {trade.side.toUpperCase()}
        </span>
        <span className="wire-sym">{trade.symbol}</span>
        <span className="num wire-qty">{trade.quantity}</span>
        <span className="num wire-price">{trade.price}</span>
      </button>
      <Link to="/u/$id" params={{ id: trade.whoId }} className="wire-who">
        {trade.who}
      </Link>
      <span className={`chip chip-${trade.kind}`}>{trade.kind === "bot" ? "BOT" : "HUMAN"}</span>
      {trade.reconstructed ? (
        <span className="wire-recon" title="Recovered after the fact, not watched live">
          reconstructed
        </span>
      ) : null}
      <span className="wire-when num">{trade.when}</span>
      {open ? <TradeReasoning trade={trade} /> : null}
    </li>
  );
}
