import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { PlayInfo } from "../live/options";
import {
  buildDraft,
  defaultTimeInForce,
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
  tifLabel,
} from "../live/ticket";
import { DisarmNote, GateHead, keepFocus } from "./gate-frame";
import { LockedPanel } from "./locked-panel";
import { QuoteHeader } from "./quote-header";
import { RecentOrdersStrip } from "./recent-orders-strip";
import { SymbolField } from "./symbol-field";
import { TimeInForceField } from "./tif-field";

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
  // The time in force the server says it will send — never hidden, even when the member left it
  // on the default (#3407 P1: it used to be hard-coded and shown nowhere).
  const tif = tifLabel(preview.timeInForce);
  return (
    <p className="gate-row">
      {orderTypeLabel(preview.orderType)}
      {prices.length ? ` · ${prices.join(" · ")}` : ""}
      {tif ? ` · ${tif}` : ""}
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
        <PreviewBody preview={state.preview} />
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
            SIM account — simulated fill, real discipline. Working orders below update now; the
            blotter and timeline pick the fill up on the next read.
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

/** @category trading */
export function TradeGate({
  deskId,
  initialAction = "buy",
  showSide = true,
  play,
  initialSymbol,
  onSymbolCommit,
}: {
  readonly deskId: string;
  /** `?play=102` preselects Sell — the catalog's stock rungs are the same gate, sided. */
  readonly initialAction?: "buy" | "sell";
  /** False on `/trade`, where the ticket's own nav (#1461) already carries Buy / Sell. */
  readonly showSide?: boolean;
  /**
   * The resolved rung, when the caller has it (#1461's ladder-lock fix, 2026-09-06). Stock plays
   * were never checked here — only the options ticket rendered its locked panel — so 102 opened a
   * fully working sell ticket before 101 was ever earned, in spite of `unlockedCodes` correctly
   * saying it was locked. Undefined callers (none today) get the old, unchecked behavior.
   */
  readonly play?: PlayInfo;
  /** `?symbol=` (#2017 cockpit plan) — seeds the symbol field on mount so a remount (every
   *  Instrument/Side switch keys this component fresh) doesn't drop a hand-typed symbol. */
  readonly initialSymbol?: string;
  /** Fires when the symbol field commits, so the route can keep `?symbol=` in sync. */
  readonly onSymbolCommit?: (symbol: string) => void;
}): ReactElement {
  const [fields, setFields] = useState<TicketFields>({
    symbol: initialSymbol ?? "",
    quantity: "",
    action: initialAction,
    orderType: "market",
    limitPrice: "",
    stopPrice: "",
  });
  const [state, setState] = useState<GateState>({ step: "draft" });
  const queryClient = useQueryClient();
  /** The quote header's own committed symbol (#2017 Phase 0.9) — fetches on COMMIT only, never a
   *  keystroke, mirroring the chain fetch's `chainSym` on the options ticket. */
  const [quoteSym, setQuoteSym] = useState(initialSymbol ?? "");
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
    // The Review button keeps focus (`keepFocus`), so a symbol typed and never blurred commits
    // here — the quote header and `?symbol=` land exactly as the blur would have left them.
    const typed = fields.symbol.trim().toUpperCase();
    if (typed !== "" && typed !== quoteSym) {
      setQuoteSym(typed);
      onSymbolCommit?.(typed);
    }
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
      const result = await submitTicket(draft());
      setState({ step: "done", result });
      // The working-orders section (#3407 P1 slice 2) reads the broker; a sent order should show
      // up there on the same screen, not on the next visit.
      if (result.ok) await queryClient.invalidateQueries({ queryKey: ["desk-orders", deskId] });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  if (play?.locked) return <LockedPanel play={play} />;

  const busy = state.step === "reviewing" || state.step === "submitting";
  return (
    <section className="panel gate-panel" aria-label="New trade">
      <h2 className="panel-title">New trade</h2>
      <p className="panel-sub">
        Paper account · market, limit or stop · the gate reviews before anything is sent
      </p>
      <QuoteHeader symbol={quoteSym} />
      <div className="gate-fields">
        <SymbolField
          id={symId}
          label="Symbol"
          value={fields.symbol}
          placeholder="AAPL"
          maxLength={8}
          onChange={edit("symbol")}
          onCommit={(s) => {
            edit("symbol")(s);
            setQuoteSym(s.trim().toUpperCase());
            onSymbolCommit?.(s);
          }}
        />
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
        {showSide ? (
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
        ) : null}
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
      <TimeInForceField
        fallback={defaultTimeInForce(fields.orderType)}
        value={fields.timeInForce}
        onChange={edit("timeInForce")}
      />
      <p className="gate-note">{orderTypeNote(fields.orderType)}</p>

      {/* Instrument-agnostic (task 3a, unlike the options-chain-only earnings badge/wire-row) —
          this stock ticket gets its own compact "here's what you've done" strip, same relative
          position (right before the status block) as the options ticket's own intel elements. */}
      <RecentOrdersStrip symbol={quoteSym} deskId={deskId} />

      <div className="gate" aria-live="polite">
        <GateStatus state={state} />
      </div>

      {state.step === "reviewed" && state.preview.ok ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onMouseDown={keepFocus}
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
          onMouseDown={keepFocus}
          onClick={review}
        >
          {state.step === "reviewing" ? "Reviewing…" : "Review order"}
        </button>
      )}
    </section>
  );
}
