import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { DeskPosition } from "../live/desk";
import { type OptionDraft, type OptionPreview, reviewOption, submitOption } from "../live/options";
import { money, type TicketResult, tifLabel } from "../live/ticket";

/**
 * CLOSING FROM THE TICKET (#738 phase 10b) — the capability the legacy blotter's Close posts
 * provided, in the shell: the desk's held option contracts, each with the same review-then-
 * confirm discipline as every order. Direction and size resolve SERVER-side from the live
 * holding (a long closes with a sell, a written contract with a buy), so one button is always
 * the right direction — this component only shows what the desk answered.
 *
 * LIMIT CLOSE (#3407 P1 slice 3; closes were market-only): each row carries a Market / Limit
 * choice and, on Limit, the premium per share it will accept. Market stays the default the row
 * always had; the rules warn that a limit at the mark is the disciplined habit. Any edit disarms
 * a standing review — the same doctrine as every gate: approval never outlives what it approved.
 */

type RowState =
  | { readonly step: "idle" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: OptionPreview }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

function CloseRow({
  deskId,
  position,
  onFilled,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly onFilled: () => void;
}): ReactElement {
  const [state, setState] = useState<RowState>({ step: "idle" });
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const priceId = useId();
  const parsedLimit = Number(limitPrice.trim());
  const draft: OptionDraft = {
    kind: "close",
    participantId: deskId,
    occSymbol: position.symbol,
    orderType,
    ...(orderType === "limit" && limitPrice.trim() !== "" && Number.isFinite(parsedLimit)
      ? { limitPrice: parsedLimit }
      : {}),
  };
  /** Any edit disarms a standing review, straight back to idle. */
  const disarm = () => setState((s) => (s.step === "reviewed" ? { step: "idle" } : s));

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewOption(draft);
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };
  const confirm = async () => {
    setState({ step: "submitting" });
    try {
      const result = await submitOption(draft);
      setState({ step: "done", result });
      if (result.ok) onFilled();
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  return (
    <div className="tkt-close-row">
      <span className="tkt-close-main">
        {position.display} <small className="num">{position.symbol}</small>
      </span>
      <span className="num">{position.quantity}</span>
      <span className="num">{position.value}</span>
      <span className="tkt-close-how">
        <fieldset className="toggle-group tkt-close-type" aria-label="Close order type">
          {(["market", "limit"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={orderType === type}
              disabled={state.step === "submitting" || state.step === "done"}
              onClick={() => {
                setOrderType(type);
                disarm();
              }}
            >
              {type === "market" ? "Market" : "Limit"}
            </button>
          ))}
        </fieldset>
        {orderType === "limit" ? (
          <span className="field tkt-close-price">
            <label htmlFor={priceId} className="visually-hidden">
              Limit price per share
            </label>
            <input
              id={priceId}
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={limitPrice}
              placeholder={`≈ ${position.price}`}
              disabled={state.step === "submitting" || state.step === "done"}
              onChange={(e) => {
                setLimitPrice(e.target.value);
                disarm();
              }}
            />
          </span>
        ) : null}
      </span>
      {state.step === "idle" || state.step === "error" ? (
        <button type="button" className="btn mc-btn" onClick={() => void review()}>
          Close…
        </button>
      ) : null}
      {state.step === "reviewing" ? <span className="tkt-close-note">reviewing…</span> : null}
      {state.step === "reviewed" ? (
        state.preview.ok ? (
          <button type="button" className="btn btn-primary mc-btn" onClick={() => void confirm()}>
            Confirm — close {state.preview.contracts}
            {state.preview.orderType === "limit" && state.preview.limitPrice !== undefined
              ? ` · limit ${money(state.preview.limitPrice)}`
              : " · market"}
            {tifLabel(state.preview.timeInForce) ? ` · ${tifLabel(state.preview.timeInForce)}` : ""}
            {state.preview.estNotional !== undefined
              ? ` · est ${money(state.preview.estNotional)}`
              : ""}
          </button>
        ) : (
          <span className="tkt-close-note gate-refusal">✕ {state.preview.refusals[0]}</span>
        )
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

/** The desk's held option contracts, or nothing — a desk with no options shows no card.
 *
 *  @category trading
 */
export function OptionPositionsCard({
  deskId,
  positions,
}: {
  readonly deskId: string;
  readonly positions: readonly DeskPosition[];
}): ReactElement | null {
  const queryClient = useQueryClient();
  const held = positions.filter((p) => p.isOption);
  if (held.length === 0) return null;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
  return (
    <section className="panel gate-panel" aria-label="Option positions">
      <h2 className="panel-title">Option positions</h2>
      <p className="panel-sub">
        Held contracts on this account — Close reviews first, and works out the direction from the
        live holding.
      </p>
      <div className="tkt-close-rows">
        {held.map((position) => (
          <CloseRow key={position.symbol} deskId={deskId} position={position} onFilled={refresh} />
        ))}
      </div>
    </section>
  );
}
